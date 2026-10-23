import type { LucideIcon } from "lucide-react";
import { Percent, UserMinus, Users } from "lucide-react";

import type { ConsolidadoTurnover } from "@/lib/turnover";

const formatarNumero = (valor: number) =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });

// Indicador grande: ícone acima, rótulo e valor centralizados.
function Indicador({
  icone: Icone,
  rotulo,
  valor,
}: {
  icone: LucideIcon;
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
        <Icone className="size-8" aria-hidden />
      </span>
      <p className="text-base text-white/80">{rotulo}</p>
      <p className="font-display text-5xl font-semibold text-white">{valor}</p>
    </div>
  );
}

// Indicadores gerais do turnover, calculados sobre todo o cadastro (sem recorte de datas).
// Taxa e média ficam lado a lado; o total de desligamentos fica centralizado abaixo.
export function CardConsolidadoTurnover({ dados }: { dados: ConsolidadoTurnover }) {
  return (
    <section className="flex flex-col rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold text-white">Consolidado por período</h2>
      <p className="mt-1 text-sm text-white/80">
        Taxa de turnover e base de colaboradores no período.
      </p>

      <div className="flex flex-1 flex-col justify-center gap-2 py-8">
        <div className="grid gap-10 sm:grid-cols-2">
          <Indicador
            icone={Percent}
            rotulo="Taxa de turnover"
            valor={`${formatarNumero(dados.taxaTurnover)}%`}
          />
          <Indicador
            icone={Users}
            rotulo="Média de ativos"
            valor={formatarNumero(dados.mediaAtivos)}
          />
        </div>
        <div className="flex justify-center">
          <Indicador
            icone={UserMinus}
            rotulo="Total de desligamentos"
            valor={dados.totalDesligamentos.toLocaleString("pt-BR")}
          />
        </div>
      </div>
    </section>
  );
}
