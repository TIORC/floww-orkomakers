import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CalendarOff, Clock, RotateCcw } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { FormularioAvisoAusencia } from "@/components/painel/formulario-aviso-ausencia";
import { FormularioHoraExtra } from "@/components/painel/formulario-hora-extra";
import { FundoAvisoSvg } from "@/components/painel/fundo-aviso-svg";
import { FormularioRetrabalho } from "@/components/painel/formulario-retrabalho";
import { MinhasSolicitacoes } from "@/components/painel/minhas-solicitacoes";
import { excluirAviso, listarAvisosParaAprovar, listarMeusAvisos } from "@/lib/avisos";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AguardandoAprovacao } from "@/components/painel/aguardando-aprovacao";
import { podeAprovarAvisos, useUsuarioLogado } from "@/hooks/use-usuario-logado";
import { cn } from "@/lib/utils";

const TITULO = "Horas Extras e Horas Faltas";

type Aba = "solicitacao" | "minhas" | "aguardando";

const ABAS: { valor: Aba; rotulo: string; so_aprovadores?: boolean }[] = [
  { valor: "solicitacao", rotulo: "Solicitação" },
  { valor: "minhas", rotulo: "Minhas Solicitações" },
  { valor: "aguardando", rotulo: "Aguardando Aprovação", so_aprovadores: true },
];

// Cada aviso vira um card, com o que a pessoa registra e para quem vai o pedido.
const AVISOS = [
  {
    id: "horas-extra",
    titulo: "Aviso de Horas Extra",
    descricao: "Comunique as horas extras realizadas para que sejam autorizadas pelo gestor.",
    icone: Clock,
    cores: {
      fundo: "bg-sky-300",
      texto: "text-slate-900",
      icone: "bg-slate-900/10 text-slate-900",
    },
  },
  {
    id: "ausencia",
    titulo: "Aviso de Ausência",
    descricao: "Comunique as horas faltas ou ausências para que sejam autorizadas pelo gestor.",
    icone: CalendarOff,
    cores: {
      fundo: "bg-yellow-400",
      texto: "text-slate-900",
      icone: "bg-slate-900/10 text-slate-900",
    },
  },
  {
    id: "retrabalho",
    titulo: "Aviso de Retrabalho",
    descricao: "Comunique os retrabalhos realizados para que sejam registrados e autorizados pelo gestor.",
    icone: RotateCcw,
    cores: {
      fundo: "bg-violet-400",
      texto: "text-slate-900",
      icone: "bg-slate-900/10 text-slate-900",
    },
  },
];

export const Route = createFileRoute("/horas-extras-faltas")({
  // Permite abrir direto em uma aba: /horas-extras-faltas?aba=minhas (usado pelas notificações).
  validateSearch: (busca: Record<string, unknown>): { aba?: "solicitacao" | "minhas" | "aguardando" } => {
    const valor = busca["aba"];
    return valor === "minhas" || valor === "aguardando" || valor === "solicitacao" ? { aba: valor } : {};
  },
  head: () => ({
    meta: [{ title: "Horas Extras e Horas Faltas — Orcoma Orkomakers" }],
  }),
  component: HorasExtrasFaltasPage,
});

