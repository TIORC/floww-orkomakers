import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DesligamentosMes } from "@/lib/turnover";

// Colunas verticais (formato de prédios) com a quantidade de desligamentos de cada mês.
export function CardDesligamentosMes({ serie }: { serie: DesligamentosMes[] }) {
  return (
    <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold text-white">Turnover por mês</h2>
      <p className="mt-1 text-sm text-white/80">
        Número de desligamentos em cada mês, nos últimos 12 meses.
      </p>

      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serie} margin={{ top: 24, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--panel-active)" />
            <XAxis dataKey="periodo" tick={{ fill: "var(--foreground)", fontSize: 12 }} />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
              width={40}
            />
            <Tooltip
              cursor={{ fill: "var(--panel-active)", fillOpacity: 0.3 }}
              formatter={(valor: number) => [valor.toLocaleString("pt-BR"), "Desligamentos"]}
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--panel-active)",
                borderRadius: 8,
              }}
            />
            <Bar dataKey="quantidade" fill="oklch(0.82 0.16 80)" radius={[6, 6, 0, 0]}>
              <LabelList
                dataKey="quantidade"
                position="top"
                fill="var(--foreground)"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
