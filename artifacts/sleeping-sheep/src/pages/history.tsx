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
    <div className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col">
      <div className="flex items-center mb-8 pt-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation("/")}
          className="mr-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl text-foreground font-medium">과거의 양들</h1>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-muted-foreground text-sm">양들을 불러오는 중...</p>
          </div>
        </div>
      ) : sheeps?.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <p>아직 만들어진 양이 없습니다.</p>
          <p className="text-sm mt-2">오늘 밤 첫 번째 양을 만들어보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {sheeps?.map((sheep) => (
            <div 
              key={sheep.id} 
              onClick={() => setLocation(`/sheep/${sheep.id}`)}
              className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="aspect-square bg-muted/30 relative">
                {sheep.imageUrl ? (
                  <img src={sheep.imageUrl} alt={sheep.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    이미지 없음
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  {format(new Date(sheep.createdAt), "M월 d일", { locale: ko })}
                </p>
                <p className="font-medium text-foreground">{sheep.name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: sheep.displayColor || "#4B5563" }} 
                  />
                  <span className="text-xs text-muted-foreground truncate">{sheep.dominantEmotion}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
