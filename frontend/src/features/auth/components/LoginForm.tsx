"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FormError } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useLogin } from "@/features/auth/queries";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { applyApiError } from "@/lib/forms";

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
      applyApiError(err, setError, ["email", "password"]);
    }
  };

  const pending = isSubmitting || loginMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={errors.root?.message} />

      <Field label="E-mail" error={errors.email?.message}>
        <Input
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          {...register("email")}
        />
      </Field>

      <Field label="Senha" error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...register("password")} />
      </Field>

      <Button type="submit" pending={pending} className="w-full">
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
