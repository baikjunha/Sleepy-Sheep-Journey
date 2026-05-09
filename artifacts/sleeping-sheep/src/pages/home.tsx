import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSession } from "@workspace/api-client-react";
import { SheepIcon } from "@/components/sheep-icon";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
          // could show a toast here
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center max-w-md w-full text-center space-y-10">
        <div className="flex flex-col items-center space-y-4">
          <SheepIcon className="w-24 h-24 text-primary opacity-90" />
          <h1 className="text-3xl tracking-wider text-primary-foreground font-medium">Sleeping Sheep</h1>
          <p className="text-muted-foreground text-sm">
            당신의 감정에 조용히 귀 기울이는 밤.
          </p>
        </div>

        <div className="bg-card/50 p-6 rounded-2xl border border-border/50 text-sm text-left leading-relaxed text-muted-foreground">
          이 앱은 수면 전 회고 대화를 위해 마이크를 사용합니다. 음성 파일은 저장하지 않습니다. 음성은 텍스트로 변환되며, 사용자와 양의 대화 텍스트 전체가 저장됩니다. 저장된 대화 텍스트는 오늘의 감정 양을 생성하는 데 사용됩니다.
        </div>

        <div className="flex flex-col space-y-4 w-full pt-4">
          <Button 
            onClick={handleStart} 
            disabled={isStarting}
            className="w-full py-6 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
          >
            {isStarting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {isStarting ? "준비하는 중..." : "수면 시작"}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/history")}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            과거 양 목록 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
