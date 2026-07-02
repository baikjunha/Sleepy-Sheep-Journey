import { useRoute, useLocation } from "wouter";
import {
  useGetSheep,
  getGetSheepQueryKey,
  useListTranscripts,
  getListTranscriptsQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { MessageCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SheepResultScreen() {
  const [, params] = useRoute("/sheep/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: sheep, isLoading } = useGetSheep(id, {
    query: {
      enabled: !!id,
      queryKey: getGetSheepQueryKey(id),
    },
  });

  const sessionId = sheep?.sessionId ?? 0;
  const { data: transcripts } = useListTranscripts(sessionId, {
    query: {
      enabled: !!sessionId,
      queryKey: getListTranscriptsQueryKey(sessionId),
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

  const conversation = (transcripts ?? []).filter((t) => t.text?.trim().length > 0);

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
      <div
        className="w-full max-w-xs aspect-square rounded-3xl overflow-hidden mb-8 border border-white/5 shadow-2xl flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgba(120,104,210,0.18) 0%, rgba(10,9,24,0) 70%), #0b0a18",
        }}
      >
        {sheep.imageUrl ? (
          <img src={sheep.imageUrl} alt={sheep.name} className="w-[88%] h-[88%] object-contain animate-sheep" />
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

      {/* Spec rows */}
      <div className="w-full mb-10">
        {sheep.spec?.emotionSummary && (
          <div className="flex items-baseline justify-between py-4 border-b border-white/[0.06]">
            <span className="text-sm text-muted-foreground/40 font-light shrink-0">감정</span>
            <p className="text-sm text-foreground/70 font-light text-right ml-6">{sheep.spec.emotionSummary}</p>
          </div>
        )}
        {sheep.spec?.sheepPersonality && (
          <div className="flex items-baseline justify-between py-4 border-b border-white/[0.06]">
            <span className="text-sm text-muted-foreground/40 font-light shrink-0">성격</span>
            <p className="text-sm text-foreground/70 font-light text-right ml-6">{sheep.spec.sheepPersonality}</p>
          </div>
        )}
      </div>

      {/* Conversation entry button */}
      {conversation.length > 0 && (
        <button
          onClick={() => setLocation(`/sheep/${id}/conversation`)}
          className="w-full mb-10 flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-left hover:bg-white/[0.07] transition-all duration-300"
        >
          <span className="flex items-center gap-3">
            <MessageCircle className="w-[18px] h-[18px] text-foreground/40" />
            <span className="flex flex-col">
              <span className="text-sm text-foreground/75 font-light">오늘 밤 나눈 이야기</span>
              <span className="text-[11px] text-muted-foreground/30 font-light mt-0.5">
                대화 {conversation.length}개 보기
              </span>
            </span>
          </span>
          <ChevronRight className="w-[18px] h-[18px] text-muted-foreground/30" />
        </button>
      )}

      {/* Actions */}
      <div className="flex flex-col space-y-3 w-full mt-auto">
        <Button
          onClick={() => setLocation(`/rest/${id}`)}
          className="w-full py-5 rounded-2xl text-white hover:scale-[1.01] transition-transform duration-500"
          style={{
            background: "linear-gradient(135deg, #8275e8 0%, #5b4fc6 100%)",
            boxShadow: "0 10px 26px rgba(108,88,224,0.35)",
          }}
        >
          이제 잠들기
        </Button>
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
