import { PageHeader } from "@/components/layout/PageHeader";
import { ReviewQueueCard } from "@/features/reviews/components/ReviewQueueCard";

export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-7">
      <PageHeader title="Dashboard" description="O que pede sua atenção hoje." />
      <ReviewQueueCard />
    </section>
  );
}
