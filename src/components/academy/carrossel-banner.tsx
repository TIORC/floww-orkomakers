import { useCallback, useEffect, useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export type SlideBanner = { src: string; alt: string; largura: number; altura: number };

type Props = {
  slides: SlideBanner[];
  // Tempo entre os slides, em milissegundos.
  intervalo?: number;
  className?: string;
};

// Carrossel de banners: passa sozinho, para quando o mouse está em cima, e tem setas e bolinhas.
// Os slides têm proporções diferentes, então a caixa segue a do primeiro e os outros ficam inteiros, centralizados.
export function CarrosselBanner({ slides, intervalo = 6000, className }: Props) {
  const [api, setApi] = useState<CarouselApi>();
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (!api) return;
    const atualizar = () => setAtual(api.selectedScrollSnap());
    atualizar();
    api.on("select", atualizar);
    return () => {
      api.off("select", atualizar);
    };
  }, [api]);

  // Avança sozinho, a menos que esteja pausado ou a pessoa prefira menos movimento.
  useEffect(() => {
    if (!api || pausado || slides.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => api.scrollNext(), intervalo);
    return () => window.clearInterval(timer);
  }, [api, pausado, intervalo, slides.length]);

  const irPara = useCallback((indice: number) => api?.scrollTo(indice), [api]);
  if (slides.length === 0) return null;
  // Todos os slides ficam na mesma caixa, com a proporção do mais largo; os outros aparecem inteiros dentro dela.
  const proporcao = Math.max(...slides.map((slide) => slide.largura / slide.altura));

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques da Academy"
      className={cn("relative", className)}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      {/* O recorte arredondado fica na moldura fixa. Se ficasse na faixa que desliza (CarouselContent), ela cortaria
          os slides que chegam, porque tem a largura de um slide só: o segundo nunca apareceria. */}
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        className="overflow-hidden rounded-3xl border border-panel-active shadow-lg"
      >
        <CarouselContent className="ml-0">
          {slides.map((slide, indice) => (
            <CarouselItem
              key={slide.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${indice + 1} de ${slides.length}`}
              className="pl-0"
            >
              <div
                className="relative w-full overflow-hidden bg-[#0a1a3f]"
                style={{ aspectRatio: String(proporcao) }}
              >
                {/* Fundo: a própria imagem desfocada, para as laterais de um slide mais estreito não ficarem vazias. */}
                <img
                  src={slide.src}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="absolute inset-0 size-full scale-110 object-cover opacity-70 blur-2xl"
                />
                <img
                  src={slide.src}
                  alt={slide.alt}
                  width={slide.largura}
                  height={slide.altura}
                  // Sem carregamento preguiçoso: os slides ficam fora da tela, e o navegador nunca baixaria os de fora.
                  loading="eager"
                  draggable={false}
                  className="relative size-full object-contain"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {slides.length > 1 && (
          <>
            <CarouselPrevious className="left-3 border-white/20 bg-black/40 text-white hover:bg-black/60" />
            <CarouselNext className="right-3 border-white/20 bg-black/40 text-white hover:bg-black/60" />
          </>
        )}
      </Carousel>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
          {slides.map((slide, indice) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => irPara(indice)}
              aria-label={`Ir para o slide ${indice + 1}`}
              aria-current={indice === atual}
              className={cn(
                "h-2 rounded-full transition-all",
                indice === atual ? "w-6 bg-brand" : "w-2 bg-white/50 hover:bg-white/80",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
