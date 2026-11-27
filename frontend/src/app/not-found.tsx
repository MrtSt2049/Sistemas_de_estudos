import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
      <h1 className="text-page-title font-bold text-text">Página não encontrada</h1>
      <p className="text-sm text-muted">O endereço solicitado não existe nesta plataforma.</p>
      <Link href="/dashboard" className={buttonClasses()}>
        Voltar ao início
      </Link>
    </div>
  );
}
