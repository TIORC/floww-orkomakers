import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  COR_OUTROS,
  CORES_MOTIVOS,
  type MotivoTurnover,
  QUANTIDADE_MOTIVOS_DESTAQUE,
} from "@/lib/turnover";

type FatiaMotivo = MotivoTurnover & { cor: string };

// Pizza com os motivos principais e uma fatia "Outros". A lista completa abre num modal.
export function CardMotivos({ motivos }: { motivos: MotivoTurnover[] }) {
  const [todosAbertos, setTodosAbertos] = useState(false);
  const total = motivos.reduce((soma, item) => soma + item.quantidade, 0);
  const destaques = motivos.slice(0, QUANTIDADE_MOTIVOS_DESTAQUE);
  const restantes = motivos.slice(QUANTIDADE_MOTIVOS_DESTAQUE);
  const quantidadeOutros = restantes.reduce((soma, item) => soma + item.quantidade, 0);

  const fatias: FatiaMotivo[] = destaques.map((item, indice) => ({
    ...item,
    cor: CORES_MOTIVOS[indice % CORES_MOTIVOS.length] ?? COR_OUTROS,
  }));
  if (restantes.length > 0) {
    fatias.push({
      motivo: `Outros (${restantes.length} motivos)`,
      quantidade: quantidadeOutros,
      cor: COR_OUTROS,
    });
  }

  const percentual = (quantidade: number) => Math.round((quantidade / total) * 100);

  return (
    <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold text-white">Turnover por Motivo</h2>
      <p className="mt-1 text-sm text-white/80">
        Distribuição dos desligamentos registrados, por motivo.
      </p>

      {motivos.length === 0 ? (
        <p className="mt-6 text-sm text-white/80">Nenhum desligamento com motivo cadastrado.</p>
      ) : (
        <div className="mt-6 grid gap-8 xl:grid-cols-2 xl:items-center">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fatias}
                  dataKey="quantidade"
                  nameKey="motivo"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {fatias.map((item) => (
                    <Cell key={item.motivo} fill={item.cor} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(valor: number) => [
                    `${valor} (${percentual(valor)}%)`,
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

          <div>
            <ul className="space-y-3 text-sm text-white">
              {fatias.map((item) => (
                <li key={item.motivo} className="flex items-center justify-between gap-4">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: item.cor }}
                      aria-hidden
                    />
                    <span className="truncate">{item.motivo}</span>
                  </span>
                  <span className="shrink-0 font-semibold">{percentual(item.quantidade)}%</span>
                </li>
              ))}
            </ul>

            {restantes.length > 0 ? (
              <button
                type="button"
                onClick={() => setTodosAbertos(true)}
                className="mt-5 rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10"
              >
                Ver todos os motivos
              </button>
            ) : null}
          </div>
        </div>
      )}

      <Dialog open={todosAbertos} onOpenChange={setTodosAbertos}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Todos os motivos de desligamento</DialogTitle>
            <DialogDescription>
              Porcentagem de cada motivo sobre o total de desligamentos.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3 text-sm">
            {motivos.map((item) => (
              <li key={item.motivo} className="flex items-center justify-between gap-4">
                <span className="min-w-0 break-words">{item.motivo}</span>
                <span className="shrink-0 font-semibold">{percentual(item.quantidade)}%</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}
