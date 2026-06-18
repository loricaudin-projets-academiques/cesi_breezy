export type Language = "fr" | "en" | "es";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export const DEFAULT_LANGUAGE: Language = "fr";
export const LANGUAGE_STORAGE_KEY = "breezy.language";
