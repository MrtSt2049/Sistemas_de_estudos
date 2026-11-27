import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { APP_NAME } from "@/lib/app";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4">
      <div className="mb-6 flex w-full max-w-sm items-center justify-between">
        <span className="text-base font-semibold tracking-tight text-text">{APP_NAME}</span>
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-bold text-text">Acessar conta</h1>
        <p className="mb-6 text-sm text-muted">Entre com seu e-mail e senha cadastrados.</p>
        <LoginForm />
      </Card>
    </div>
  );
}
