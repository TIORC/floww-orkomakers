import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PontoTurnoverPeriodo } from "@/lib/turnover";

const formatarPorcentagem = (valor: number) =>
  `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

// Curva suave com a taxa de turnover de cada mês. Sem dados, o gráfico aparece zerado.
export function CardTaxaPeriodo({
  serie,
  titulo = "Taxa de turnover do período",
  descricao = "Taxa de turnover de cada mês nos últimos 12 meses.",
}: {
  serie: PontoTurnoverPeriodo[];
  titulo?: string;
  descricao?: string;
}) {
  const dadosGrafico = serie.map((ponto) => ({ ...ponto, taxa: ponto.taxa ?? 0 }));

  return (
    <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold text-white">{titulo}</h2>
      <p className="mt-1 text-sm text-white/80">{descricao}</p>

      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dadosGrafico} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradienteTaxaPeriodo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.82 0.16 80)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.82 0.16 80)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--panel-active)" />
            <XAxis dataKey="periodo" tick={{ fill: "var(--foreground)", fontSize: 12 }} />
            <YAxis
              domain={[0, "auto"]}
              tickFormatter={formatarPorcentagem}
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
              width={56}
            />
            <Tooltip
              formatter={(valor: number) => [formatarPorcentagem(valor), "Taxa de turnover"]}
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--panel-active)",
                borderRadius: 8,
              }}
            />
            <Area
              type="monotone"
              dataKey="taxa"
              stroke="oklch(0.82 0.16 80)"
              strokeWidth={2}
              fill="url(#gradienteTaxaPeriodo)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