function HorasExtrasFaltasPage() {
  // Card aberto em tela cheia. Quando há um, o outro some.
  const [selecionado, setSelecionado] = useState<string | null>(null);
  // Alterna entre fazer uma nova solicitação e ver as solicitações já feitas.
  const { aba: abaNaUrl } = Route.useSearch();
  const [aba, setAba] = useState<Aba>(abaNaUrl ?? "solicitacao");
  // Se a página já está aberta e a URL muda (ex.: clique numa notificação), acompanha a mudança.
  useEffect(() => {
    if (abaNaUrl) setAba(abaNaUrl);
  }, [abaNaUrl]);
  const { data: usuario } = useUsuarioLogado();
  const queryClient = useQueryClient();
  const podeAprovar = podeAprovarAvisos(usuario);
  // Avisos enviados pela pessoa, e avisos pendentes que chegam a ela para aprovar.
  const meusAvisos = useQuery({
    queryKey: ["avisos-minhas", usuario?.email ?? ""],
    queryFn: () => listarMeusAvisos(usuario?.email ?? ""),
    enabled: Boolean(usuario?.email),
  });
  // Exclui uma solicitação própria (só aparece para o Desenvolvedor do Sistema) e atualiza a lista.
  async function excluirMinhaSolicitacao(id: string) {
    try {
      await excluirAviso(id);
      await queryClient.invalidateQueries({ queryKey: ["avisos-minhas"] });
      toast.success("Solicitação excluída.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível excluir a solicitação.");
    }
  }
  const avisosParaAprovar = useQuery({
    queryKey: ["avisos-aguardando"],
    queryFn: listarAvisosParaAprovar,
    enabled: podeAprovar,
  });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white">{TITULO}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Registre horas extras e ausências para o fluxo de autorização da plataforma.
            </p>
          </div>
          <AnimatePresence>
            {selecionado && (
              <motion.button
                type="button"
                onClick={() => setSelecionado(null)}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="inline-flex items-center gap-2 rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Voltar
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        <div role="group" aria-label="Seção" className="mx-auto mt-6 flex w-fit rounded-full border border-panel-active bg-panel p-1">
          {ABAS.filter((item) => !item.so_aprovadores || podeAprovar).map((item) => {
            const ativa = aba === item.valor;
            return (
              <button
                key={item.valor}
                type="button"
                aria-pressed={ativa}
                onClick={() => {
                  setAba(item.valor);
                  setSelecionado(null);
                }}
                className={cn(
                  "relative rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                  ativa ? "text-slate-900" : "text-white hover:text-brand",
                )}
              >
                {ativa && (
                  <motion.span
                    layoutId="aba-ativa"
                    className="absolute inset-0 rounded-full bg-brand shadow-lg shadow-brand/30"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.rotulo}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={aba}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {aba === "minhas" && (
              <MinhasSolicitacoes
                solicitacoes={meusAvisos.data ?? []}
                aoExcluir={usuario?.nivelAcesso === "desenvolvedor" ? excluirMinhaSolicitacao : undefined}
              />
            )}

            {aba === "aguardando" && podeAprovar && <AguardandoAprovacao solicitacoes={avisosParaAprovar.data ?? []} />}

        {aba === "solicitacao" && (
        <motion.div layout className="mt-8 grid gap-6 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {AVISOS.filter((aviso) => !selecionado || aviso.id === selecionado).map(
              ({ id, titulo, descricao, icone: Icone, cores }) => {
                const aberto = selecionado === id;
                return (
                  <motion.div
                    key={id}
                    layout
                    role={aberto ? undefined : "button"}
                    tabIndex={aberto ? undefined : 0}
                    onClick={aberto ? undefined : () => setSelecionado(id)}
                    onKeyDown={
                      aberto
                        ? undefined
                        : (evento) => {
                            if (evento.key === "Enter" || evento.key === " ") setSelecionado(id);
                          }
                    }
                    whileHover={aberto ? {} : { scale: 1.03 }}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`isolate relative flex flex-col justify-start overflow-hidden rounded-2xl p-6 text-left shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${cores.fundo} ${cores.texto} ${aberto ? "md:col-span-2 min-h-[60vh]" : "cursor-pointer hover:shadow-lg"} ${id === "retrabalho" && !aberto ? "md:col-span-2 md:mx-auto md:w-[calc(50%-0.75rem)]" : ""}`}
                  >
                    <FundoAvisoSvg id={id} />
                    <div className="flex items-center gap-3">
                      <span className={`flex size-10 items-center justify-center rounded-lg ${cores.icone}`}>
                        <Icone className="size-5" aria-hidden />
                      </span>
                      <h2 className="font-display text-xl font-semibold">{titulo}</h2>
                    </div>
                    <p className="mt-4 text-sm font-medium">{descricao}</p>

                    {aberto && id === "horas-extra" && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                        className="cursor-default"
                      >
                        <FormularioHoraExtra />
                      </motion.div>
                    )}

                    {aberto && id === "ausencia" && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                        className="cursor-default"
                      >
                        <FormularioAvisoAusencia />
                      </motion.div>
                    )}

                    {aberto && id === "retrabalho" && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                        className="cursor-default"
                      >
                        <FormularioRetrabalho />
                      </motion.div>
                    )}
                  </motion.div>
                );
              },
            )}
          </AnimatePresence>
        </motion.div>
        )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
