import { useLocation } from "wouter";
import { ChevronLeft, Moon, Sun, Check } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { LANGUAGES } from "@/lib/i18n";

export default function SettingsScreen() {
  const [, setLocation] = useLocation();
  const { language, theme, setLanguage, setTheme, t, isNight } = useSettings();

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="w-full flex items-center gap-3 pt-6 mb-10">
        <button
          onClick={() => setLocation("/")}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-foreground/[0.05] border border-foreground/[0.08] text-foreground/50 hover:text-foreground/80 transition-colors"
          aria-label={t.conversation.back}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-serif text-foreground/90">{t.settings.title}</h1>
      </div>

      {/* Language */}
      <div className="mb-10">
        <p className="text-xs tracking-[0.25em] text-muted-foreground/50 uppercase font-sans mb-4">
          {t.settings.language}
        </p>
        <div className="rounded-2xl overflow-hidden border border-foreground/[0.08] divide-y divide-foreground/[0.06]">
          {LANGUAGES.map((lang) => {
            const selected = language === lang.value;
            return (
              <button
                key={lang.value}
                onClick={() => setLanguage(lang.value)}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                  selected
                    ? "bg-primary/10 text-foreground"
                    : "bg-foreground/[0.03] text-foreground/60 hover:bg-foreground/[0.06]"
                }`}
                aria-pressed={selected}
              >
                <span className="text-sm font-light">{lang.label}</span>
                {selected && <Check className="w-4 h-4 text-primary/80" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme */}
      <div>
        <p className="text-xs tracking-[0.25em] text-muted-foreground/50 uppercase font-sans mb-4">
          {t.settings.theme}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme("night")}
            className={`flex flex-col items-center gap-2.5 rounded-2xl border px-4 py-6 transition-all ${
              theme === "night"
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-foreground/[0.08] bg-foreground/[0.03] text-foreground/50 hover:bg-foreground/[0.06]"
            }`}
            aria-pressed={theme === "night"}
          >
            <Moon className="w-5 h-5" />
            <span className="text-sm font-light">{t.settings.night}</span>
          </button>
          <button
            onClick={() => setTheme("day")}
            className={`flex flex-col items-center gap-2.5 rounded-2xl border px-4 py-6 transition-all ${
              theme === "day"
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-foreground/[0.08] bg-foreground/[0.03] text-foreground/50 hover:bg-foreground/[0.06]"
            }`}
            aria-pressed={theme === "day"}
          >
            <Sun className="w-5 h-5" />
            <span className="text-sm font-light">{t.settings.day}</span>
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground/40 font-light mt-5">
          {isNight ? t.settings.themeHintNight : t.settings.themeHintDay}
        </p>
      </div>
    </div>
  );
}
