"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormError } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useDisciplines, useTopicTree } from "@/features/disciplines/queries";
import { flattenTree } from "@/features/disciplines/utils";
import {
  createSource,
  saveExercise,
  type Exercise,
  type SourceKind,
} from "@/features/exercises/api";
import { exerciseKeys, useSources } from "@/features/exercises/queries";
import {
  exerciseSchema,
  SOURCE_KIND_LABELS,
  type ExerciseFormInput,
} from "@/features/exercises/schemas";
import { applyApiError } from "@/lib/forms";
import { useApiMutation } from "@/lib/use-api-mutation";

const FIELDS = [
  "title",
  "discipline",
  "source",
  "topic",
  "external_ref",
  "difficulty",
  "url",
  "statement_md",
  "solution_md",
] as const;

export function ExerciseForm({
  exercise,
  onSaved,
}: {
  exercise?: Exercise;
  onSaved: (saved: Exercise) => void;
}) {
  const disciplines = useDisciplines();
  const sources = useSources();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExerciseFormInput>({
    resolver: zodResolver(exerciseSchema),
    values: {
      title: exercise?.title ?? "",
      discipline: exercise?.discipline ?? "",
      source: exercise?.source ?? "",
      topic: exercise?.topic ?? "",
      external_ref: exercise?.external_ref ?? "",
      difficulty: String(exercise?.difficulty ?? "") as ExerciseFormInput["difficulty"],
      url: exercise?.url ?? "",
      statement_md: exercise?.statement_md ?? "",
      solution_md: exercise?.solution_md ?? "",
    },
    resetOptions: { keepDirtyValues: true },
  });
  const topics = useTopicTree(watch("discipline"));

  const mutation = useApiMutation(saveExercise, {
    invalidate: [exerciseKeys.all],
    success: "Exercício salvo.",
    toastError: false,
    onSuccess: onSaved,
  });

  const onSubmit = (form: ExerciseFormInput) =>
    mutation.mutate(
      {
        id: exercise?.id,
        data: {
          ...form,
          topic: form.topic || null,
          difficulty: form.difficulty ? Number(form.difficulty) : null,
        },
      },
      { onError: (error) => applyApiError(error, setError, FIELDS) },
    );

  return (
    <div className="space-y-4">
      <NewSource onCreated={(id) => setValue("source", id, { shouldDirty: true })} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError message={errors.root?.message} />
        <Field label="Título" error={errors.title?.message}>
          <Input {...register("title")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Disciplina" error={errors.discipline?.message}>
            <Select {...register("discipline", { onChange: () => setValue("topic", "") })}>
              <option value="">Escolha</option>
              {disciplines.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tópico" error={errors.topic?.message}>
            <Select {...register("topic")}>
              <option value="">Nenhum</option>
              {flattenTree(topics.data ?? []).map(({ node, depth }) => (
                <option key={node.id} value={node.id}>
                  {`${"— ".repeat(depth - 1)}${node.title}`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fonte" error={errors.source?.message}>
            <Select {...register("source")}>
              <option value="">Escolha</option>
              {sources.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Referência" hint="Ex.: 2023-P2-Q4" error={errors.external_ref?.message}>
            <Input {...register("external_ref")} />
          </Field>
          <Field label="Dificuldade" error={errors.difficulty?.message}>
            <Select {...register("difficulty")}>
              <option value="">Não definida</option>
              {[1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Link" error={errors.url?.message}>
            <Input type="url" {...register("url")} />
          </Field>
        </div>
        <Field label="Enunciado (Markdown e LaTeX)" error={errors.statement_md?.message}>
          <Textarea rows={6} {...register("statement_md")} />
        </Field>
        <Field label="Solução (Markdown e LaTeX)" error={errors.solution_md?.message}>
          <Textarea rows={6} {...register("solution_md")} />
        </Field>
        <Button type="submit" pending={mutation.isPending} className="w-full">
          {mutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </div>
  );
}

function NewSource({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<SourceKind>("olympiad");
  const create = useApiMutation(createSource, {
    invalidate: [exerciseKeys.sources],
    success: "Fonte criada.",
    onSuccess: (source) => {
      setName("");
      onCreated(source.id);
    },
  });

  return (
    <details className="rounded-control border border-line p-3">
      <summary className="cursor-pointer text-sm text-muted">Cadastrar nova fonte</summary>
      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) create.mutate({ name: name.trim(), kind });
        }}
      >
        <Field label="Nome da fonte" className="min-w-40 flex-1">
          <Input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Tipo da fonte">
          <Select value={kind} onChange={(e) => setKind(e.target.value as SourceKind)}>
            {Object.entries(SOURCE_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="secondary" pending={create.isPending}>
          Criar
        </Button>
      </form>
    </details>
  );
}
