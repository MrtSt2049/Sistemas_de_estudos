export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-tight text-text">Dashboard</h1>
        <p className="text-sm text-muted">
          Fundação técnica (Fase 0) ativa. Os indicadores diários e semanais entram na Fase 1.
        </p>
      </header>

      <div className="rounded-[14px] border border-line bg-surface p-6">
        <h2 className="text-sm font-medium text-text">Nenhum registro de estudo ainda</h2>
        <p className="mt-1 text-sm text-muted">
          Autenticação por cookies HttpOnly, temas claro e escuro e contrato da API estão prontos.
        </p>
      </div>
    </section>
  );
}
