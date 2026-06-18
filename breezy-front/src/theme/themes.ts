export type ThemeId = "base" | "light" | "noir-violet" | "ocean" | "forest" | "sunset";

export const THEME_STORAGE_KEY = "breezy:theme";
export const DEFAULT_THEME: ThemeId = "base";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  swatch: [string, string, string];
}

export const THEMES: ThemeMeta[] = [
  { id: "base",        label: "Base",        swatch: ["#050508", "#AEEBFF", "#C8B6FF"] },
  { id: "light",       label: "Blanc",       swatch: ["#FFFFFF", "#4F46E5", "#9333EA"] },
  { id: "noir-violet", label: "Noir Violet", swatch: ["#05010A", "#C084FC", "#E879F9"] },
  { id: "ocean",       label: "Océan",       swatch: ["#04121F", "#22D3EE", "#38BDF8"] },
  { id: "forest",      label: "Forêt",       swatch: ["#04140E", "#34D399", "#A3E635"] },
  { id: "sunset",      label: "Sunset",      swatch: ["#1A0A12", "#FB7185", "#FBBF24"] },
];

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === "string" && THEMES.some((t) => t.id === v);
}
