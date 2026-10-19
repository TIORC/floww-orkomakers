import { createFileRoute } from "@tanstack/react-router";

import { PaginaPesquisa } from "@/components/painel/pesquisa-pagina";

export const Route = createFileRoute("/pesquisa-engajamento")({
  head: () => ({
    meta: [{ title: "Pesquisa de Engajamento — Orcoma Orkomakers" }],
  }),
  component: PesquisaEngajamentoPage,
});

function PesquisaEngajamentoPage() {
  return (
    <PaginaPesquisa
      titulo="Pesquisa de Engajamento"
      descricao="Meça engajamento, reconhecimento e conexão com a cultura e defina o público."
      exemplo="Ex.: Engajamento e reconhecimento"
    />
  );
}
