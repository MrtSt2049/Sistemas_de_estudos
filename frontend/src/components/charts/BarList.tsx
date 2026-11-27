"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface BarDatum {
  label: string;
  value: number;
}

/** Gráfico de barras de série única; a tabela equivalente fica no componente pai. */
export default function BarList({ data, valueName }: { data: BarDatum[]; valueName: string }) {
  return (
    <div aria-hidden className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--muted)" fontSize={12} tickLine={false} />
          <YAxis allowDecimals={false} stroke="var(--muted)" fontSize={12} tickLine={false} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              color: "var(--text)",
            }}
          />
          <Bar
            dataKey="value"
            name={valueName}
            fill="var(--accent-solid)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
