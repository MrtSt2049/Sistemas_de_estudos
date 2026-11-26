import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
      <h1 className="text-2xl font-bold text-text">Página não encontrada</h1>
      <p className="text-sm text-muted">O endereço solicitado não existe nesta plataforma.</p>
      <Link
        href="/dashboard"
        className="rounded-[10px] bg-accent-solid px-4 py-2 text-sm font-medium text-white"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
