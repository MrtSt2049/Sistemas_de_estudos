"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { LogOut, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Skeleton } from "@/components/feedback/states";
import { Navigation } from "@/components/layout/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useLogout, useMe } from "@/features/auth/queries";
import { APP_NAME } from "@/lib/app";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();
  const logoutMutation = useLogout();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      router.replace("/login");
    }
  }, [isLoading, isError, user, router]);

  if (isLoading || !user) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl bg-bg p-8">
        <Skeleton rows={4} />
      </div>
    );
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace("/login");
  };

  const logoutButton = (
    <Button
      variant="secondary"
      pending={logoutMutation.isPending}
      onClick={handleLogout}
      className="mt-4 w-full"
    >
      <LogOut className="size-4" strokeWidth={1.8} aria-hidden />
      Sair
    </Button>
  );

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface p-4 lg:flex">
        <div className="mb-6 px-3 text-sm font-semibold tracking-tight">{APP_NAME}</div>
        <Navigation />
        {logoutButton}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 items-center gap-3 border-b border-line bg-surface px-4 py-2 lg:px-6">
          <RadixDialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <RadixDialog.Trigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="size-5" strokeWidth={1.8} />
              </Button>
            </RadixDialog.Trigger>
            <RadixDialog.Portal>
              <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
              <RadixDialog.Content
                aria-describedby={undefined}
                className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface p-4 text-text"
              >
                <div className="mb-4 flex items-center justify-between">
                  <RadixDialog.Title className="px-3 text-sm font-semibold">
                    {APP_NAME}
                  </RadixDialog.Title>
                  <RadixDialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Fechar menu">
                      <X className="size-5" strokeWidth={1.8} />
                    </Button>
                  </RadixDialog.Close>
                </div>
                <Navigation onNavigate={() => setDrawerOpen(false)} />
                {logoutButton}
              </RadixDialog.Content>
            </RadixDialog.Portal>
          </RadixDialog.Root>

          <span className="min-w-0 flex-1 truncate text-sm text-muted">
            {user.profile.display_name || user.email}
          </span>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
