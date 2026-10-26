import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { CarrosselBanner, type SlideBanner } from "./carrossel-banner";

const slides: SlideBanner[] = [
  { src: "/a.webp", alt: "Primeiro", largura: 1721, altura: 914 },
  { src: "/b.webp", alt: "Segundo", largura: 1938, altura: 811 },
];

describe("CarrosselBanner", () => {
  beforeAll(() => {
    // O Embla mede o layout e observa redimensionamento; o jsdom não tem nada disso.
    class ResizeObserverFalso {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverFalso);
    vi.stubGlobal("IntersectionObserver", ResizeObserverFalso);
  });
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("mostra os slides, as bolinhas e as setas", () => {
    render(<CarrosselBanner slides={slides} />);
    expect(screen.getByAltText("Primeiro")).toBeInTheDocument();
    // Todos os slides usam a proporção do mais largo (1938 / 811), para ficarem do mesmo tamanho.
    const caixa = screen.getByAltText("Primeiro").parentElement!;
    expect(caixa.style.aspectRatio).toBe(String(1938 / 811));
    expect(screen.getByAltText("Segundo").parentElement!.style.aspectRatio).toBe(
      String(1938 / 811),
    );
    expect(screen.getByAltText("Segundo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir para o slide 1" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "Ir para o slide 2" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "1 de 2" })).toBeInTheDocument();
  });

  it("com um slide só, não mostra setas nem bolinhas", () => {
    render(<CarrosselBanner slides={slides.slice(0, 1)} />);
    expect(screen.queryByRole("button", { name: /Ir para o slide/ })).not.toBeInTheDocument();
  });

  it("pausa o avanço automático quando o mouse está em cima", () => {
    const { container } = render(<CarrosselBanner slides={slides} intervalo={1000} />);
    const secao = container.querySelector("section")!;
    fireEvent.mouseEnter(secao);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("button", { name: "Ir para o slide 1" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("o recorte fica na moldura, não na faixa que desliza (senão o segundo slide some)", () => {
    const { container } = render(<CarrosselBanner slides={slides} />);
    const slide = screen.getByRole("group", { name: "2 de 2" });
    const faixa = slide.parentElement!;
    expect(faixa.className).not.toMatch(/overflow-hidden/);
    // O único elemento com recorte entre a faixa e a seção é o que envolve tudo.
    expect(container.querySelector("section > div")?.className).toMatch(/overflow-hidden/);
  });
});
