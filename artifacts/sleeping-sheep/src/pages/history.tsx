import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useListSheep } from "@workspace/api-client-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

type Sheep = {
  id: number;
  name: string;
  imageUrl: string;
  dominantEmotion: string;
  createdAt: Date | string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function History() {
  const [, setLocation] = useLocation();
  const { data: sheeps, isLoading } = useListSheep();
  const [view, setView] = useState<"grid" | "calendar">("grid");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const sheepByDay = useMemo(() => {
    const map = new Map<string, Sheep[]>();
    (sheeps as Sheep[] | undefined)?.forEach((s) => {
      const key = format(new Date(s.createdAt), "yyyy-MM-dd");
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    });
    return map;
  }, [sheeps]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <div className="min-h-screen p-6 max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pt-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-muted-foreground/40 hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setView((v) => (v === "grid" ? "calendar" : "grid"))}
          className="text-muted-foreground/40 hover:text-foreground"
          aria-label={view === "grid" ? "달력으로 보기" : "모아 보기"}
          aria-pressed={view === "calendar"}
        >
          {view === "grid" ? <CalendarDays className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
        </Button>
      </div>

      <div className="mb-8 text-center">
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
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3">
          {sheeps?.map((sheep) => (
            <div
              key={sheep.id}
              onClick={() => setLocation(`/sheep/${sheep.id}`)}
              className="bg-card/30 border border-border/20 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/20 hover:bg-card/50 transition-all duration-500 group"
            >
              <div className="aspect-square bg-background/40 relative overflow-hidden flex items-center justify-center">
                {sheep.imageUrl ? (
                  <img
                    src={sheep.imageUrl}
                    alt={sheep.name}
                    className="w-[86%] h-[86%] object-contain animate-sheep"
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
      ) : (
        <div className="select-none">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMonth((m) => subMonths(m, 1))}
              className="text-muted-foreground/40 hover:text-foreground h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="text-sm font-serif text-foreground/80">
              {format(month, "yyyy년 M월", { locale: ko })}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="text-muted-foreground/40 hover:text-foreground h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[0.65rem] text-muted-foreground/35 font-light">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const daySheep = sheepByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, month);
              const hero = daySheep[0];

              const handleOpen = () => hero && setLocation(`/sheep/${hero.id}`);

              return (
                <div
                  key={key}
                  role={hero ? "button" : undefined}
                  tabIndex={hero ? 0 : undefined}
                  aria-label={
                    hero
                      ? `${format(day, "M월 d일", { locale: ko })}, ${hero.name}${
                          daySheep.length > 1 ? ` 외 ${daySheep.length - 1}마리` : ""
                        }`
                      : undefined
                  }
                  onClick={handleOpen}
                  onKeyDown={(e) => {
                    if (hero && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleOpen();
                    }
                  }}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all duration-300 ${
                    inMonth ? "border-border/15 bg-card/20" : "border-transparent opacity-30"
                  } ${
                    hero
                      ? "cursor-pointer hover:border-primary/25 hover:bg-card/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
                      : ""
                  } ${isToday(day) ? "ring-1 ring-primary/30" : ""}`}
                >
                  <span
                    className={`absolute top-1 left-1.5 text-[0.6rem] font-light ${
                      isToday(day) ? "text-primary/70" : "text-muted-foreground/30"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {hero ? (
                    hero.imageUrl ? (
                      <img
                        src={hero.imageUrl}
                        alt={hero.name}
                        className="w-[78%] h-[78%] object-contain mt-1"
                      />
                    ) : (
                      <span className="text-[0.55rem] text-muted-foreground/25 tracking-widest">zzz</span>
                    )
                  ) : null}

                  {daySheep.length > 1 && (
                    <span className="absolute bottom-0.5 right-1 text-[0.55rem] text-primary/50 font-light">
                      +{daySheep.length - 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-[0.7rem] text-muted-foreground/30 font-light mt-6">
            날짜를 눌러 그날의 양을 다시 만나보세요
          </p>
        </div>
      )}
    </div>
  );
}
