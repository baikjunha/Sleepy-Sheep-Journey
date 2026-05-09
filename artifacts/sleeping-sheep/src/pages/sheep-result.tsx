import { useRoute, useLocation } from "wouter";
import { useGetSheep } from "@workspace/api-client-react";
import { getGetSheepQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export default function SheepResultScreen() {
  const [match, params] = useRoute("/sheep/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: sheep, isLoading } = useGetSheep(id, {
    query: {
      enabled: !!id,
      queryKey: getGetSheepQueryKey(id),
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050510]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!sheep) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050510] text-center">
        <p className="text-muted-foreground mb-6">양을 찾을 수 없습니다.</p>
        <Button onClick={() => setLocation("/")} variant="outline">홈으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center text-center bg-[#050510] text-foreground pb-20">
      <div className="w-full max-w-sm aspect-square rounded-3xl overflow-hidden mt-8 mb-8 border border-white/10 shadow-2xl relative">
        <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none" />
        {sheep.imageUrl ? (
          <img src={sheep.imageUrl} alt={sheep.name} className="w-full h-full object-cover z-0" />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-600">
            이미지가 없습니다
          </div>
        )}
      </div>

      <h1 className="text-2xl font-serif text-slate-200 mb-2">{sheep.name}</h1>
      
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {sheep.spec?.dominantEmotions.map((emotion, idx) => (
          <span key={idx} className="px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs tracking-wide">
            {emotion}
          </span>
        ))}
      </div>

      <p className="text-slate-400 font-light leading-relaxed mb-8">
        {sheep.spec?.emotionSummary}
      </p>

      <div className="w-full bg-white/5 rounded-2xl p-5 mb-8 text-sm text-left space-y-4">
        <div>
          <span className="text-slate-500 block mb-1">색상과 질감</span>
          <p className="text-slate-300">{sheep.spec?.colorIntent} · {sheep.spec?.textureIntent}</p>
        </div>
        <div>
          <span className="text-slate-500 block mb-1">성격</span>
          <p className="text-slate-300">{sheep.spec?.sheepPersonality}</p>
        </div>
      </div>

      <div className="flex flex-col space-y-3 w-full mt-auto">
        <Button 
          onClick={() => setLocation("/")}
          className="w-full bg-white/10 text-white hover:bg-white/20 py-6 rounded-xl"
        >
          처음으로 돌아가기
        </Button>
        <Button 
          onClick={() => setLocation("/history")}
          variant="ghost"
          className="w-full text-slate-500 hover:text-slate-300"
        >
          양 목록 보기
        </Button>
      </div>
    </div>
  );
}
