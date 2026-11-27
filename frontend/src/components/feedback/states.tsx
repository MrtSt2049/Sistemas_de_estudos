import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/errors";

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Carregando" className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-14 animate-pulse rounded-card border border-line bg-surface"
        />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <h2 className="text-sm font-medium text-text">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const isApiError = error instanceof ApiError;
  return (
    <Card role="alert">
      <h2 className="text-sm font-medium text-text">Não foi possível carregar os dados</h2>
      <p className="mt-1 text-sm text-muted">
        {isApiError ? error.message : "Verifique se o servidor está em execução."}
      </p>
      {isApiError && error.requestId !== "-" && (
        <p className="mt-1 font-mono text-xs text-muted">ID: {error.requestId}</p>
      )}
      <Button variant="secondary" className="mt-4" onClick={onRetry}>
        Tentar de novo
      </Button>
    </Card>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-control border border-danger/40 bg-surface-2 px-3 py-2 text-sm text-danger"
    >
      {message}
    </div>
  );
}
