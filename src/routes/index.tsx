import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BoasVindasFlafy } from "@/components/onboarding/boas-vindas-flafy";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { IndicadoresPainel } from "@/components/painel/indicadores-painel";
import { CheckinSentimento } from "@/components/painel/checkin-sentimento";
import { RankingMoedas } from "@/components/painel/ranking-moedas";
import { FlowwShop } from "@/components/painel/floww-shop";

const CHAVE_BOAS_VINDAS = "floww:boas-vindas:v1";
// Desativado por enquanto: troque para true para voltar a mostrar a Flafy.
const MOSTRAR_BOAS_VINDAS = false;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel — Orcoma Orkomakers" },
      { name: "description", content: "Painel da plataforma Orcoma Orkomakers." },
      { property: "og:title", content: "Painel — Orcoma Orkomakers" },
      { property: "og:description", content: "Painel da plataforma Orcoma Orkomakers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

// Tamanho base do banner (proporção original da imagem). Largura é limitada ao espaço disponível.
const BANNER_WIDTH = 1488;
const BANNER_HEIGHT = 344;

const logos: { src: string; alt: string; altura?: string }[] = [
  { src: "/images/logo-academy.png", alt: "Academy" },
  { src: "/images/logo-solucoes-marketing.png", alt: "Soluções de Marketing" },
  { src: "/images/logo-solutions.webp", alt: "Solutions" },
  { src: "/images/logo-grupo-orcoma.png", alt: "Grupo Orcoma" },
  { src: "/images/logo-otimizza-process.png", alt: "Otimizza Process", altura: "h-20" },
  { src: "/images/logo-to-no-financeiro.png", alt: "Tô no Financeiro" },
];
// Repete os logos o suficiente para a metade do trilho cobrir a largura da tela
const logoGroup = Array.from({ length: 4 }, () => logos).flat();

function Index() {
  const [boasVindasAberto, setBoasVindasAberto] = useState(false);

  // Mostra as boas-vindas uma vez por sessão do navegador
  useEffect(() => {
    if (!MOSTRAR_BOAS_VINDAS) return;
    try {
      if (window.sessionStorage.getItem(CHAVE_BOAS_VINDAS) !== null) return;
      window.sessionStorage.setItem(CHAVE_BOAS_VINDAS, "visto");
    } catch {
      // storage bloqueado: mostramos mesmo assim
    }
    setBoasVindasAberto(true);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <img
          src="/images/aniversariantes-outubro.jpg"
          alt="Aniversariantes do mês de outubro"
          width={BANNER_WIDTH}
          height={BANNER_HEIGHT}
          className="relative -left-6 mt-8 ml-auto h-auto max-w-full rounded-md"
        />
        <div className="logo-marquee -mx-10 mt-10 overflow-hidden">
          <div className="logo-marquee-track flex w-max items-center">
            {[...logoGroup, ...logoGroup].map((logo, i) => (
              <img
                key={i}
                src={logo.src}
                alt={i < logoGroup.length ? logo.alt : ""}
                aria-hidden={i >= logoGroup.length || undefined}
                decoding="async"
                className={`logo-marquee-item mx-10 ${logo.altura ?? "h-16"} w-auto shrink-0 object-contain`}
              />
            ))}
          </div>
        </div>
        <IndicadoresPainel />
        <CheckinSentimento />
        <div className="mt-8 grid w-full gap-8 lg:grid-cols-[minmax(0,800px)_minmax(0,1fr)] lg:items-start">
          <RankingMoedas />
          <FlowwShop />
        </div>
      </main>
      <BoasVindasFlafy aberto={boasVindasAberto} onFechar={() => setBoasVindasAberto(false)} />
    </div>
  );
}
