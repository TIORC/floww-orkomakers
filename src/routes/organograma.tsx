import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Minus, Plus, UserRound } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buscarPessoasOrganograma } from "@/lib/organograma-dados";
import { getIniciais } from "@/lib/iniciais";
import { montarArvoreOrganograma, type NoOrganograma } from "@/lib/organograma";

export const Route = createFileRoute("/organograma")({
  head: () => ({
    meta: [{ title: "Organograma — Orcoma Orkomakers" }],
  }),
  component: OrganogramaPage,
});

const ZOOM_MINIMO = 0.5;
const ZOOM_MAXIMO = 1.5;
const PASSO_ZOOM = 0.1;

const BOTAO_ZOOM =
  "rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50";

// A planilha já traz "Departamento ..." em alguns casos; evita repetir o prefixo.
function textoDepartamento(departamento: string) {
  if (!departamento) return "Departamento não informado";
  return /^departamento/i.test(departamento) ? departamento : `Departamento ${departamento}`;
}

function CardPessoa({ no }: { no: NoOrganograma }) {
  return (
    <div className="w-72 rounded-xl border border-panel-active border-t-[3px] border-t-brand bg-background px-4 py-3 text-left shadow-lg">
      <div className="flex items-center gap-3">
        <Avatar className="size-11 shrink-0">
          <AvatarImage src={no.fotoUrl || undefined} alt={`Foto de ${no.nome}`} />
          <AvatarFallback className="bg-panel-active text-panel-text">
            {no.nome ? getIniciais(no.nome) : <UserRound className="size-5" aria-hidden />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-white">{no.nome}</p>
          <p className="break-words text-xs text-panel-label">{textoDepartamento(no.departamento)}</p>
          <p className="break-words text-xs font-semibold text-brand">{no.cargo || "Cargo não informado"}</p>
        </div>
      </div>
    </div>
  );
}

// Um nível da árvore. Quem tem equipe ganha um botão + para abrir/fechar; a equipe começa recolhida.
function NoArvore({ no }: { no: NoOrganograma }) {
  const [aberto, setAberto] = useState(false);
  const temEquipe = no.subordinados.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <CardPessoa no={no} />

        {temEquipe && (
          <button
            type="button"
            className="absolute -right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-brand bg-panel text-brand transition hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label={aberto ? `Recolher equipe de ${no.nome}` : `Expandir equipe de ${no.nome}`}
            aria-expanded={aberto}
            onClick={() => setAberto((atual) => !atual)}
          >
            {aberto ? <Minus className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
          </button>
        )}
      </div>

      {aberto && temEquipe && (
        <>
          <div className="h-6 w-px bg-panel-label" aria-hidden />
          {/* Sem gap: o espaço entre irmãos é padding interno do item, para a linha horizontal seguir contínua. */}
          <ul className="flex">
            {no.subordinados.map((subordinado, indice) => {
              const primeiro = indice === 0;
              const ultimo = indice === no.subordinados.length - 1;
              const unico = primeiro && ultimo;

              return (
                <li key={subordinado.id} className="relative flex flex-col items-center px-3 pt-6">
                  {!unico && (
                    <span
                      aria-hidden
                      className={
                        primeiro
                          ? "absolute left-1/2 right-0 top-0 h-px bg-panel-label"
                          : ultimo
                            ? "absolute left-0 right-1/2 top-0 h-px bg-panel-label"
                            : "absolute left-0 right-0 top-0 h-px bg-panel-label"
                      }
                    />
                  )}
                  <span aria-hidden className="absolute left-1/2 top-0 h-6 w-px bg-panel-label" />
                  <NoArvore no={subordinado} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function OrganogramaPage() {
  const { data: pessoas = [], isPending, isError } = useQuery({
    queryKey: ["organograma"],
    queryFn: buscarPessoasOrganograma,
  });
  const raizes = useMemo(() => montarArvoreOrganograma(pessoas), [pessoas]);
  const [zoom, setZoom] = useState(1);

  function alterarZoom(delta: number) {
    setZoom((atual) => Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, Math.round((atual + delta) * 10) / 10)));
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="flex min-w-0 flex-1 flex-col px-10 pb-10 pt-24">
        <PerfilFlutuante />
        <section className="flex flex-1 flex-col rounded-2xl border border-panel-active bg-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-semibold text-white">Organograma</h1>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => alterarZoom(PASSO_ZOOM)}
                disabled={zoom >= ZOOM_MAXIMO}
                className={BOTAO_ZOOM}
              >
                Zoom +
              </button>
              <button
                type="button"
                onClick={() => alterarZoom(-PASSO_ZOOM)}
                disabled={zoom <= ZOOM_MINIMO}
                className={BOTAO_ZOOM}
              >
                Zoom -
              </button>
            </div>
          </div>

          {isPending && <p className="py-12 text-center text-sm text-white/80">Carregando organograma...</p>}

          {isError && <p className="py-12 text-center text-sm text-destructive">Não foi possível carregar o organograma.</p>}

          {!isPending && !isError && raizes.length === 0 && (
            <p className="py-12 text-center text-sm text-white/80">Nenhum colaborador cadastrado.</p>
          )}

          {raizes.length > 0 && (
            <div className="mt-6 flex-1 overflow-auto pb-4">
              <div className="flex min-w-max justify-center gap-10" style={{ zoom }}>
                {raizes.map((raiz) => (
                  <NoArvore key={raiz.id} no={raiz} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
