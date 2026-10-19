import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";

export const Route = createFileRoute("/organograma")({
  head: () => ({
    meta: [{ title: "Organograma — Orcoma Orkomakers" }],
  }),
  component: OrganogramaPage,
});

const ZOOM_MINIMO = 0.5;
const ZOOM_MAXIMO = 1.5;
const PASSO_ZOOM = 0.1;

// Sem dados por enquanto: a árvore de colaboradores chega da fonte real depois.
const RAIZES: never[] = [];

function OrganogramaPage() {
  const [zoom, setZoom] = useState(1);

  function alterarZoom(delta: number) {
    setZoom((atual) => Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, Math.round((atual + delta) * 10) / 10)));
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="flex min-w-0 flex-1 flex-col px-10 pb-10 pt-24">
        <section className="flex flex-1 flex-col rounded-2xl border border-panel-active bg-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-semibold text-white">Organograma</h1>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => alterarZoom(PASSO_ZOOM)}
                disabled={zoom >= ZOOM_MAXIMO}
                className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Zoom +
              </button>
              <button
                type="button"
                onClick={() => alterarZoom(-PASSO_ZOOM)}
                disabled={zoom <= ZOOM_MINIMO}
                className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Zoom -
              </button>
            </div>
          </div>

          {RAIZES.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/80">Nenhum colaborador cadastrado.</p>
          ) : null}

          <div className="mt-6 flex-1 overflow-auto pb-4" style={{ zoom }} />
        </section>
      </main>
    </div>
  );
}
