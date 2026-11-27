"use client";

import dynamic from "next/dynamic";
import type { BarDatum } from "@/components/charts/BarList";
import { Card } from "@/components/ui/card";

// Recharts só é baixado quando há um gráfico na tela.
const BarList = dynamic(() => import("@/components/charts/BarList"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-control bg-surface-2" />,
});

export function ChartCard({
  title,
  data,
  labelName,
  valueName,
  emptyText,
}: {
  title: string;
  data: BarDatum[];
  labelName: string;
  valueName: string;
  emptyText: string;
}) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-muted">{emptyText}</p>
      ) : (
        <>
          <BarList data={data} valueName={valueName} />
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-muted">Ver como tabela</summary>
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="py-1 font-medium">{labelName}</th>
                  <th className="py-1 font-medium">{valueName}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.label} className="border-t border-line">
                    <td className="py-1">{item.label}</td>
                    <td className="py-1 font-mono">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </Card>
  );
}
