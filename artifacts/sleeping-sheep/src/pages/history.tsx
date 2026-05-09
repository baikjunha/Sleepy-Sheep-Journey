import { useLocation } from "wouter";
import { useListSheep } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function History() {
  const [, setLocation] = useLocation();
  const { data: sheeps, isLoading } = useListSheep();

  return (
    <div className="min-h-screen p-6 max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-2 pt-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-muted-foreground/40 hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="mb-10 text-center">
        <p className="text-xs tracking-[0.3em] text-muted-foreground/40 font-sans uppercase mb-3">
          My Flock
        </p>
        <h1 className="text-xl font-serif text-foreground/90 mb-2">모아 둔 양들</h1>
        {sheeps && sheeps.length > 0 && (
          <p className="text-sm text-muted-foreground/40 font-light">
            지금까지 {sheeps.length}마리를 재웠어요
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 rounded-full border border-primary/30 border-t-transparent animate-spin" />
            <p className="text-muted-foreground/40 text-sm font-light">양들을 불러오는 중...</p>
          </div>
        </div>
      ) : sheeps?.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
          <p className="text-muted-foreground/50 font-light">아직 만들어진 양이 없습니다.</p>
          <p className="text-sm text-muted-foreground/30 font-light">오늘 밤 첫 번째 양을 만들어보세요.</p>
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="mt-4 text-primary/50 hover:text-primary text-sm"
          >
            오늘의 양 만들기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sheeps?.map((sheep) => (
            <div
              key={sheep.id}
              onClick={() => setLocation(`/sheep/${sheep.id}`)}
              className="bg-card/30 border border-border/20 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/20 hover:bg-card/50 transition-all duration-500 group"
            >
              <div className="aspect-square bg-background/40 relative overflow-hidden">
                {sheep.imageUrl ? (
                  <img
                    src={sheep.imageUrl}
                    alt={sheep.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 text-lg font-light tracking-widest">
                    zzz
                  </div>
                )}
              </div>
              <div className="p-3.5">
                <p className="text-xs text-muted-foreground/35 mb-1 font-light">
                  {format(new Date(sheep.createdAt), "M월 d일", { locale: ko })} · {sheep.dominantEmotion}
                </p>
                <p className="text-sm text-foreground/75 font-medium">{sheep.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
