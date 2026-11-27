"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormError } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { recordAttempt } from "@/features/exercises/api";
import { exerciseKeys, useErrorTypes } from "@/features/exercises/queries";
import {
  attemptSchema,
  RESULT_LABELS,
  toAttemptPayload,
  type AttemptFormInput,
} from "@/features/exercises/schemas";
import { reviewKeys } from "@/features/reviews/queries";
import { applyApiError } from "@/lib/forms";
import { useApiMutation } from "@/lib/use-api-mutation";

const EMPTY: Omit<AttemptFormInput, "result"> = {
  minutes: "",
  hint_level: "0",
  dominant_error: "",
  key_technique: "",
  notes_md: "",
};

// Rascunho local: um envio que falhe ou uma recarga não perdem o que foi digitado.
const draftKey = (exerciseId: string) => `sp-attempt-draft:${exerciseId}`;

function readDraft(exerciseId: string): Partial<AttemptFormInput> {
  try {
    return JSON.parse(
      window.localStorage.getItem(draftKey(exerciseId)) ?? "{}",
    ) as Partial<AttemptFormInput>;
  } catch {
    return {};
  }
}

function writeDraft(exerciseId: string, value: unknown): void {
  try {
    if (value === null) window.localStorage.removeItem(draftKey(exerciseId));
    else window.localStorage.setItem(draftKey(exerciseId), JSON.stringify(value));
  } catch {
    // Armazenamento indisponível: o formulário continua funcionando sem rascunho.
  }
}

export function AttemptForm({ exerciseId }: { exerciseId: string }) {
  const errorTypes = useErrorTypes();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<AttemptFormInput>({
    resolver: zodResolver(attemptSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    reset({ ...EMPTY, ...readDraft(exerciseId) });
    const subscription = watch((value) => writeDraft(exerciseId, value));
    return () => subscription.unsubscribe();
  }, [exerciseId, reset, watch]);

  const mutation = useApiMutation(recordAttempt, {
    invalidate: [exerciseKeys.all, reviewKeys.all],
    success: "Tentativa registrada.",
    toastError: false,
    onSuccess: () => {
      reset({ ...EMPTY, result: undefined });
      writeDraft(exerciseId, null);
    },
  });

  const onSubmit = (form: AttemptFormInput) =>
    mutation.mutate(
      { exerciseId, data: toAttemptPayload(form) },
      {
        onError: (error) =>
          applyApiError(error, setError, ["result", "dominant_error", "key_technique", "notes_md"]),
      },
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={errors.root?.message} />

      <fieldset>
        <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
          Resultado
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(RESULT_LABELS).map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-control border border-line-strong px-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
            >
              <input type="radio" value={value} {...register("result")} />
              {label}
            </label>
          ))}
        </div>
        {errors.result && <p className="mt-1 text-xs text-danger">{errors.result.message}</p>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tempo (min)" error={errors.minutes?.message}>
          <Input inputMode="numeric" {...register("minutes")} />
        </Field>
        <Field label="Nível de dica">
          <Select {...register("hint_level")}>
            <option value="0">0 · sem dica</option>
            <option value="1">1 · leve</option>
            <option value="2">2 · média</option>
            <option value="3">3 · solução</option>
          </Select>
        </Field>
        <Field label="Erro dominante" error={errors.dominant_error?.message}>
          <Select {...register("dominant_error")}>
            <option value="">Nenhum</option>
            {errorTypes.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Técnica-chave" error={errors.key_technique?.message}>
        <Input {...register("key_technique")} />
      </Field>
      <Field label="Notas (Markdown e LaTeX)" error={errors.notes_md?.message}>
        <Textarea {...register("notes_md")} />
      </Field>

      <Button type="submit" pending={mutation.isPending} className="w-full sm:w-auto">
        {mutation.isPending ? "Registrando..." : "Registrar tentativa"}
      </Button>
    </form>
  );
}
