"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/components/layout/Providers";

const NEXT_THEME: Record<ThemeMode, ThemeMode> = {
  system: "dark",
  dark: "light",
  light: "system",
};

const LABEL: Record<ThemeMode, string> = {
  system: "Tema do sistema",
  dark: "Tema escuro",
  light: "Tema claro",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = NEXT_THEME[theme];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Alternar tema (atual: ${LABEL[theme]})`}
      className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 text-xs font-medium text-text hover:bg-surface-2"
    >
      {theme === "dark" && <Moon className="h-4 w-4" strokeWidth={1.8} />}
      {theme === "light" && <Sun className="h-4 w-4" strokeWidth={1.8} />}
      {theme === "system" && <Monitor className="h-4 w-4" strokeWidth={1.8} />}
      <span>{LABEL[theme]}</span>
    </button>
  );
}
