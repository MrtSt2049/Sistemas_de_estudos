"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { startDownload } from "@/lib/api-client";
import { errorMessage } from "@/lib/use-api-mutation";

const EXPORTS = [
  {
    path: "/export/json/",
    title: "Todos os dados (JSON)",
    description: "Cópia completa dos seus registros, para guardar ou migrar.",
  },
  {
    path: "/export/markdown/",
    title: "Exercícios e revisões (Markdown)",
    description: "Arquivo zip legível, com fórmulas preservadas.",
  },
  {
    path: "/export/ics/",
    title: "Calendário (ICS)",
    description: "Eventos e prazos de metas para importar em outro calendário.",
  },
];

export default function SettingsPage() {
  const [pending, setPending] = useState<string | null>(null);

  const download = async (path: string) => {
    setPending(path);
    try {
      await startDownload(path);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-7">
      <PageHeader title="Configurações" description="Seus dados pertencem a você." />
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Exportar dados</h2>
        {EXPORTS.map((item) => (
          <Card key={item.path} className="flex flex-wrap items-center gap-3 sm:p-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium">{item.title}</h3>
              <p className="text-xs text-muted">{item.description}</p>
            </div>
            <Button
              variant="secondary"
              pending={pending === item.path}
              aria-label={`Baixar ${item.title}`}
              onClick={() => download(item.path)}
            >
              <Download className="size-4" strokeWidth={1.8} aria-hidden />
              Baixar
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
