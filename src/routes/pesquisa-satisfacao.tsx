import { createFileRoute } from "@tanstack/react-router";

import { PaginaPesquisa } from "@/components/painel/pesquisa-pagina";

export const Route = createFileRoute("/pesquisa-satisfacao")({
  head: () => ({
    meta: [{ title: "Pesquisa de Satisfação — Orcoma Orkomakers" }],
  }),
  component: PesquisaSatisfacaoPage,
});

function PesquisaSatisfacaoPage() {
  return (
    <PaginaPesquisa
      titulo="Pesquisa de Satisfação"
      descricao="Avalie clima, benefícios e experiência do colaborador e defina quem vai participar."
      exemplo="Ex.: Satisfação com clima e benefícios"
    />
  );
}
