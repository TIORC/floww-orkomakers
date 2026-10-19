import { createFileRoute } from "@tanstack/react-router";

import { PaginaPesquisa } from "@/components/painel/pesquisa-pagina";

export const Route = createFileRoute("/super-pesquisa")({
  head: () => ({
    meta: [{ title: "Super Pesquisa — Orcoma Orkomakers" }],
  }),
  component: SuperPesquisaPage,
});

function SuperPesquisaPage() {
  return (
    <PaginaPesquisa
      titulo="Super Pesquisa"
      descricao="Combine várias dimensões em uma única pesquisa e defina quem vai participar."
      exemplo="Ex.: Pesquisa de fim de ano"
    />
  );
}
