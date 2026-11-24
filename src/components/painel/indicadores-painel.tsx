import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, CodeXml, Flame, TrendingUp, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useUsuarioLogado } from "@/hooks/use-usuario-logado";
import { contarReconhecimentosTrimestre, trimestreAtual } from "@/lib/reconhecimentos";
import { COMPETENCIAS_FEEDBACK, buscarPercentuaisFeedbacks } from "@/lib/feedbacks";
import { CardAcessosDiarios } from "@/components/painel/card-acessos-diarios";

const CARD = "flex h-[230px] w-[280px] shrink-0 flex-col rounded-2xl border border-border bg-card p-5";

const COR_COMPETENCIA: Record<(typeof COMPETENCIAS_FEEDBACK)[number]["id"], string> = {
  "proatividade-autonomia": "bg-destructive",
  "confiabilidade-transparencia": "bg-emerald-500",
  "encantamento-cliente": "bg-brand",
  "responsabilidade-produtividade": "bg-blue-600",
};

const TITULO_ATIVIDADES = "atividades-painel-titulo";

function HeroCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex w-max min-w-full items-stretch gap-4 rounded-2xl bg-panel p-6">{children}</div>
    </div>
  );
}

// Mesmo visual do card de acessos: ícone grande, rótulo abaixo e pílula de status embaixo.
function CardMetrica({
  icone: Icone,
  rotulo,
  cor,
  valor = "—",
  children,
}: {
  icone: LucideIcon;
  rotulo: string;
  cor: string;
  valor?: string;
  children?: ReactNode;
}) {
  return (
    <article className={CARD}>
      <div className="flex items-center gap-3">
        <Icone className={cn("size-7 shrink-0", cor)} aria-hidden />
        <span className="font-display text-3xl font-bold text-foreground">{valor}</span>
      </div>
      <h3 className="mt-2 text-sm font-semibold text-muted-foreground">{rotulo}</h3>

      <div className="mt-auto">
        {children ?? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            Dados indisponíveis
          </span>
        )}
      </div>
    </article>
  );
}

// Recebidos e enviados no trimestre atual, contando as mesmas publicações da página de Reconhecimentos.
function CardReconhecimentos() {
  const { data: usuario } = useUsuarioLogado();
  const trimestre = trimestreAtual();
  const { data, isError } = useQuery({
    queryKey: ["reconhecimentos-trimestre", usuario?.email ?? "", trimestre.inicio.toISOString()],
    queryFn: () => contarReconhecimentosTrimestre(usuario?.email ?? "", usuario?.setor ?? ""),
    enabled: Boolean(usuario?.email),
  });

  return (
    <article className={CARD}>
      <div className="flex items-center gap-3">
        <Award className="size-7 shrink-0 text-destructive" aria-hidden />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Recebidos</p>
            <p className="font-display text-2xl font-bold text-foreground">{data ? data.recebidos : "—"}</p>
          </div>
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Enviados</p>
            <p className="font-display text-2xl font-bold text-foreground">{data ? data.enviados : "—"}</p>
          </div>
        </div>
      </div>
      <h3 className="mt-2 text-sm font-semibold text-muted-foreground">Reconhecimentos</h3>

      <div className="mt-auto">
        {isError ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            Dados indisponíveis
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            {trimestre.rotulo}
          </span>
        )}
      </div>
    </article>
  );
}

function BarraProgresso({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 flex-1 text-[0.65rem] font-semibold leading-tight text-white">{rotulo}</span>
        <span className="shrink-0 text-[0.65rem] font-bold text-muted-foreground">{valor}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={rotulo}
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("h-full rounded-full", cor)} style={{ width: `${valor}%` }} />
      </div>
    </div>
  );
}

// Média geral de todos os feedbacks recebidos pelo colaborador logado (escala 0–5 convertida em %).
function CardConstancia() {
  const { data: usuario } = useUsuarioLogado();
  const { data: percentuais, isError } = useQuery({
    queryKey: ["feedbacks-percentuais", usuario?.email ?? ""],
    queryFn: () => buscarPercentuaisFeedbacks(usuario?.email ?? ""),
    enabled: Boolean(usuario?.email),
  });

  return (
    <article className={CARD}>
      <div className="flex items-center gap-3">
        <Flame className="size-7 shrink-0 text-brand" aria-hidden />
      </div>
      <h3 className="mt-2 text-sm font-semibold text-muted-foreground">Constância</h3>
      {isError ? (
        <div className="mt-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            Dados indisponíveis
          </span>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2.5">
          {(percentuais ?? COMPETENCIAS_FEEDBACK.map((c) => ({ id: c.id, rotulo: c.rotulo, valor: 0 }))).map((competencia) => (
            <BarraProgresso
              key={competencia.id}
              rotulo={competencia.rotulo}
              valor={competencia.valor}
              cor={COR_COMPETENCIA[competencia.id]}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export function IndicadoresPainel() {
  return (
    <section aria-labelledby={TITULO_ATIVIDADES} className="mt-10">
      <h2 id={TITULO_ATIVIDADES} className="font-display text-xl font-semibold text-muted-foreground">
        Acompanhe suas atividades!
      </h2>

      <div className="mt-4">
        <HeroCard>
          <CardAcessosDiarios />
          <CardMetrica icone={TrendingUp} rotulo="Evolução profissional" cor="text-[oklch(0.62_0.15_152)]" />
          <CardMetrica icone={CodeXml} rotulo="Desenvolvimento" cor="text-[oklch(0.32_0.13_258)]" />
          <CardReconhecimentos />
          <CardConstancia />
        </HeroCard>
      </div>
    </section>
  );
}
