"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fr } from "./fr";
import { en } from "./en";
import { es } from "./es";
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, Language } from "./config";

const DICTS = { fr, en, es };

type LangCtx = {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    const detected = navigator.language.slice(0, 2) as Language;
    const next =
      stored ?? (["fr", "en", "es"].includes(detected) ? detected : DEFAULT_LANGUAGE);
    setLang(next);
    document.documentElement.lang = next;
  }, []);

  const setLanguage = useCallback((l: Language) => {
    setLang(l);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const raw = key.split(".").reduce<unknown>((o, k) => {
        if (o && typeof o === "object") return (o as Record<string, unknown>)[k];
        return undefined;
      }, DICTS[language]);

      if (typeof raw !== "string") return key;

      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
