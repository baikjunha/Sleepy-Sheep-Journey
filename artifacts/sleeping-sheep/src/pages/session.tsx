import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  useConverse,
  useSaveTranscriptTurn,
  useUpdateSession,
  useCompleteSession,
} from "@workspace/api-client-react";
import { useSpeech } from "@/hooks/use-speech";
import { useSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, MessageSquare } from "lucide-react";

type SessionState = "idle" | "conversing" | "generating_sheep";

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

  const userTurnCountRef = useRef<number>(0);

  const converse = useConverse();
  const saveTranscriptTurn = useSaveTranscriptTurn();
  const updateSession = useUpdateSession();
  const completeSession = useCompleteSession();

  const { t, language, sttLocale, isNight } = useSettings();

  const { speak, isSpeaking, startListening, stopListening, isListening, transcript, interimTranscript, audioLevel, micBlocked } =
    useSpeech(sttLocale);

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
    setCurrentState("conversing");
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
      const msg = t.session.fallbackGoodnight;
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
    [clearTimers, stopListening, speak, updateSession, completeSession, setLocation, t],
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
      const history = contextTurns.slice(-16);
      setContextTurns((prev) => [...prev, { role: "user", text: cleanText }]);
      userTurnCountRef.current += 1;

      try {
        await saveTranscriptTurn.mutateAsync({
          id: sid,
          data: { role: "user", step: "free", text: cleanText },
        });

        const res = await converse.mutateAsync({
          id: sid,
          data: {
            userText: cleanText,
            userTurnCount: userTurnCountRef.current,
            contextTurns: history,
            language,
          },
        });

        const msg = res.text || t.session.fallbackGoodnight;

        if (res.shouldEnd) {
          await handleSheepSpeak(msg, "free", sid, () => {
            setCurrentState("generating_sheep");
            completeSession.mutateAsync({ id: sid, data: { status: "completed" } }).then(() => {
              setLocation("/sleep");
            });
          });
        } else {
          await handleSheepSpeak(msg, "free", sid, () => beginListening(sid));
        }
      } catch (e) {
        console.error("API error in conversation", e);
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
      converse,
      completeSession,
      contextTurns,
      handleSheepSpeak,
      handleFallback,
      beginListening,
      setLocation,
      t,
      language,
    ],
  );

  useEffect(() => {
    if (currentState === "conversing" && sessionId && !hasStarted.current) {
      hasStarted.current = true;
      const msg = t.session.opening;
      setSheepText(msg);
      saveTranscriptTurn.mutateAsync({
        id: sessionId,
        data: { role: "sheep", step: "free", text: msg },
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
      // Mic unusable: voice mode would be a dead end, so stay in text mode.
      if (micBlocked) return true;
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-background to-background pointer-events-none" />

      {/* Stars — night only */}
      {isNight && SESSION_STARS.map((star) => (
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

      {/* Top bar: input toggle */}
      <div className="w-full px-6 pt-8 flex items-center justify-end z-20 relative">
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
                placeholder={t.session.textPlaceholder}
                className="bg-foreground/[0.03] border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/30 rounded-xl"
                autoFocus
                disabled={isProcessing || isSpeaking}
              />
              <Button
                data-testid="submit-text"
                size="icon"
                onClick={handleTextSubmit}
                disabled={!textValue.trim() || isProcessing || isSpeaking}
                className="bg-foreground/[0.05] hover:bg-foreground/[0.08] border border-foreground/[0.08] rounded-xl"
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
                    {t.session.listening}
                  </p>
                  <p className="text-foreground/50 min-h-[40px] font-light text-sm leading-relaxed">
                    {interimTranscript || transcript}
                  </p>
                </div>
              ) : isSpeaking ? (
                <div className="flex flex-col items-center" data-testid="speaking-state">
                  <p className="text-[10px] text-primary/40 tracking-[0.2em] uppercase font-light">
                    {t.session.sheepSpeaking}
                  </p>
                </div>
              ) : isProcessing ? (
                <div className="flex flex-col items-center" data-testid="processing-state">
                  <div className="w-5 h-5 border border-primary/20 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-[10px] text-muted-foreground/30 tracking-wider">{t.session.thinking}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center" data-testid="idle-mic-state">
                  <MicOff className="w-3.5 h-3.5 mb-2 text-muted-foreground/15" />
                  <p className="text-[10px] text-muted-foreground/15">{t.session.micOff}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
