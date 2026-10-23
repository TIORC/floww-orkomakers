import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { CORES_MOTIVOS, type TurnoverPorDepartamento } from "@/lib/turnover";

const QUANTIDADE_TOP = 5;

// Pizza com os 5 departamentos que mais tiveram desligamentos, em porcentagem do total.
export function CardDepartamentoTurnover({ dados }: { dados: TurnoverPorDepartamento }) {
  const { total } = dados;
  const top = dados.departamentos.slice(0, QUANTIDADE_TOP).map((item) => ({
    ...item,
    percentual: Math.round((item.quantidade / total) * 100),
  }));

  return (
    <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold text-white">Turnover por Departamento</h2>
      <p className="mt-1 text-sm text-white/80">
        Os 5 departamentos com mais desligamentos, em porcentagem do total.
      </p>

      {top.length === 0 ? (
        <p className="mt-6 text-sm text-white/80">
          Nenhum desligamento com departamento cadastrado.
        </p>
      ) : (
        <div className="mt-6 grid gap-8 xl:grid-cols-2 xl:items-center">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={top}
                  dataKey="quantidade"
                  nameKey="departamento"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {top.map((item, indice) => (
                    <Cell
                      key={item.departamento}
                      fill={CORES_MOTIVOS[indice % CORES_MOTIVOS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(valor: number, _nome, item) => [
                    `${valor} (${item.payload.percentual}%)`,
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
            {top.map((item, indice) => (
              <li key={item.departamento} className="flex items-center justify-between gap-4">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: CORES_MOTIVOS[indice % CORES_MOTIVOS.length] }}
                    aria-hidden
                  />
                  <span className="truncate">{item.departamento}</span>
                </span>
                <span className="shrink-0 font-semibold">{item.percentual}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
