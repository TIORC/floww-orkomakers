import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { BoasVindasFlafy } from "@/components/onboarding/boas-vindas-flafy";
import { CarrosselBanner, type SlideBanner } from "@/components/academy/carrossel-banner";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { IndicadoresPainel } from "@/components/painel/indicadores-painel";
import { CheckinSentimento } from "@/components/painel/checkin-sentimento";
import { RankingMoedas } from "@/components/painel/ranking-moedas";
import { FlowwShop } from "@/components/painel/floww-shop";
import { CarregarMidiaDialog } from "@/components/painel/carregar-midia-dialog";
import { supabase } from "@/integrations/supabase/client";
import { podeGerenciarBanners, useUsuarioLogado } from "@/hooks/use-usuario-logado";

// A tipagem gerada do banco ainda não inclui home_banners.
const db = supabase as unknown as SupabaseClient;

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
  { src: "/images/logo-solucoes-marketing-branca.png", alt: "Soluções de Marketing" },
  { src: "/images/logo-solutions.webp", alt: "Solutions" },
  { src: "/images/logo-grupo-orcoma.png", alt: "Grupo Orcoma" },
  { src: "/images/logo-otimizza-process.png", alt: "Otimizza Process", altura: "h-20" },
  { src: "/images/logo-to-no-financeiro.png", alt: "Tô no Financeiro" },
];
// Repete os logos o suficiente para a metade do trilho cobrir a largura da tela
const logoGroup = Array.from({ length: 4 }, () => logos).flat();

// Banner de aniversariantes: primeiro slide, sempre presente.
const BANNER_ANIVERSARIANTES: SlideBanner = {
  src: "/images/aniversariantes-novembro.png",
  alt: "Aniversariantes do mês de novembro",
  largura: BANNER_WIDTH,
  altura: BANNER_HEIGHT,
};

// Banners enviados pelo botão "Carregar Mídia", na ordem em que foram criados.
async function listarBannersHome(): Promise<SlideBanner[]> {
  const { data, error } = await db
    .from("home_banners")
    .select("src, alt, largura, altura")
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SlideBanner[];
}

function Index() {
  const [boasVindasAberto, setBoasVindasAberto] = useState(false);
  const [carregarAberto, setCarregarAberto] = useState(false);
  // O botão "Carregar Mídia" só aparece depois de clicar na foto.
  const [botaoVisivel, setBotaoVisivel] = useState(false);
  const { data: usuario } = useUsuarioLogado();
  const { data: bannersEnviados = [] } = useQuery({
    queryKey: ["home-banners"],
    queryFn: listarBannersHome,
  });
  const slides = [BANNER_ANIVERSARIANTES, ...bannersEnviados];

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
      <main className="min-w-0 flex-1 px-4 pb-10 pt-24 sm:px-6 lg:px-10">
        <div
          className="relative -left-6 mt-8 ml-auto w-full"
          onClick={(evento) => {
            // Clicar na foto mostra o botão de carregar mídia; cliques nas setas e bolinhas do carrossel não contam.
            if (!podeGerenciarBanners(usuario)) return;
            if ((evento.target as HTMLElement).closest("button")) return;
            setBotaoVisivel((visivel) => !visivel);
          }}
        >
          <CarrosselBanner slides={slides} rotulo="Banners da tela inicial" className="w-full" />
          {podeGerenciarBanners(usuario) && botaoVisivel ? (
            // Centralizado sobre o banner; fica fora do carrossel para não passar o mouse nem trocar de slide.
            <button
              type="button"
              onClick={() => {
                setBotaoVisivel(false);
                setCarregarAberto(true);
              }}
              className="absolute left-1/2 top-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-brand bg-black/60 px-5 py-2.5 text-sm font-semibold text-brand shadow-lg backdrop-blur-sm transition hover:bg-brand hover:text-slate-900"
            >
              <Upload className="size-4" aria-hidden />
              Carregar Mídia
            </button>
          ) : null}
        </div>
        <div className="logo-marquee -mx-10 mt-10 overflow-hidden">
          <div className="logo-marquee-track flex w-max items-center">
            {[...logoGroup, ...logoGroup].map((logo, i) => (
              // Caixa de tamanho fixo: a largura não muda quando a imagem carrega, então o trilho não pula.
              <div key={i} className="mx-10 flex h-20 w-48 shrink-0 items-center justify-center">
                <img
                  src={logo.src}
                  alt={i < logoGroup.length ? logo.alt : ""}
                  aria-hidden={i >= logoGroup.length || undefined}
                  width={192}
                  height={80}
                  decoding="async"
                  className="logo-marquee-item max-h-full max-w-full object-contain"
                />
              </div>
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
      <CarregarMidiaDialog aberto={carregarAberto} onFechar={() => setCarregarAberto(false)} />
    </div>
  );
}
