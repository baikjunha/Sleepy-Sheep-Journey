import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSession } from "@workspace/api-client-react";
import { Loader2, Moon, History, Settings } from "lucide-react";
import { useSettings } from "@/lib/settings";

const HOME_STARS = [
  { size: 2, top: 8, left: 13, delay: 0 },
  { size: 3, top: 15, left: 77, delay: 1.2 },
  { size: 2, top: 22, left: 20, delay: 0.6 },
  { size: 2, top: 12, left: 50, delay: 2.1 },
  { size: 3, top: 33, left: 84, delay: 1.7 },
  { size: 2, top: 29, left: 10, delay: 0.3 },
  { size: 2, top: 50, left: 85, delay: 2.6 },
  { size: 2, top: 70, left: 16, delay: 1.1 },
  { size: 2, top: 78, left: 79, delay: 1.9 },
  { size: 2, top: 60, left: 45, delay: 0.9 },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const createSession = useCreateSession();
  const [isStarting, setIsStarting] = useState(false);
  const { t, isNight } = useSettings();

  const handleStart = () => {
    setIsStarting(true);
    createSession.mutate(
      { data: {} },
      {
        onSuccess: (session) => {
          sessionStorage.setItem("currentSessionId", session.id.toString());
          setLocation("/session");
        },
        onError: () => {
          setIsStarting(false);
        },
      }
    );
  };

  const colors = isNight
    ? {
        background:
          "radial-gradient(125% 75% at 50% 18%, #2c2553 0%, #1d1839 44%, #100e1f 100%)",
        label: "#8d84c2",
        title: "#f5f2ff",
        subtitle: "#aaa3d2",
        chipColor: "#9890c4",
        chipBg: "rgba(255,255,255,0.05)",
        privacy: "rgba(170,163,210,0.4)",
        gear: "rgba(170,163,210,0.55)",
        gearBg: "rgba(255,255,255,0.05)",
        buttonBg: "linear-gradient(135deg, #8275e8 0%, #5b4fc6 100%)",
        buttonShadow: "0 10px 26px rgba(108,88,224,0.42)",
        buttonText: "#ffffff",
      }
    : {
        background:
          "radial-gradient(125% 75% at 50% 18%, #f7eedd 0%, #f0e4cd 44%, #e7d8bd 100%)",
        label: "#a08c6f",
        title: "#4a3f31",
        subtitle: "#8a795f",
        chipColor: "#7a6a52",
        chipBg: "rgba(0,0,0,0.05)",
        privacy: "rgba(110,94,72,0.5)",
        gear: "rgba(110,94,72,0.6)",
        gearBg: "rgba(0,0,0,0.05)",
        buttonBg: "linear-gradient(135deg, #e3b063 0%, #cf9445 100%)",
        buttonShadow: "0 10px 26px rgba(176,124,51,0.3)",
        buttonText: "#3a2a12",
      };

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden"
      style={{ background: colors.background }}
    >
      {/* Twinkling lavender stars — night only */}
      {isNight &&
        HOME_STARS.map((star, i) => (
          <div
            key={i}
            className="star"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              backgroundColor: "#d4cef7",
              animationDuration: "4.5s",
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}

      {/* Settings button */}
      <button
        onClick={() => setLocation("/settings")}
        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 hover:rotate-45"
        style={{ color: colors.gear, background: colors.gearBg }}
        aria-label={t.settings.title}
      >
        <Settings className="w-[19px] h-[19px]" />
      </button>

      {/* Centered content column */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm flex-1 text-center">
        {/* Title block */}
        <div className="mt-20">
          <img
            src="/logo.png"
            alt="Sleeping Sheep"
            className="w-32 h-32 mx-auto mb-4 object-contain animate-float drop-shadow-2xl"
          />
          <div className="text-[11px] tracking-[0.32em] font-medium" style={{ color: colors.label }}>
            sleeping sheep
          </div>
          <h1
            className="mt-5 text-[1.65rem] leading-snug font-light"
            style={{ color: colors.title }}
          >
            {t.home.titleLine1}
            <br />
            {t.home.titleLine2}
          </h1>
          <p className="mt-4 text-sm leading-relaxed font-light" style={{ color: colors.subtitle }}>
            {t.home.subtitle1}
            <br />
            {t.home.subtitle2}
          </p>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="w-full pb-2">
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="w-full h-14 rounded-[20px] text-base font-medium tracking-[0.06em] flex items-center justify-center gap-2.5 transition-transform duration-300 hover:scale-[1.015] active:scale-[0.99] disabled:opacity-70"
            style={{
              background: colors.buttonBg,
              boxShadow: colors.buttonShadow,
              color: colors.buttonText,
            }}
          >
            {isStarting ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
            {isStarting ? t.home.preparing : t.home.start}
          </button>

          <div className="flex justify-center mt-5">
            <button
              onClick={() => setLocation("/history")}
              className="flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-[14px] transition-colors duration-300"
              style={{ color: colors.chipColor, background: colors.chipBg }}
            >
              <History className="w-[15px] h-[15px]" />
              {t.home.pastSheep}
            </button>
          </div>

          {/* Privacy note */}
          <p
            className="mt-6 text-[11px] leading-relaxed font-light px-6"
            style={{ color: colors.privacy }}
          >
            {t.home.privacy}
          </p>
        </div>
      </div>
    </div>
  );
}
