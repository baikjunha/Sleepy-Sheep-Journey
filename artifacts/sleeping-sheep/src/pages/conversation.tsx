import { useRoute, useLocation } from "wouter";
import {
  useGetSheep,
  getGetSheepQueryKey,
  useListTranscripts,
  getListTranscriptsQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConversationScreen() {
  const [, params] = useRoute("/sheep/:id/conversation");
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
    <div className="min-h-screen p-6 max-w-md mx-auto flex flex-col bg-[#050510] text-foreground pb-12">
      {/* Header */}
      <div className="w-full flex items-center gap-3 pt-6 mb-8">
        <button
          onClick={() => setLocation(`/sheep/${id}`)}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/[0.06] text-foreground/50 hover:text-foreground/80 transition-colors"
          aria-label="뒤로"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs tracking-[0.3em] text-muted-foreground/35 font-sans uppercase">
            Tonight's Talk
          </p>
          <p className="text-sm text-foreground/70 font-light mt-0.5">
            {format(new Date(sheep.createdAt), "yyyy년 M월 d일", { locale: ko })} · {sheep.name}
          </p>
        </div>
      </div>

      {conversation.length > 0 ? (
        <div className="space-y-3">
          {conversation.map((turn) => {
            const isUser = turn.role === "user";
            return (
              <div key={turn.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={
                    isUser
                      ? "max-w-[80%] rounded-2xl rounded-br-md px-4 py-3 bg-primary/15 border border-primary/15 text-foreground/80"
                      : "max-w-[80%] rounded-2xl rounded-bl-md px-4 py-3 bg-white/[0.04] border border-white/[0.06] text-foreground/60"
                  }
                >
                  {!isUser && (
                    <span className="block text-[10px] tracking-wider text-muted-foreground/35 mb-1 font-light">
                      양
                    </span>
                  )}
                  <p className="text-sm font-light leading-relaxed whitespace-pre-wrap">{turn.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground/30 font-light">나눈 이야기가 없어요.</p>
        </div>
      )}
    </div>
  );
}
