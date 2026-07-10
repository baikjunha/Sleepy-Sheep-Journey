import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useSettings } from "@/lib/settings";

const NUM_STARS = 60;

const STARS = Array.from({ length: NUM_STARS }).map((_, i) => ({
  id: i,
  size: Math.random() * 2 + 1,
  top: Math.random() * 100,
  left: Math.random() * 100,
  opacity: Math.random() * 0.4 + 0.1,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 5,
}));

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 180000;

export default function SleepScreen() {
  const [, setLocation] = useLocation();
  const { t, language, isNight } = useSettings();
  const [dots, setDots] = useState(".");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hasTriggered = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    const sessionId = sessionStorage.getItem("currentSessionId");
    if (!sessionId) {
      setLocation("/");
      return;
    }

    const sid = parseInt(sessionId);

    async function startGeneration() {
      try {
        await fetch(`/api/sessions/${sid}/generate-sheep`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language }),
        });
      } catch {
        // Ignore network errors — polling will detect completion
      }

      function cleanup() {
        if (pollTimer.current) clearInterval(pollTimer.current);
        if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
      }

      async function checkDone() {
        try {
          const res = await fetch(`/api/sessions/${sid}`);
          if (!res.ok) return;
          const session = (await res.json()) as { sheepId?: number | null };
          if (session.sheepId) {
            cleanup();
            setTimeout(() => {
              setLocation(`/rest/${session.sheepId}`);
            }, 800);
          }
        } catch {
          // Keep polling
        }
      }

      pollTimer.current = setInterval(() => {
        void checkDone();
      }, POLL_INTERVAL_MS);

      timeoutTimer.current = setTimeout(() => {
        cleanup();
        setErrorMsg(t.sleep.timeoutError);
      }, POLL_TIMEOUT_MS);

      void checkDone();
    }

    void startGeneration();

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: isNight ? "#03030f" : "#ede0c8" }}
    >
      {isNight && STARS.map((star) => (
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

      {/* Sheep — large decorative */}
      <div className="relative pointer-events-none z-0 mb-8">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl scale-[2] animate-breathe" />
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Sleeping Sheep" className="w-[44vw] max-w-[220px] max-h-[30vh] h-auto relative animate-float object-contain drop-shadow-2xl opacity-70" />
      </div>

      <div className="z-10 flex flex-col items-center space-y-8">

        {errorMsg ? (
          <div className="text-center px-8 space-y-5">
            <p className="text-muted-foreground/40 font-light text-sm leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => setLocation("/")}
              className="text-muted-foreground/25 text-xs underline underline-offset-4 hover:text-muted-foreground/40 transition-colors"
            >
              {t.sleep.goHome}
            </button>
          </div>
        ) : (
          <p
            className="font-light tracking-[0.2em] text-sm"
            style={{ color: isNight ? "rgba(100, 116, 139, 0.5)" : "rgba(110, 94, 72, 0.6)" }}
          >
            {t.sleep.making}{dots}
          </p>
        )}
      </div>
    </div>
  );
}
