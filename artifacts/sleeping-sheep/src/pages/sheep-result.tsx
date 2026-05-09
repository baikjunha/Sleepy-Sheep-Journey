import { useRoute, useLocation } from "wouter";
import { useGetSheep, getGetSheepQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export default function SheepResultScreen() {
  const [match, params] = useRoute("/sheep/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: sheep, isLoading } = useGetSheep(id, {
    query: {
      enabled: !!id,
      queryKey: getGetSheepQueryKey(id),
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050510]">
        <div className="w-8 h-8 rounded-full border border-primary/30 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!sheep) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050510] text-center">
        <p className="text-muted-foreground/50 mb-6 font-light">양을 찾을 수 없습니다.</p>
        <Button onClick={() => setLocation("/")} variant="ghost" className="text-muted-foreground/40">
          홈으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center bg-[#050510] text-foreground pb-12">
      {/* Header */}
      <div className="w-full text-center pt-8 mb-6">
        <p className="text-xs tracking-[0.3em] text-muted-foreground/35 font-sans uppercase mb-2">
          Today's Sheep
        </p>
        <p className="text-xs text-muted-foreground/25 font-light">
          {format(new Date(sheep.createdAt), "yyyy년 M월 d일", { locale: ko })}
        </p>
      </div>

      {/* Sheep image */}
      <div className="w-full max-w-xs aspect-square rounded-3xl overflow-hidden mb-8 border border-white/5 shadow-2xl">
        {sheep.imageUrl ? (
          <img src={sheep.imageUrl} alt={sheep.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-card/20 flex items-center justify-center text-muted-foreground/20">
            이미지가 없습니다
          </div>
        )}
      </div>

      {/* Sheep name */}
      <h1 className="text-2xl font-serif text-foreground/90 mb-5">{sheep.name}</h1>

      {/* Emotion tags */}
      {sheep.spec?.dominantEmotions && sheep.spec.dominantEmotions.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {sheep.spec.dominantEmotions.map((emotion: string, idx: number) => (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-foreground/50 text-xs tracking-wide font-light"
            >
              {emotion}
            </span>
          ))}
        </div>
      )}

      {/* Spec cards */}
      <div className="w-full space-y-3 mb-10">
        {sheep.spec?.emotionSummary && (
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.04]">
            <span className="text-[11px] text-muted-foreground/30 tracking-widest uppercase block mb-1.5">감정</span>
            <p className="text-sm text-foreground/65 font-light leading-relaxed">{sheep.spec.emotionSummary}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {sheep.spec?.colorIntent && (
            <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.04]">
              <span className="text-[11px] text-muted-foreground/30 tracking-widest uppercase block mb-1.5">색감</span>
              <p className="text-sm text-foreground/65 font-light">{sheep.spec.colorIntent}</p>
            </div>
          )}
          {sheep.spec?.textureIntent && (
            <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.04]">
              <span className="text-[11px] text-muted-foreground/30 tracking-widest uppercase block mb-1.5">촉감</span>
              <p className="text-sm text-foreground/65 font-light">{sheep.spec.textureIntent}</p>
            </div>
          )}
        </div>

        {sheep.spec?.sheepPersonality && (
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.04]">
            <span className="text-[11px] text-muted-foreground/30 tracking-widest uppercase block mb-1.5">성격</span>
            <p className="text-sm text-foreground/65 font-light leading-relaxed">{sheep.spec.sheepPersonality}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col space-y-3 w-full mt-auto">
        <Button
          onClick={() => setLocation("/history")}
          className="w-full py-5 rounded-2xl bg-white/[0.05] text-foreground/60 hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-500"
        >
          컬렉션에 보관
        </Button>
        <Button
          onClick={() => setLocation("/")}
          variant="ghost"
          className="w-full text-muted-foreground/30 hover:text-muted-foreground/50 text-sm font-light"
        >
          홈으로
        </Button>
      </div>
    </div>
  );
}
