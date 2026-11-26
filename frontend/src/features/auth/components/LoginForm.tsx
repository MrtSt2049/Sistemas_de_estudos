"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useLogin } from "@/features/auth/queries";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { ApiError } from "@/lib/errors";

export function LoginForm() {
  const router = useRouter();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await loginMutation.mutateAsync(data);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details.email?.[0]) {
          setError("email", { message: err.details.email[0] });
        }
        if (err.details.password?.[0]) {
          setError("password", { message: err.details.password[0] });
        }
        setError("root", { message: err.message });
      } else {
        setError("root", { message: "Não foi possível conectar ao servidor." });
      }
    }
  };

  const pending = isSubmitting || loginMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errors.root?.message && (
        <div
          role="alert"
          className="rounded-[10px] border border-danger/40 bg-surface-2 px-3 py-2 text-sm text-danger"
        >
          {errors.root.message}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-muted">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="w-full rounded-[10px] border border-line bg-surface-2 px-3 py-2.5 text-sm text-text placeholder:text-muted"
          placeholder="voce@exemplo.com"
        />
        {errors.email?.message && (
          <p className="text-xs text-danger">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wide text-muted">
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          className="w-full rounded-[10px] border border-line bg-surface-2 px-3 py-2.5 text-sm text-text"
        />
        {errors.password?.message && (
          <p className="text-xs text-danger">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[10px] bg-accent-solid px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
