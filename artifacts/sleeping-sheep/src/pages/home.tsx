import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSession } from "@workspace/api-client-react";
import { SheepIcon } from "@/components/sheep-icon";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const HOME_STARS = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  size: Math.random() * 2 + 0.5,
  top: Math.random() * 100,
  left: Math.random() * 100,
  opacity: Math.random() * 0.15 + 0.05,
  duration: Math.random() * 5 + 4,
  delay: Math.random() * 5,
}));

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-background to-background pointer-events-none" />

      {/* Stars */}
      {HOME_STARS.map((star) => (
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

      <div className="z-10 flex flex-col items-center max-w-sm w-full text-center space-y-12">
        {/* Sheep icon with glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl scale-[3] animate-breathe" />
          <SheepIcon className="w-20 h-20 text-primary/50 relative z-10 animate-float" />
        </div>

        {/* Title block */}
        <div className="space-y-4">
          <h1 className="text-xs tracking-[0.35em] text-muted-foreground/50 font-sans font-light uppercase">
            Sleeping Sheep
          </h1>
          <p className="text-2xl font-serif text-foreground/90 leading-relaxed">
            오늘 하루, 양에게 들려주세요
          </p>
          <p className="text-sm text-muted-foreground/60 font-light leading-relaxed">
            눈을 감기 전, 작은 양이 당신의 이야기를 기다리고 있어요.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-3 w-full pt-2">
          <Button
            onClick={handleStart}
            disabled={isStarting}
            className="w-full py-6 text-base rounded-2xl bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20 transition-all duration-500"
          >
            {isStarting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isStarting ? "준비하는 중..." : "수면 시작"}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setLocation("/history")}
            className="w-full text-muted-foreground/40 hover:text-muted-foreground/60 text-sm font-light"
          >
            지난 양들
          </Button>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-muted-foreground/30 leading-relaxed font-light px-4">
          음성 파일은 저장되지 않아요. 대화 텍스트만 양 생성을 위해 보관됩니다.
        </p>
      </div>
    </div>
  );
}
