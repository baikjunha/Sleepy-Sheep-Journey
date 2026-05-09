import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  useGenerateEmpathy,
  useSaveTranscriptTurn,
  useUpdateSession,
  useCompleteSession,
} from "@workspace/api-client-react";
import { useSpeech } from "@/hooks/use-speech";
import { SheepIcon } from "@/components/sheep-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, MessageSquare } from "lucide-react";

type SessionState =
  | "idle"
  | "step_1_opening"
  | "step_2_cognitive_dump"
  | "step_3_control_classification"
  | "step_4_small_achievement"
  | "step_5_emotional_lightening"
  | "step_5_5_sheep_seed"
  | "step_6_sleep_transition"
  | "generating_sheep";

const STEP_ORDER = [
  "step_1_opening",
  "step_2_cognitive_dump",
  "step_3_control_classification",
  "step_4_small_achievement",
  "step_5_emotional_lightening",
  "step_5_5_sheep_seed",
  "step_6_sleep_transition",
];

const getStepNumber = (state: string) => {
  const index = STEP_ORDER.indexOf(state);
  return index >= 0 ? index + 1 : 1;
};

export default function SessionScreen() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentState, setCurrentState] = useState<SessionState>("idle");
  const [sheepText, setSheepText] = useState("");
  const [isTextInput, setIsTextInput] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [contextTurns, setContextTurns] = useState<{ role: string; text: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasProblemRef = useRef<boolean>(false);

  const generateEmpathy = useGenerateEmpathy();
  const saveTranscriptTurn = useSaveTranscriptTurn();
  const updateSession = useUpdateSession();
  const completeSession = useCompleteSession();

  const { speak, isSpeaking, startListening, stopListening, isListening, transcript, interimTranscript } =
    useSpeech();

  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noInputTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStarted = useRef(false);

  const clearTimers = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    if (noInputTimer.current) clearTimeout(noInputTimer.current);
  }, []);

  useEffect(() => {
    const idStr = sessionStorage.getItem("currentSessionId");
    if (!idStr) {
      setLocation("/");
      return;
    }
    setSessionId(parseInt(idStr));
    setCurrentState("step_1_opening");
  }, [setLocation]);

  const startNoInputTimer = useCallback(
    (onFallback: () => void) => {
      clearTimers();
      noInputTimer.current = setTimeout(onFallback, 18000);
    },
    [clearTimers],
  );

  const handleSheepSpeak = useCallback(
    async (text: string, stepKey: string, sid: number, onFinished: () => void) => {
      setSheepText(text);
      await saveTranscriptTurn.mutateAsync({
        id: sid,
        data: { role: "sheep", step: stepKey, text },
      });
      setContextTurns((prev) => [...prev, { role: "sheep", text }]);
      speak(text, onFinished);
    },
    [speak, saveTranscriptTurn],
  );

  const handleFallback = useCallback(
    async (sid: number) => {
      clearTimers();
      stopListening();
      const msg = "편안한 밤 되세요.";
      setSheepText(msg);
      await updateSession.mutateAsync({
        id: sid,
        data: { sleepFallbackTriggered: true, status: "completed" },
      });
      speak(msg, () => {
        setCurrentState("generating_sheep");
        completeSession.mutateAsync({ id: sid, data: { status: "completed", sleepFallbackTriggered: true } }).then(() => {
          setLocation("/sleep");
        });
      });
    },
    [clearTimers, stopListening, speak, updateSession, completeSession, setLocation],
  );

  const beginListening = useCallback(
    (sid: number) => {
      startListening(() => {});
      startNoInputTimer(() => handleFallback(sid));
    },
    [startListening, startNoInputTimer, handleFallback],
  );

  const handleUserSubmit = useCallback(
    async (text: string, sid: number, state: SessionState) => {
      if (!text.trim() || isProcessing) return;
      clearTimers();
      stopListening();
      setIsProcessing(true);
      setIsTextInput(false);
      setTextValue("");

      const cleanText = text.trim();
      setContextTurns((prev) => [...prev, { role: "user", text: cleanText }]);

      const stepKey = state.replace("_opening", "").replace("_cognitive_dump", "").replace("_control_classification", "").replace("_small_achievement", "").replace("_emotional_lightening", "").replace("_sheep_seed", "").replace("_sleep_transition", "");

      await saveTranscriptTurn.mutateAsync({
        id: sid,
        data: { role: "user", step: state, text: cleanText },
      });

      try {
        if (state === "step_1_opening") {
          const res = await generateEmpathy.mutateAsync({
            id: sid,
            data: { step: "step_2", userText: cleanText },
          });
          hasProblemRef.current = res.hasProblem ?? false;

          const msg =
            (res.text || "") +
            " 머릿속을 가볍게 비우고 잠에 들기 위해, 가장 신경 쓰였지만 해결하지 못한 문제 딱 하나만 편하게 말씀해 주시겠어요. 없으시다면 없다라고 편하게 이야기해 주세요.";
          setCurrentState("step_2_cognitive_dump");
          updateSession.mutate({ id: sid, data: { currentStep: "step_2_cognitive_dump" } });
          handleSheepSpeak(msg, "step_2", sid, () => beginListening(sid));
        } else if (state === "step_2_cognitive_dump") {
          if (hasProblemRef.current) {
            const res = await generateEmpathy.mutateAsync({
              id: sid,
              data: { step: "step_3", userText: cleanText },
            });
            const msg =
              (res.text || "") +
              " 적어주신 그 문제는 지금 당장 해결할 수 있는 일인가요. 만약 당장 해결하기 어렵다면 왜 그런지, 반대로 내일 해결할 수 있다면 내일 아침 가장 먼저 해볼 아주 작은 행동 하나만 알려주세요.";
            setCurrentState("step_3_control_classification");
            updateSession.mutate({ id: sid, data: { currentStep: "step_3_control_classification" } });
            handleSheepSpeak(msg, "step_3", sid, () => beginListening(sid));
          } else {
            const res = await generateEmpathy.mutateAsync({
              id: sid,
              data: { step: "step_4", userText: cleanText, contextTurns: contextTurns.slice(-4) },
            });
            const msg =
              (res.text || "") +
              " 다음으로는 오늘 스스로에게 잘했다고 칭찬해 주고 싶은 아주 작은 성취가 있다면 하나만 공유해 주세요. 정말 작아도 좋고, 만약 떠오르지 않는다면 없다고 쿨하게 넘어가셔도 좋습니다.";
            setCurrentState("step_4_small_achievement");
            updateSession.mutate({ id: sid, data: { currentStep: "step_4_small_achievement" } });
            handleSheepSpeak(msg, "step_4", sid, () => beginListening(sid));
          }
        } else if (state === "step_3_control_classification") {
          const res = await generateEmpathy.mutateAsync({
            id: sid,
            data: { step: "step_4", userText: cleanText, contextTurns: contextTurns.slice(-6) },
          });
          const msg =
            (res.text || "") +
            " 다음으로는 오늘 스스로에게 잘했다고 칭찬해 주고 싶은 아주 작은 성취가 있다면 하나만 공유해 주세요. 정말 작아도 좋고, 만약 떠오르지 않는다면 없다고 쿨하게 넘어가셔도 좋습니다.";
          setCurrentState("step_4_small_achievement");
          updateSession.mutate({ id: sid, data: { currentStep: "step_4_small_achievement" } });
          handleSheepSpeak(msg, "step_4", sid, () => beginListening(sid));
        } else if (state === "step_4_small_achievement") {
          const res = await generateEmpathy.mutateAsync({
            id: sid,
            data: { step: "step_5", userText: cleanText },
          });
          const msg =
            (res.text || "") +
            " 오늘 하루를 돌아보며 픽 웃음이 났던 순간이 있었나요. 없으셨다면, 어떤 일이 일어났을 때 가장 기분 좋게 웃으실 수 있을지 자유롭게 상상해서 말씀해 주세요.";
          setCurrentState("step_5_emotional_lightening");
          updateSession.mutate({ id: sid, data: { currentStep: "step_5_emotional_lightening" } });
          handleSheepSpeak(msg, "step_5", sid, () => beginListening(sid));
        } else if (state === "step_5_emotional_lightening") {
          const res = await generateEmpathy.mutateAsync({
            id: sid,
            data: { step: "step_5_5", userText: cleanText },
          });
          const msg =
            (res.text || "") +
            " 떠올려주신 기억에 기분 좋은 에너지를 담아, 오늘 밤 사용자님을 지켜줄 예쁜 양을 한 마리 만들려고 해요. 이 양에게 가장 입혀주고 싶은 포근한 색깔이나 촉감이 있다면 하나만 골라주시겠어요.";
          setCurrentState("step_5_5_sheep_seed");
          updateSession.mutate({ id: sid, data: { currentStep: "step_5_5_sheep_seed" } });
          handleSheepSpeak(msg, "step_5_5", sid, () => beginListening(sid));
        } else if (state === "step_5_5_sheep_seed") {
          const res = await generateEmpathy.mutateAsync({
            id: sid,
            data: { step: "step_6", userText: cleanText },
          });
          const msg =
            res.text ||
            "포근한 양을 만들어드릴게요. 이제 눈을 감고 편안한 밤 되세요.";
          setCurrentState("step_6_sleep_transition");
          updateSession.mutate({ id: sid, data: { currentStep: "step_6_sleep_transition" } });
          handleSheepSpeak(msg, "step_6", sid, () => {
            setCurrentState("generating_sheep");
            completeSession.mutateAsync({ id: sid, data: { status: "completed" } }).then(() => {
              setLocation("/sleep");
            });
          });
        }
      } catch (e) {
        console.error("API error in step", state, e);
        handleFallback(sid);
      } finally {
        setIsProcessing(false);
      }
    },
    [
      isProcessing,
      clearTimers,
      stopListening,
      saveTranscriptTurn,
      generateEmpathy,
      updateSession,
      completeSession,
      contextTurns,
      handleSheepSpeak,
      handleFallback,
      beginListening,
      setLocation,
    ],
  );

  useEffect(() => {
    if (currentState === "step_1_opening" && sessionId && !hasStarted.current) {
      hasStarted.current = true;
      const msg = "오늘 하루는 어떠셨나요.";
      setSheepText(msg);
      saveTranscriptTurn.mutateAsync({
        id: sessionId,
        data: { role: "sheep", step: "step_1", text: msg },
      }).then(() => {
        setContextTurns([{ role: "sheep", text: msg }]);
        speak(msg, () => beginListening(sessionId));
      });
    }
  }, [currentState, sessionId]);

  useEffect(() => {
    if (isListening && transcript && sessionId) {
      clearTimers();
      silenceTimer.current = setTimeout(() => {
        const captured = transcript;
        stopListening();
        handleUserSubmit(captured, sessionId, currentState);
      }, 4000);
    }
  }, [transcript, interimTranscript]);

  const handleTextSubmit = () => {
    if (textValue.trim() && sessionId) {
      handleUserSubmit(textValue, sessionId, currentState);
    }
  };

  const currentStepNum = getStepNumber(currentState);
  const totalSteps = 6;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 px-6 pt-8 flex items-center justify-between z-10">
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              data-testid={`step-indicator-${i}`}
              className={`h-0.5 rounded-full transition-all duration-700 ${
                i < currentStepNum ? "w-8 bg-primary/70" : "w-4 bg-muted/40"
              }`}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          data-testid="toggle-text-input"
          onClick={() => setIsTextInput((v) => !v)}
          className="text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100"
        >
          {isTextInput ? <Mic className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex flex-col items-center max-w-md w-full mt-16">
        <div className="relative mb-14 flex justify-center items-center">
          {isSpeaking && (
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse scale-[2]" />
          )}
          {isListening && (
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl animate-pulse scale-[1.8]" />
          )}
          <SheepIcon
            className={`w-28 h-28 transition-all duration-1000 relative z-10 ${
              isSpeaking
                ? "text-primary/80 drop-shadow-[0_0_20px_rgba(147,197,253,0.3)]"
                : isListening
                  ? "text-emerald-400/70"
                  : isProcessing
                    ? "text-muted-foreground/60 animate-pulse"
                    : "text-muted-foreground/40"
            }`}
          />
        </div>

        <div className="min-h-[140px] w-full text-center flex flex-col justify-center px-2">
          <p className="text-xl font-serif leading-loose text-slate-200/90 transition-opacity duration-700">
            {sheepText}
          </p>
        </div>

        <div className="mt-10 w-full min-h-[100px] flex flex-col items-center justify-start">
          {isTextInput ? (
            <div className="w-full flex items-center gap-2">
              <Input
                data-testid="text-input"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                placeholder="텍스트로 대답하기..."
                className="bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground/50"
                autoFocus
                disabled={isProcessing || isSpeaking}
              />
              <Button
                data-testid="submit-text"
                size="icon"
                onClick={handleTextSubmit}
                disabled={!textValue.trim() || isProcessing || isSpeaking}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center w-full max-w-[280px]">
              {isListening ? (
                <div className="flex flex-col items-center" data-testid="listening-state">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 animate-pulse">
                    <Mic className="w-4 h-4 text-emerald-400/80" />
                  </div>
                  <p className="text-slate-500 text-xs mb-2 tracking-widest uppercase font-light">
                    듣고 있어요
                  </p>
                  <p className="text-slate-400 min-h-[40px] font-light text-sm leading-relaxed">
                    {interimTranscript || transcript}
                  </p>
                </div>
              ) : isSpeaking ? (
                <div className="flex flex-col items-center opacity-60" data-testid="speaking-state">
                  <p className="text-xs text-primary/80 tracking-widest uppercase">
                    양이 이야기하고 있어요
                  </p>
                </div>
              ) : isProcessing ? (
                <div className="flex flex-col items-center opacity-50" data-testid="processing-state">
                  <div className="w-5 h-5 border border-primary/50 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs text-muted-foreground">생각하고 있어요</p>
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-20" data-testid="idle-mic-state">
                  <MicOff className="w-4 h-4 mb-2" />
                  <p className="text-xs">마이크가 꺼져 있습니다</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
