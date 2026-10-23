import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CORES_MOTIVOS, type MotivoTurnover, QUANTIDADE_MOTIVOS_DESTAQUE } from "@/lib/turnover";

// Barras horizontais: os motivos são textos longos e ficam legíveis na vertical.
export function CardTop5Motivos({ motivos }: { motivos: MotivoTurnover[] }) {
  const top = motivos.slice(0, QUANTIDADE_MOTIVOS_DESTAQUE);

  return (
    <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold text-white">
        Top {QUANTIDADE_MOTIVOS_DESTAQUE} motivos de desligamento
      </h2>
      <p className="mt-1 text-sm text-white/80">Os motivos com mais desligamentos registrados.</p>

      {top.length === 0 ? (
        <p className="mt-6 text-sm text-white/80">Nenhum desligamento com motivo cadastrado.</p>
      ) : (
        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top}
              layout="vertical"
              margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
            >
              <CartesianGrid horizontal={false} stroke="var(--panel-active)" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: "var(--foreground)", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="motivo"
                width={180}
                tick={{ fill: "var(--foreground)", fontSize: 12 }}
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
              <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
                {top.map((item, indice) => (
                  <Cell key={item.motivo} fill={CORES_MOTIVOS[indice % CORES_MOTIVOS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
