"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorState, Skeleton } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses } from "@/components/ui/button";
import { TopicTree } from "@/features/disciplines/components/TopicTree";
import { useDiscipline } from "@/features/disciplines/queries";
import { KIND_LABELS } from "@/features/disciplines/schemas";

export default function DisciplinePage() {
  const { id } = useParams<{ id: string }>();
  const query = useDiscipline(id);

  if (query.isLoading) return <Skeleton />;
  if (query.isError || !query.data) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }

  return (
    <section className="mx-auto max-w-5xl space-y-7">
      <PageHeader
        title={query.data.name}
        description={KIND_LABELS[query.data.kind]}
        actions={
          <Link href="/disciplines" className={buttonClasses("secondary")}>
            Voltar
          </Link>
        }
      />
      <TopicTree disciplineId={id} />
    </section>
  );
}
