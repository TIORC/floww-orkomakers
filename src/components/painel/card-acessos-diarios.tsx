import { ArrowDown, ArrowUp, Minus, MonitorSmartphone } from "lucide-react";

import { cn } from "@/lib/utils";

// Formato retornado pela função get_acessos_diario_comparativo (migration em supabase/migrations).
export type AcessosDiariosData = {
  meus_acessos: number;
  media_empresa: number;
  percentual: number;
  comparativo: string;
  erro?: string;
};

// Valores de exemplo enquanto os dados reais não estiverem conectados.
const EXEMPLO: AcessosDiariosData = {
  meus_acessos: 16,
  media_empresa: 13.8,
  percentual: 16,
  comparativo: "16% acima da média da empresa",
};

export function CardAcessosDiarios({ dados }: { dados?: AcessosDiariosData | null }) {
  const info = dados && !dados.erro ? dados : null;
  const valor = info ?? EXEMPLO;

  const tendencia = valor.percentual > 0 ? "alta" : valor.percentual < 0 ? "baixa" : "neutra";
  const Seta = tendencia === "alta" ? ArrowUp : tendencia === "baixa" ? ArrowDown : Minus;

  return (
    <article className="flex h-[230px] w-[280px] shrink-0 flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <MonitorSmartphone className="size-7 shrink-0 text-brand" aria-hidden />
        <span className="font-display text-3xl font-bold text-foreground">
          {info ? valor.meus_acessos : "—"}
        </span>
      </div>
      <h3 className="mt-2 text-sm font-semibold text-muted-foreground">Acessos diários</h3>

      <div className="mt-auto">
        {info ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
              tendencia === "alta" && "bg-accent-green/15 text-accent-green",
              tendencia === "baixa" && "bg-destructive/15 text-destructive",
              tendencia === "neutra" && "bg-muted text-muted-foreground",
            )}
          >
            <Seta className="size-3.5 shrink-0" aria-hidden />
            {info.comparativo}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            Dados indisponíveis
          </span>
        )}
      </div>
    </article>
  );
}
