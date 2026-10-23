import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Building2, CalendarOff, Clock, Shield, User, type LucideIcon } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { FormularioAvisoAusencia } from "@/components/painel/formulario-aviso-ausencia";

const TITULO = "Horas Extras e Horas Faltas";

// Dentro do Aviso de Horas Extra: quem solicita e quem aprova, cada um em seu card.
const FLUXO_HORAS_EXTRA: { titulo: string; subtitulo: string; icone: LucideIcon }[] = [
  { titulo: "Solicitação de Hora Extra", subtitulo: "Colaborador", icone: User },
  { titulo: "Aprovação – Operacional", subtitulo: "Setores operacionais", icone: Shield },
  { titulo: "Aprovação – Administrativo", subtitulo: "Setores administrativos", icone: Building2 },
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
];

export const Route = createFileRoute("/horas-extras-faltas")({
  head: () => ({
    meta: [{ title: "Horas Extras e Horas Faltas — Orcoma Orkomakers" }],
  }),
  component: HorasExtrasFaltasPage,
});

function HorasExtrasFaltasPage() {
  // Card aberto em tela cheia. Quando há um, o outro some.
  const [selecionado, setSelecionado] = useState<string | null>(null);

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
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`flex flex-col justify-start rounded-2xl p-6 text-left shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${cores.fundo} ${cores.texto} ${aberto ? "md:col-span-2 min-h-[60vh]" : "cursor-pointer hover:shadow-lg"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex size-10 items-center justify-center rounded-lg ${cores.icone}`}>
                        <Icone className="size-5" aria-hidden />
                      </span>
                      <h2 className="font-display text-xl font-semibold">{titulo}</h2>
                    </div>
                    <p className="mt-4 text-sm font-medium">{descricao}</p>

                    {aberto && id === "horas-extra" && (
                      <div className="mt-8 grid gap-4 md:grid-cols-3">
                        {FLUXO_HORAS_EXTRA.map((etapa, indice) => {
                          const IconeEtapa = etapa.icone;
                          return (
                            <motion.div
                              key={etapa.titulo}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 + indice * 0.08, ease: "easeOut" }}
                              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm"
                            >
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <IconeEtapa className="size-5" aria-hidden />
                              </span>
                              <div>
                                <p className="font-semibold">{etapa.titulo}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{etapa.subtitulo}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
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
                  </motion.div>
                );
              },
            )}
          </AnimatePresence>
        </motion.div>
      </main>
      <PerfilFlutuante />
    </div>
  );
}
