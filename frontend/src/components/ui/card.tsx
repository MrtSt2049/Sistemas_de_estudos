import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border border-line bg-surface p-4 sm:p-7", className)}
      {...props}
    />
  );
}

export type BadgeTone = "neutral" | "accent" | "ok" | "warn" | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-line text-muted",
  accent: "border-accent/40 text-accent",
  ok: "border-ok/40 text-ok",
  warn: "border-warn/40 text-warn",
  danger: "border-danger/40 text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control border px-2 py-1 text-xs font-medium",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
