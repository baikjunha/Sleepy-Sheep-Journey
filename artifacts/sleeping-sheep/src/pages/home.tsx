import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSession } from "@workspace/api-client-react";
import { Loader2, Moon, History } from "lucide-react";

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

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(125% 75% at 50% 18%, #2c2553 0%, #1d1839 44%, #100e1f 100%)",
      }}
    >
      {/* Twinkling lavender stars */}
      {HOME_STARS.map((star, i) => (
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

      {/* Centered content column */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm flex-1 text-center">
        {/* Sheep illustration with soft purple glow */}
        <div className="relative pointer-events-none mt-12 flex items-center justify-center">
          <div
            className="absolute rounded-full animate-breathe"
            style={{
              width: "min(78vw, 460px)",
              height: "min(78vw, 460px)",
              background:
                "radial-gradient(circle, rgba(150,128,238,0.42) 0%, rgba(150,128,238,0) 66%)",
            }}
          />
          <img
            src="/sheep-mascot.png"
            alt="Sleeping Sheep"
            className="w-[62vw] max-w-[360px] max-h-[40vh] h-auto relative animate-float object-contain"
          />
        </div>

        {/* Title block */}
        <div className="mt-8">
          <div className="text-[11px] tracking-[0.32em] font-medium" style={{ color: "#8d84c2" }}>
            sleeping sheep
          </div>
          <h1
            className="mt-5 text-[1.65rem] leading-snug font-light"
            style={{ color: "#f5f2ff" }}
          >
            오늘 하루,
            <br />
            양에게 들려주세요
          </h1>
          <p className="mt-4 text-sm leading-relaxed font-light" style={{ color: "#aaa3d2" }}>
            눈을 감기 전, 작은 양이
            <br />
            당신의 이야기를 기다리고 있어요.
          </p>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="w-full pb-2">
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="w-full h-14 rounded-[20px] text-white text-base font-medium tracking-[0.06em] flex items-center justify-center gap-2.5 transition-transform duration-300 hover:scale-[1.015] active:scale-[0.99] disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, #8275e8 0%, #5b4fc6 100%)",
              boxShadow: "0 10px 26px rgba(108,88,224,0.42)",
            }}
          >
            {isStarting ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
            {isStarting ? "준비하는 중..." : "수면 시작"}
          </button>

          <div className="flex justify-center mt-5">
            <button
              onClick={() => setLocation("/history")}
              className="flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-[14px] transition-colors duration-300"
              style={{ color: "#9890c4", background: "rgba(255,255,255,0.05)" }}
            >
              <History className="w-[15px] h-[15px]" />
              지난 양들
            </button>
          </div>

          {/* Privacy note */}
          <p
            className="mt-6 text-[11px] leading-relaxed font-light px-6"
            style={{ color: "rgba(170,163,210,0.4)" }}
          >
            음성 파일은 저장되지 않아요. 대화 텍스트만 양 생성을 위해 보관됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
