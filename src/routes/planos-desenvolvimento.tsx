import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Plus, Sparkles, Target, X } from "lucide-react";

import { CartaoColaborador } from "@/components/ferias/cartao-colaborador";
import { PerfilColaboradorDialog } from "@/components/perfil/perfil-colaborador-dialog";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { podeProgramarFerias, useUsuarioLogado } from "@/hooks/use-usuario-logado";
import { listarEquipeDireta, ordenarPorGraduacao } from "@/lib/colaboradores-diretorio";
import { buscarPessoasOrganograma } from "@/lib/organograma-dados";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planos-desenvolvimento")({
  head: () => ({
    meta: [{ title: "Planos de Desenvolvimento — Orcoma Orkomakers" }],
  }),
  component: PlanosDesenvolvimento,
});

const ABAS = ["Ativos", "Finalizados", "Expirados"] as const;
type Aba = (typeof ABAS)[number];

// Sem dados por enquanto: planos, equipe e objetivos chegam da fonte real depois.
const PLANOS: never[] = [];
const OBJETIVOS: never[] = [];

function PlanosDesenvolvimento() {
  const [aba, setAba] = useState<Aba>("Ativos");
  const [novidadeAberta, setNovidadeAberta] = useState(true);
  // Perfil aberto pelo olho de um cartão da equipe (só leitura).
  const [perfilAberto, setPerfilAberto] = useState<string | null>(null);
  const { data: usuario, isPending: carregandoUsuario } = useUsuarioLogado();
  const emailUsuario = usuario?.email ?? "";
  // Mesma regra da Programação de Férias: quem gerencia vê a própria equipe; os demais, a do gestor direto.
  // A equipe sempre inclui o próprio usuário, que aparece destacado.
  const gestorDoUsuario = usuario?.gestorDiretoEmail || emailUsuario;
  const emailGestor = podeProgramarFerias(usuario) ? emailUsuario : gestorDoUsuario;
  const organograma = useQuery({
    queryKey: ["organograma"],
    queryFn: buscarPessoasOrganograma,
    enabled: Boolean(emailGestor),
  });
  const equipeDireta = useQuery({
    queryKey: ["equipe-direta", emailGestor],
    queryFn: () => listarEquipeDireta(emailGestor),
    enabled: Boolean(emailGestor),
  });
  const lider = organograma.data?.find(
    (pessoa) => pessoa.email.trim().toLowerCase() === emailGestor.trim().toLowerCase(),
  );
  const equipe = useMemo(
    () => ordenarPorGraduacao(equipeDireta.data ?? []).filter((pessoa) => pessoa.email !== lider?.email),
    [equipeDireta.data, lider?.email],
  );
  const carregandoEquipe = carregandoUsuario || equipeDireta.isPending || organograma.isPending;
  const erroEquipe = equipeDireta.isError || organograma.isError;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 space-y-6 px-10 pb-10 pt-24">
        <section className="rounded-2xl border border-panel-active bg-panel p-6">
          <h1 className="font-display text-xl font-semibold text-white">Meu Desenvolvimento</h1>
        </section>

        <section className="rounded-2xl border border-panel-active bg-panel p-6">
          {novidadeAberta ? (
            <div className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3">
              <Sparkles className="size-4 shrink-0 text-brand" aria-hidden />
              <p className="min-w-0 flex-1 text-sm text-white">
                Novidade! Organize seus objetivos e acompanhe seu desenvolvimento.
              </p>
              <button type="button" className="text-sm font-semibold text-brand underline underline-offset-4">
                Criar meu PDI
              </button>
              <button
                type="button"
                aria-label="Fechar novidade"
                onClick={() => setNovidadeAberta(false)}
                className="rounded-md p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" className="flex gap-1 rounded-lg bg-background p-1">
              {ABAS.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={aba === item}
                  onClick={() => setAba(item)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                    aba === item ? "bg-brand text-slate-900" : "text-white hover:bg-panel-active",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
            >
              <Plus className="size-4" aria-hidden />
              Criar um plano
            </button>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
            <div className="flex min-h-[26rem] flex-col items-center justify-center rounded-2xl bg-background p-8 text-center">
              {PLANOS.length === 0 ? (
                <>
                  <div className="flex size-40 items-center justify-center rounded-full bg-panel-active">
                    <ClipboardCheck className="size-16 text-brand" aria-hidden />
                  </div>
                  <p className="mt-6 font-semibold text-white">Nenhum plano ativo no momento</p>
                  <p className="mt-1 text-sm text-white">
                    Crie um plano para transformar seus objetivos em próximos passos.
                  </p>
                </>
              ) : null}
            </div>

            <aside className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">Minha equipe</h2>
                {carregandoEquipe ? (
                  <p className="mt-3 text-sm text-white/70">Carregando…</p>
                ) : erroEquipe ? (
                  <p className="mt-3 text-sm text-red-400">Não consegui carregar a equipe.</p>
                ) : (
                  <div className="mt-3 grid gap-6">
                    {lider && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/70">Líder</p>
                        <CartaoColaborador
                          lider
                          voce={lider.email === emailUsuario}
                          nome={lider.nome}
                          cargo={lider.cargo}
                          fotoUrl={lider.fotoUrl ?? ""}
                          dataAdmissao={lider.dataAdmissao}
                          aoVerPerfil={() => setPerfilAberto(lider.email)}
                        />
                      </div>
                    )}
                    {equipe.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/70">Equipe</p>
                        <ul className="grid gap-3">
                          {equipe.map((pessoa) => (
                            <li key={pessoa.id}>
                              <CartaoColaborador
                                voce={pessoa.email === emailUsuario}
                                nome={pessoa.nome}
                                cargo={pessoa.cargoVisivel}
                                fotoUrl={pessoa.fotoUrl}
                                dataAdmissao={pessoa.dataAdmissao}
                                subLider={pessoa.subliderArea}
                                aoVerPerfil={() => setPerfilAberto(pessoa.email)}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!lider && equipe.length === 0 && (
                      <p className="rounded-xl bg-background p-3 text-sm text-white">
                        Nenhum colaborador ativo encontrado na sua equipe.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h2 className="font-display text-lg font-semibold text-white">Mapa de objetivos</h2>
                <p className="text-xs text-white/70">
                  Acompanhe os objetivos dos seus planos e os que já foram concluídos.
                </p>
                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-brand bg-transparent px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/10"
                >
                  <Target className="size-4" aria-hidden />
                  Ver todos os objetivos ({OBJETIVOS.length})
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <PerfilColaboradorDialog email={perfilAberto} onFechar={() => setPerfilAberto(null)} />
    </div>
  );
}
