import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";

export const Route = createFileRoute("/planos-desenvolvimento/gestao")({
  head: () => ({
    meta: [{ title: "Gestão dos Planos de Desenvolvimento — Orcoma Orkomakers" }],
  }),
  component: GestaoPlanosPage,
});

// Página provisória: a gestão dos planos será definida depois.
function GestaoPlanosPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <PerfilFlutuante />
        <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
          <header className="flex items-start gap-3">
            <Settings className="mt-1 size-6 shrink-0 text-brand" aria-hidden />
            <div>
              <h1 className="font-display text-3xl font-semibold text-white">
                Gestão dos Planos de Desenvolvimento
              </h1>
              <p className="mt-2 text-sm text-white/80">Em breve.</p>
            </div>
          </header>
        </section>
      </main>
    </div>
  );
}
