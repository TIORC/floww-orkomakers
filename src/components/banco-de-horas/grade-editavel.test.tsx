import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { GradeEditavel, type ColunaGrade } from "./grade-editavel";

type Linha = { id: string; nome: string; horas: string };

const COLUNAS: ColunaGrade<Linha>[] = [
  { chave: "nome", titulo: "Nome", editavel: false, texto: (l) => l.nome },
  { chave: "horas", titulo: "Horas", editavel: true, texto: (l) => l.horas },
];

function Exemplo({ aoClicarNome }: { aoClicarNome?: (linha: Linha) => void } = {}) {
  const [linhas, setLinhas] = useState<Linha[]>([
    { id: "1", nome: "Ana", horas: "01:00" },
    { id: "2", nome: "Bia", horas: "02:00" },
    { id: "3", nome: "Caio", horas: "03:00" },
  ]);
  return (
    <GradeEditavel
      linhas={linhas}
      colunas={
        aoClicarNome ? [{ ...COLUNAS[0]!, aoClicar: aoClicarNome }, ...COLUNAS.slice(1)] : COLUNAS
      }
      chaveLinha={(l) => l.id}
      vazio="vazio"
      aoEditar={(linha, _chave, valor) => {
        if (valor === "ruim") return "valor inválido";
        setLinhas((atuais) => atuais.map((l) => (l.id === linha.id ? { ...l, horas: valor } : l)));
        return null;
      }}
    />
  );
}

const celula = (texto: string) => screen.getByText(texto).closest("td")!;

describe("GradeEditavel", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = () => {};
  });

  it("edita digitando, confirma com Enter e desce para a célula de baixo", () => {
    render(<Exemplo />);
    const grade = screen.getByRole("grid");
    fireEvent.mouseDown(celula("01:00"));
    fireEvent.keyDown(grade, { key: "9" });
    const campo = screen.getByLabelText("Horas");
    expect(campo).toHaveValue("9");
    fireEvent.change(campo, { target: { value: "09:30" } });
    fireEvent.keyDown(campo, { key: "Enter" });

    expect(screen.getByText("09:30")).toBeInTheDocument();
    expect(celula("02:00")).toHaveAttribute("data-selecionada", "true");
  });

  it("Esc cancela a edição e Delete limpa a célula", () => {
    render(<Exemplo />);
    const grade = screen.getByRole("grid");
    fireEvent.mouseDown(celula("02:00"));
    fireEvent.keyDown(grade, { key: "Enter" });
    fireEvent.change(screen.getByLabelText("Horas"), { target: { value: "99:99" } });
    fireEvent.keyDown(screen.getByLabelText("Horas"), { key: "Escape" });
    expect(screen.getByText("02:00")).toBeInTheDocument();

    fireEvent.keyDown(grade, { key: "Delete" });
    expect(screen.queryByText("02:00")).not.toBeInTheDocument();
  });

  it("não edita colunas somente leitura", () => {
    render(<Exemplo />);
    fireEvent.mouseDown(celula("Ana"));
    fireEvent.keyDown(screen.getByRole("grid"), { key: "Enter" });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("cola vários valores de uma vez a partir da célula selecionada", () => {
    render(<Exemplo />);
    fireEvent.mouseDown(celula("01:00"));
    fireEvent.paste(screen.getByRole("grid"), {
      clipboardData: { getData: () => "10:00\n11:00\n" },
    });
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("11:00")).toBeInTheDocument();
    expect(screen.getByText("03:00")).toBeInTheDocument();
  });

  it("mantém o valor anterior quando a edição é recusada", () => {
    render(<Exemplo />);
    fireEvent.mouseDown(celula("01:00"));
    fireEvent.keyDown(screen.getByRole("grid"), { key: "Enter" });
    const campo = screen.getByLabelText("Horas");
    fireEvent.change(campo, { target: { value: "ruim" } });
    fireEvent.keyDown(campo, { key: "Enter" });
    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("clicar numa célula com ação chama a ação, e Enter nela também", () => {
    const aoClicarNome = vi.fn();
    render(<Exemplo aoClicarNome={aoClicarNome} />);
    fireEvent.click(celula("Bia"));
    expect(aoClicarNome).toHaveBeenCalledWith(expect.objectContaining({ nome: "Bia" }));

    fireEvent.mouseDown(celula("Caio"));
    fireEvent.keyDown(screen.getByRole("grid"), { key: "Enter" });
    expect(aoClicarNome).toHaveBeenLastCalledWith(expect.objectContaining({ nome: "Caio" }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
