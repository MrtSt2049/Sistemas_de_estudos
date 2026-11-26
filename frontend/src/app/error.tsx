"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
      <h1 className="text-xl font-semibold text-text">Ocorreu um erro inesperado</h1>
      <p className="max-w-md text-sm text-muted">
        Não foi possível carregar esta tela. Tente novamente.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted">ID: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="rounded-[10px] bg-accent-solid px-4 py-2 text-sm font-medium text-white"
      >
        Tentar de novo
      </button>
    </div>
  );
}
