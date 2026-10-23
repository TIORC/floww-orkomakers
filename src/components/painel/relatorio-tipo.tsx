import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { agruparPorTipo, CORES_MOTIVOS, type MotivoTurnover } from "@/lib/turnover";

// Pizza com os tipos de desligamento (Voluntário e Involuntário), calculada a partir dos motivos.
export function CardTipoTurnover({ motivos }: { motivos: MotivoTurnover[] }) {
  const tipos = agruparPorTipo(motivos);
  const total = tipos.reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold text-white">Turnover por Tipo</h2>
      <p className="mt-1 text-sm text-white/80">
        Desligamentos voluntários e involuntários registrados.
      </p>

      {tipos.length === 0 ? (
        <p className="mt-6 text-sm text-white/80">Nenhum desligamento com tipo cadastrado.</p>
      ) : (
        <div className="mt-6 grid gap-8 xl:grid-cols-2 xl:items-center">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tipos}
                  dataKey="quantidade"
                  nameKey="tipo"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {tipos.map((item, indice) => (
                    <Cell key={item.tipo} fill={CORES_MOTIVOS[indice % CORES_MOTIVOS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(valor: number) => [
                    `${valor} (${Math.round((valor / total) * 100)}%)`,
                    "Desligamentos",
                  ]}
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--panel-active)",
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="space-y-3 text-sm text-white">
            {tipos.map((item, indice) => (
              <li key={item.tipo} className="flex items-center justify-between gap-4">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: CORES_MOTIVOS[indice % CORES_MOTIVOS.length] }}
                    aria-hidden
                  />
                  <span className="truncate">{item.tipo}</span>
                </span>
                <span className="shrink-0 font-semibold">
                  {item.quantidade.toLocaleString("pt-BR")} (
                  {Math.round((item.quantidade / total) * 100)}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
