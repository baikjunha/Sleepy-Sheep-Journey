import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  translations,
  STT_LOCALES,
  DATE_LOCALES,
  type Language,
  type Translation,
} from "./i18n";
import type { Locale } from "date-fns";

export type ThemeMode = "night" | "day";

interface SettingsState {
  language: Language;
  theme: ThemeMode;
}

interface SettingsContextValue extends SettingsState {
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  t: Translation;
  sttLocale: string;
  dateLocale: Locale;
  isNight: boolean;
}

const STORAGE_KEY = "sleeping-sheep-settings";

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      return {
        language: parsed.language === "en" || parsed.language === "zh" ? parsed.language : "ko",
        theme: parsed.theme === "day" ? "day" : "night",
      };
    }
  } catch {
    /* fall through to defaults */
  }
  return { language: "ko", theme: "night" };
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage may be unavailable */
    }
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "night");
    root.classList.toggle("day", settings.theme === "day");
  }, [settings.theme]);

  const setLanguage = useCallback((language: Language) => {
    setSettings((s) => ({ ...s, language }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((s) => ({ ...s, theme }));
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      setLanguage,
      setTheme,
      t: translations[settings.language],
      sttLocale: STT_LOCALES[settings.language],
      dateLocale: DATE_LOCALES[settings.language],
      isNight: settings.theme === "night",
    }),
    [settings, setLanguage, setTheme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
