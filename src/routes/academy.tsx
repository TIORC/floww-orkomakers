import { createFileRoute } from "@tanstack/react-router";

import { CarrosselBanner, type SlideBanner } from "@/components/academy/carrossel-banner";
import { ListaColaboradoresOnline } from "@/components/academy/lista-colaboradores-online";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [{ title: "Academy — Orcoma Orkomakers" }],
  }),
  component: AcademyDashboardPage,
});

const SLIDES: SlideBanner[] = [
  {
    src: "/images/academy-carrossel-1.webp",
    alt: "Orcoma Academy: que tal começar a potencializar o seu currículo? Acesse agora os seus ambientes de aprendizagem.",
    largura: 1721,
    altura: 914,
  },
  {
    src: "/images/academy-carrossel-2.webp",
    alt: "Academy Orcomakers: o seu ambiente de treinamentos com certificados digitais. Cursos completos, certificados digitais e seu progresso em dia.",
    largura: 1938,
    altura: 811,
  },
  {
    src: "/images/academy-carrossel-3.webp",
    alt: "Bem-vindo(a) à Orcoma Academy! Estamos felizes em ter você aqui. Este é o seu espaço para aprender, crescer e conquistar grandes resultados.",
    largura: 1932,
    altura: 814,
  },
];

function AcademyDashboardPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      {/* Banner em largura total do espaço livre; o painel fica encostado na direita e, abaixo de "lg", desce para baixo do banner. */}
      <main className="flex min-w-0 flex-1 flex-col items-start gap-6 pb-10 pl-10 pr-4 pt-24 lg:flex-row">
        <div className="min-w-0 flex-1">
          <h1 className="sr-only">Academy — Dashboard</h1>
          <CarrosselBanner slides={SLIDES} className="mx-auto w-[90%] max-w-[1620px]" />
        </div>
        <ListaColaboradoresOnline />
      </main>
      <PerfilFlutuante />
    </div>
  );
}
