import { describe, expect, it } from "vitest";

import { agruparSetores, chaveDoSetor } from "./setores-agrupados";

describe("agruparSetores", () => {
  it("junta todas as grafias de TI num setor só, com o nome completo", () => {
    const grupos = agruparSetores([
      "TI",
      "Departamento TI",
      "TI / Desenvolvimento",
      "Departamento TI/Desenvolvimento",
      "Fiscal",
    ]);
    expect(grupos.map((g) => g.rotulo)).toEqual(["Departamento TI/Desenvolvimento", "Fiscal"]);
    expect(grupos[0]?.variantes).toHaveLength(4);
  });

  it("ignora acento, maiúsculas e o prefixo Departamento nos outros setores", () => {
    expect(chaveDoSetor("Departamento Contábil")).toBe(chaveDoSetor("CONTABIL"));
    expect(agruparSetores(["Contábil", "Departamento Contábil"])).toHaveLength(1);
  });

  it("não mistura setores diferentes nem repete variantes", () => {
    const grupos = agruparSetores(["Fiscal", "Fiscal", "Financeiro", " "]);
    expect(grupos.map((g) => g.rotulo)).toEqual(["Financeiro", "Fiscal"]);
    expect(grupos[1]?.variantes).toEqual(["Fiscal"]);
  });
});
