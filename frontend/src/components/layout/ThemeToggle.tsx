"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/components/layout/Providers";
import { Button } from "@/components/ui/button";

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
    <Button
      variant="secondary"
      size="sm"
      onClick={() => setTheme(next)}
      aria-label={`Alternar tema (atual: ${LABEL[theme]})`}
    >
      {theme === "dark" && <Moon className="size-4" strokeWidth={1.8} aria-hidden />}
      {theme === "light" && <Sun className="size-4" strokeWidth={1.8} aria-hidden />}
      {theme === "system" && <Monitor className="size-4" strokeWidth={1.8} aria-hidden />}
      <span className="hidden sm:inline">{LABEL[theme]}</span>
    </Button>
  );
}
