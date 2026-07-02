import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  useGenerateEmpathy,
  useSaveTranscriptTurn,
  useUpdateSession,
  useCompleteSession,
} from "@workspace/api-client-react";
import { useSpeech } from "@/hooks/use-speech";
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

// Generated once at module scope so star positions stay fixed across re-renders
// (the session re-renders constantly during speech; regenerating would make them jump).
const SESSION_STARS = Array.from({ length: 30 }).map((_, i) => ({
  id: i,
  size: Math.random() * 2 + 0.5,
  top: Math.random() * 100,
  left: Math.random() * 100,
  opacity: Math.random() * 0.2 + 0.05,
  duration: Math.random() * 5 + 4,
  delay: Math.random() * 5,
}));

function VoiceOrb({
  level,
  tone,
  active,
}: {
  level: number;
  tone: "speak" | "listen" | "idle";
  active: boolean;
}) {
  // lavender for the sheep's voice, emerald while listening
  const rgb = tone === "listen" ? "16, 185, 129" : "150, 128, 238";
  const core = 132;
  const scale = 1 + level * 0.55;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      {/* Expanding ripple rings */}
      {active &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute rounded-full ripple-ring"
            style={{
              width: core,
              height: core,
              border: `1px solid rgba(${rgb}, 0.35)`,
              animationDelay: `${i * 1.15}s`,
            }}
          />
        ))}

      {/* Soft outer glow that swells with the voice */}
      <div
        className="absolute rounded-full blur-2xl"
        style={{
          width: core * 1.7,
          height: core * 1.7,
          background: `radial-gradient(circle, rgba(${rgb}, ${0.1 + level * 0.28}) 0%, rgba(${rgb}, 0) 70%)`,
          transform: `scale(${scale})`,
          transition: "transform 90ms ease-out",
        }}
      />

      {/* Core orb */}
      <div
        className="absolute rounded-full"
        style={{
          width: core,
          height: core,
          background: `radial-gradient(circle at 50% 42%, rgba(${rgb}, 0.5) 0%, rgba(${rgb}, 0.14) 60%, rgba(${rgb}, 0) 100%)`,
          transform: `scale(${scale})`,
          boxShadow: `0 0 ${28 + level * 70}px rgba(${rgb}, ${0.18 + level * 0.32})`,
          transition: "transform 90ms ease-out, box-shadow 90ms ease-out",
        }}
      />

      {/* Steady inner dot with a gentle idle breath */}
      <div
        className={`absolute rounded-full ${active ? "" : "animate-breathe"}`}
        style={{
          width: 44,
          height: 44,
          background: `radial-gradient(circle, rgba(${rgb}, 0.6) 0%, rgba(${rgb}, 0.2) 100%)`,
        }}
      />
    </div>
  );
}

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

  const { speak, isSpeaking, startListening, stopListening, isListening, transcript, interimTranscript, audioLevel, micBlocked } =
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
      // Mic unusable: stay in text-input mode and don't arm the
      // "fell asleep" fallback — the user is answering by typing.
      if (micBlocked) return;
      startListening(() => {});
      startNoInputTimer(() => handleFallback(sid));
    },
    [micBlocked, startListening, startNoInputTimer, handleFallback],
  );

  const handleUserSubmit = useCallback(
    async (text: string, sid: number, state: SessionState) => {
      if (!text.trim() || isProcessing) return;
      clearTimers();
      stopListening();
      setIsProcessing(true);
      // Keep text mode if the mic is unusable — otherwise the next turn
      // would strand the user with no way to answer.
      setIsTextInput(micBlocked);
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
      micBlocked,
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
    } else if (isListening && interimTranscript) {
      // The user is mid-sentence — don't let the no-input fallback fire.
      if (noInputTimer.current) clearTimeout(noInputTimer.current);
    }
  }, [transcript, interimTranscript]);

  // Mic unavailable (permission denied / unsupported browser): switch to
  // text input so the conversation can continue, and stop the fallback
  // timer that would otherwise silently end the session.
  useEffect(() => {
    if (micBlocked) {
      clearTimers();
      setIsTextInput(true);
    }
  }, [micBlocked, clearTimers]);

  // While typing, the 18s "fell asleep" fallback shouldn't end the session.
  const handleToggleTextInput = () => {
    setIsTextInput((v) => {
      const next = !v;
      if (next) {
        clearTimers();
        stopListening();
      } else if (sessionId && !isSpeaking && !isProcessing) {
        beginListening(sessionId);
      }
      return next;
    });
  };

  const handleTextSubmit = () => {
    if (textValue.trim() && sessionId) {
      handleUserSubmit(textValue, sessionId, currentState);
    }
  };

  const currentStepNum = getStepNumber(currentState);
  const totalSteps = 6;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-background to-background pointer-events-none" />

      {/* Stars */}
      {SESSION_STARS.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            top: `${star.top}%`,
            left: `${star.left}%`,
            opacity: star.opacity,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {/* Top bar: step indicator + input toggle */}
      <div className="w-full px-6 pt-8 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                data-testid={`step-indicator-${i}`}
                className={`rounded-full transition-all duration-700 ${
                  i < currentStepNum
                    ? "w-6 h-1 bg-primary/50"
                    : i === currentStepNum
                      ? "w-4 h-1 bg-muted-foreground/20"
                      : "w-2 h-1 bg-muted/30"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground/25 font-sans font-light tracking-wider">
            {currentStepNum} / {totalSteps}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          data-testid="toggle-text-input"
          onClick={handleToggleTextInput}
          className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors duration-300"
        >
          {isTextInput ? <Mic className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        </Button>
      </div>

      {/* Voice-reactive orb — gently ripples with the sheep's voice */}
      <div className="relative flex justify-center items-center pointer-events-none mt-14 mb-2">
        <VoiceOrb
          level={audioLevel}
          tone={isListening ? "listen" : isSpeaking ? "speak" : "idle"}
          active={isSpeaking || isListening}
        />
      </div>

      {/* Text + controls */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full px-6 relative z-10">
        {/* Sheep text — small narration subtitle */}
        <div className="min-h-[64px] w-full text-center flex flex-col justify-center">
          <p className="text-sm font-light leading-relaxed tracking-wide text-foreground/55 max-w-xs mx-auto transition-opacity duration-700">
            {sheepText}
          </p>
        </div>

        {/* Input area / state display */}
        <div className="mt-6 w-full min-h-[80px] flex flex-col items-center justify-start relative z-20">
          {isTextInput ? (
            <div className="w-full flex items-center gap-2">
              <Input
                data-testid="text-input"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                placeholder="텍스트로 대답하기..."
                className="bg-white/[0.03] border-white/[0.06] text-foreground placeholder:text-muted-foreground/30 rounded-xl"
                autoFocus
                disabled={isProcessing || isSpeaking}
              />
              <Button
                data-testid="submit-text"
                size="icon"
                onClick={handleTextSubmit}
                disabled={!textValue.trim() || isProcessing || isSpeaking}
                className="bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center w-full max-w-[280px]">
              {isListening ? (
                <div className="flex flex-col items-center" data-testid="listening-state">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/8 border border-emerald-500/10 flex items-center justify-center mb-3 animate-breathe">
                    <Mic className="w-3.5 h-3.5 text-emerald-400/60" />
                  </div>
                  <p className="text-muted-foreground/30 text-[10px] mb-2 tracking-[0.2em] uppercase font-light">
                    듣고 있어요
                  </p>
                  <p className="text-foreground/50 min-h-[40px] font-light text-sm leading-relaxed">
                    {interimTranscript || transcript}
                  </p>
                </div>
              ) : isSpeaking ? (
                <div className="flex flex-col items-center" data-testid="speaking-state">
                  <p className="text-[10px] text-primary/40 tracking-[0.2em] uppercase font-light">
                    양이 말하는 중
                  </p>
                </div>
              ) : isProcessing ? (
                <div className="flex flex-col items-center" data-testid="processing-state">
                  <div className="w-5 h-5 border border-primary/20 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-[10px] text-muted-foreground/30 tracking-wider">생각하고 있어요</p>
                </div>
              ) : (
                <div className="flex flex-col items-center" data-testid="idle-mic-state">
                  <MicOff className="w-3.5 h-3.5 mb-2 text-muted-foreground/15" />
                  <p className="text-[10px] text-muted-foreground/15">마이크가 꺼져 있습니다</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
