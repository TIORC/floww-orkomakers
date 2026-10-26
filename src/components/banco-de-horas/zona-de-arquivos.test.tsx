import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ZonaDeArquivos } from "./zona-de-arquivos";

const pdf = (nome: string) => new File(["x"], nome, { type: "application/pdf" });

function soltar(zona: HTMLElement, files: File[]) {
  fireEvent.drop(zona, { dataTransfer: { files } });
}

describe("ZonaDeArquivos", () => {
  it("aceita PDFs arrastados para dentro da área", () => {
    const aoEscolher = vi.fn();
    render(<ZonaDeArquivos arquivos={[]} aoEscolher={aoEscolher} />);
    const zona = screen.getByText(/Arraste os PDFs/).closest("label")!;

    fireEvent.dragEnter(zona, { dataTransfer: { files: [] } });
    expect(screen.getByText("Solte os arquivos aqui")).toBeInTheDocument();

    const a = pdf("Espelho - ANA - Dpto. TI.pdf");
    const b = pdf("Espelho - BIA - Dpto. RH.pdf");
    soltar(zona, [a, b]);
    expect(aoEscolher).toHaveBeenCalledWith([a, b]);
    expect(screen.queryByText("Solte os arquivos aqui")).not.toBeInTheDocument();
  });

  it("ignora o que não é PDF", () => {
    const aoEscolher = vi.fn();
    render(<ZonaDeArquivos arquivos={[]} aoEscolher={aoEscolher} />);
    const zona = screen.getByText(/Arraste os PDFs/).closest("label")!;

    const valido = pdf("espelho.PDF");
    soltar(zona, [valido, new File(["x"], "foto.png", { type: "image/png" })]);
    expect(aoEscolher).toHaveBeenCalledWith([valido]);

    aoEscolher.mockClear();
    soltar(zona, [new File(["x"], "planilha.xlsx")]);
    expect(aoEscolher).not.toHaveBeenCalled();
  });

  it("não recebe arquivos enquanto está desabilitada", () => {
    const aoEscolher = vi.fn();
    render(<ZonaDeArquivos arquivos={[]} aoEscolher={aoEscolher} desabilitado />);
    soltar(screen.getByText(/Arraste os PDFs/).closest("label")!, [pdf("a.pdf")]);
    expect(aoEscolher).not.toHaveBeenCalled();
  });

  it("mostra o nome do arquivo escolhido", () => {
    render(<ZonaDeArquivos arquivos={[pdf("espelho.pdf")]} aoEscolher={() => {}} />);
    expect(screen.getByText("espelho.pdf")).toBeInTheDocument();
  });
});
