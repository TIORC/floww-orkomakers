import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Megaphone, Sparkles } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicarComunicadoDialog } from "@/components/painel/publicar-comunicado-dialog";

export const Route = createFileRoute("/comunicados")({
  head: () => ({
    meta: [{ title: "Comunicados — Orcoma Orkomakers" }],
  }),
  component: ComunicadosPage,
});

const ABAS = [
  { id: "destaque", rotulo: "Em Destaque" },
  { id: "geral", rotulo: "Geral" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

async function listarComunicados() {
  const { data, error } = await supabase
    .from("comunicados")
    .select("id, titulo, mensagem, destaque, publicado_em")
    .order("publicado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function EmptyComunicados({ destaque }: { destaque: boolean }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative mb-6 grid size-36 place-items-center rounded-[2rem] bg-brand/10 text-brand sm:size-44">
        <Megaphone className="size-20 sm:size-24" strokeWidth={1.2} aria-hidden />
        <span className="absolute -right-1 top-2 grid size-9 place-items-center rounded-full bg-brand text-slate-900 shadow-sm">
          <Sparkles className="size-4" aria-hidden />
        </span>
      </div>
      <h2 className="font-display text-lg font-semibold text-white">
        {destaque ? "Nenhum comunicado em destaque" : "Ainda não há comunicados"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-white/80">
        {destaque
          ? "Quando houver uma informação importante em destaque, ela aparecerá aqui."
          : "Este espaço reúne novidades e informações compartilhadas pela sua empresa."}
      </p>
    </div>
  );
}

function ComunicadosPage() {
  const [aba, setAba] = useState<Aba>("destaque");
  const [aberto, setAberto] = useState(false);
  const { data: todos = [] } = useQuery({ queryKey: ["comunicados"], queryFn: listarComunicados });
  const lista = aba === "destaque" ? todos.filter((c) => c.destaque) : todos;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <section className="min-h-[34rem] rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
          <PublicarComunicadoDialog aberto={aberto} onFechar={() => setAberto(false)} />
          <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
            <h1 className="font-display text-3xl font-semibold text-white">Comunicados</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Melhore a comunicação na sua empresa com novidades e informações compartilhadas em um só lugar.
            </p>
            </div>
            <button
              type="button"
              onClick={() => setAberto(true)}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:brightness-110"
            >
              Publicar comunicado
            </button>
          </header>

          <div role="tablist" className="flex gap-2 border-b border-panel-active">
            {ABAS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={aba === item.id}
                onClick={() => setAba(item.id)}
                className={cn(
                  "-mb-px rounded-t-md border border-b-0 px-4 py-3 text-sm font-semibold transition",
                  aba === item.id ? "border-brand bg-brand/10 text-brand" : "border-transparent text-white/80 hover:text-white",
                )}
              >
                {item.rotulo}
              </button>
            ))}
          </div>

          {lista.length === 0 ? (
            <EmptyComunicados destaque={aba === "destaque"} />
          ) : (
            <ul className="mt-6 grid gap-4">
              {lista.map((c) => (
                <li key={c.id} className="rounded-xl border border-panel-active bg-background p-5">
                  <p className="text-xs text-white/70">{new Date(c.publicado_em).toLocaleString("pt-BR")}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-white">{c.titulo}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-white/90">{c.mensagem}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
