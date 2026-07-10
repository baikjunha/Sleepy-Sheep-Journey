import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useGetSheep,
  getGetSheepQueryKey,
} from "@workspace/api-client-react";
import { useSettings } from "@/lib/settings";

const TOTAL_MS = 5 * 60 * 1000;
const FADE_START_MS = 20 * 1000;

const STARS = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  size: Math.random() * 2 + 1,
  top: Math.random() * 100,
  left: Math.random() * 100,
  opacity: Math.random() * 0.4 + 0.1,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 5,
}));

export default function RestScreen() {
  const [, params] = useRoute("/rest/:id");
  const [, setLocation] = useLocation();
  const { t, isNight } = useSettings();
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: sheep } = useGetSheep(id, {
    query: {
      enabled: !!id,
      queryKey: getGetSheepQueryKey(id),
    },
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeOutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dimming, setDimming] = useState(false);
  const [finished, setFinished] = useState(false);

  // Start the music (muted-safe) and set up the gentle fade + auto-off timers.
  useEffect(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sleep-music.mp3`);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    let cancelled = false;
    void audio.play().catch(() => {
      // Autoplay may be blocked until the user interacts; a tap resumes it.
    });

    // Fade music in softly over ~8s.
    const fadeInTimer = setInterval(() => {
      if (cancelled) return;
      if (audio.volume < 0.6) {
        audio.volume = Math.min(0.6, audio.volume + 0.02);
      } else {
        clearInterval(fadeInTimer);
      }
    }, 250);

    const dimTimer = setTimeout(() => setDimming(true), FADE_START_MS);

    // Fade music out over the final ~30s and end.
    const fadeOutStart = TOTAL_MS - 30000;
    const fadeOutTimer = setTimeout(() => {
      fadeOutIntervalRef.current = setInterval(() => {
        if (audio.volume > 0.02) {
          audio.volume = Math.max(0, audio.volume - 0.02);
        } else if (fadeOutIntervalRef.current) {
          clearInterval(fadeOutIntervalRef.current);
          fadeOutIntervalRef.current = null;
        }
      }, 500);
    }, fadeOutStart);

    const endTimer = setTimeout(() => {
      audio.pause();
      setFinished(true);
    }, TOTAL_MS);

    return () => {
      cancelled = true;
      clearInterval(fadeInTimer);
      clearTimeout(dimTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(endTimer);
      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
        fadeOutIntervalRef.current = null;
      }
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Ensure playback resumes if autoplay was blocked, on first interaction.
  const resumeAudio = () => {
    const audio = audioRef.current;
    if (audio && audio.paused && !finished) {
      void audio.play().catch(() => {});
    }
  };

  const emotions = sheep?.spec?.dominantEmotions ?? [];
  const summary = sheep?.spec?.emotionSummary ?? "";

  // Final "app off" state — a quiet black screen with a single gentle way back.
  if (finished) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-black text-center px-8"
        onClick={() => setLocation("/")}
      >
        <p className="text-white/12 text-sm font-light tracking-[0.3em] animate-pulse">
          {t.rest.goodNight}
        </p>
        <button
          onClick={() => setLocation("/")}
          className="mt-10 text-white/10 text-[11px] tracking-wider hover:text-white/25 transition-colors"
        >
          {t.rest.screenOn}
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={resumeAudio}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-8 text-center"
      style={{ backgroundColor: isNight ? "#03030f" : "#ede0c8" }}
    >
      {/* Stars — night only */}
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

      {/* Emotion summary */}
      <div className="relative z-10 flex flex-col items-center max-w-sm">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Sleeping Sheep"
          className="w-24 h-24 object-contain mb-8 animate-float opacity-90"
        />

        <p className="text-[11px] tracking-[0.32em] text-primary/40 font-medium uppercase mb-5">
          {t.rest.emotionTitle}
        </p>

        {emotions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {emotions.map((emotion, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full bg-foreground/[0.05] border border-foreground/[0.08] text-foreground/60 text-xs tracking-wide font-light"
              >
                {emotion}
              </span>
            ))}
          </div>
        )}

        {summary ? (
          <p className="text-base font-light leading-relaxed text-foreground/75 mb-2">
            {summary}
          </p>
        ) : (
          <p className="text-base font-light leading-relaxed text-foreground/70 mb-2">
            {t.rest.defaultSummary}
          </p>
        )}

        <p className="text-sm font-light leading-relaxed text-muted-foreground/40 mt-4">
          {t.rest.closeEyes1}
          <br />
          {t.rest.closeEyes2}
        </p>

        <p className="text-[11px] text-muted-foreground/20 font-light mt-12 tracking-wider">
          {t.rest.musicNote}
        </p>
      </div>

      {/* Gradual darkening overlay — fades to near-black over the full duration */}
      <div
        className="absolute inset-0 bg-black pointer-events-none z-20"
        style={{
          opacity: dimming ? 0.97 : 0,
          transition: `opacity ${(TOTAL_MS - FADE_START_MS) / 1000}s linear`,
        }}
      />
    </div>
  );
}
