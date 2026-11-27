"use client";

import { BookOpen, LayoutDashboard, ListChecks, NotebookPen, Repeat, Timer, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Agrupamento por intenção (DEVELOPMENT_PLAN §3.9.2). Só entram rotas que existem.
export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Hoje",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/sessions", label: "Sessões de estudo", icon: Timer },
      { href: "/review", label: "Revisão", icon: Repeat },
    ],
  },
  { title: "Estudo", items: [
    { href: "/disciplines", label: "Disciplinas", icon: BookOpen },
    { href: "/exercises", label: "Exercícios", icon: ListChecks },
    { href: "/errors", label: "Caderno de erros", icon: NotebookPen },
  ] },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="flex-1 space-y-4 overflow-y-auto">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted">
            {group.title}
          </p>
          <ul className="space-y-1">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium lg:min-h-10",
                      active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.8} aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
