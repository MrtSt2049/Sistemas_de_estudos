"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useLogout, useMe } from "@/features/auth/queries";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      router.replace("/login");
    }
  }, [isLoading, isError, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">
        Carregando sessão...
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface p-4 lg:flex lg:flex-col">
        <div className="mb-6 px-2 text-sm font-semibold tracking-tight">Study Platform</div>
        <nav aria-label="Navegação principal" className="flex-1 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-[10px] bg-accent-soft px-3 py-2 text-sm font-medium text-accent"
          >
            <LayoutDashboard className="h-[18px] w-[18px]" strokeWidth={1.8} />
            Dashboard
          </Link>
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="mt-4 flex items-center gap-2 rounded-[10px] border border-line px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-text"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
          Sair
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:px-6">
          <span className="text-sm text-muted">{user.profile.display_name || user.email}</span>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
