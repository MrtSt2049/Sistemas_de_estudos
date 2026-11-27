"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormError } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { saveDiscipline, type Discipline } from "@/features/disciplines/api";
import { disciplineKeys } from "@/features/disciplines/queries";
import {
  disciplineSchema,
  KIND_LABELS,
  type DisciplineFormInput,
} from "@/features/disciplines/schemas";
import { applyApiError } from "@/lib/forms";
import { useApiMutation } from "@/lib/use-api-mutation";

export function DisciplineForm({
  discipline,
  onSaved,
}: {
  discipline?: Discipline;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DisciplineFormInput>({
    resolver: zodResolver(disciplineSchema),
    defaultValues: {
      name: discipline?.name ?? "",
      kind: discipline?.kind ?? "olympiad",
      code: discipline?.code ?? "",
    },
  });

  const mutation = useApiMutation(saveDiscipline, {
    invalidate: [disciplineKeys.all],
    success: "Disciplina salva.",
    toastError: false,
    onSuccess: onSaved,
  });

  const onSubmit = (data: DisciplineFormInput) =>
    mutation.mutate(
      { id: discipline?.id, data },
      { onError: (error) => applyApiError(error, setError, ["name", "kind", "code"]) },
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={errors.root?.message} />
      <Field label="Nome" error={errors.name?.message}>
        <Input {...register("name")} />
      </Field>
      <Field label="Tipo" error={errors.kind?.message}>
        <Select {...register("kind")}>
          {Object.entries(KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Código (opcional)" error={errors.code?.message}>
        <Input {...register("code")} />
      </Field>
      <Button type="submit" pending={mutation.isPending} className="w-full">
        {mutation.isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
