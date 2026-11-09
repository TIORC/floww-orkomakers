import { describe, expect, it } from "vitest";

import { diasAte, feriadosDoAno, nomeDoFeriado, proximaOcorrencia, proximosFeriados } from "./feriados";

describe("feriadosDoAno", () => {
  it("calcula os feriados que dependem da Páscoa (Páscoa de 2026 é 5 de abril)", () => {
    expect(nomeDoFeriado("2026-02-16")).toMatch(/Carnaval/);
    expect(nomeDoFeriado("2026-02-17")).toMatch(/Carnaval/);
    expect(nomeDoFeriado("2026-04-03")).toBe("Sexta-feira Santa");
    expect(nomeDoFeriado("2026-06-04")).toMatch(/Corpus Christi/);
  });

  it("confere outro ano (Páscoa de 2027 é 28 de março)", () => {
    expect(nomeDoFeriado("2027-03-26")).toBe("Sexta-feira Santa");
  });

  it("inclui os feriados fixos, o 2 de Julho e a Consciência Negra", () => {
    expect(nomeDoFeriado("2026-12-25")).toBe("Natal");
    expect(nomeDoFeriado("2026-09-07")).toBe("Independência do Brasil");
    expect(nomeDoFeriado("2026-07-02")).toBe("Independência da Bahia");
    expect(nomeDoFeriado("2026-11-20")).toBe("Dia da Consciência Negra");
    expect(nomeDoFeriado("2023-11-20")).toBeUndefined();
  });

  it("dia comum não é feriado", () => {
    expect(nomeDoFeriado("2026-10-26")).toBeUndefined();
    expect(feriadosDoAno(2026).size).toBe(14);
  });
});

describe("feriados cadastrados pelo RH", () => {
  const municipal = { nome: "Aniversário da cidade", data: "2020-03-10", recorrente: true, tipo: "municipal" as const, abrangencia: "Salvador" };
  const avulso = { nome: "Ponte da empresa", data: "2026-10-15", recorrente: false, tipo: "interno" as const, abrangencia: "Empresa" };

  it("recorrente vale todo ano no mesmo dia e mês", () => {
    expect(nomeDoFeriado("2026-03-10", [municipal])).toBe("Aniversário da cidade");
    expect(nomeDoFeriado("2030-03-10", [municipal])).toBe("Aniversário da cidade");
    expect(nomeDoFeriado("2026-03-11", [municipal])).toBeUndefined();
  });

  it("avulso vale só na data cadastrada", () => {
    expect(nomeDoFeriado("2026-10-15", [avulso])).toBe("Ponte da empresa");
    expect(nomeDoFeriado("2027-10-15", [avulso])).toBeUndefined();
  });

  it("29/02 recorrente não existe em ano que não é bissexto", () => {
    const bissexto = { ...municipal, data: "2024-02-29" };
    expect(nomeDoFeriado("2028-02-29", [bissexto])).toBe("Aniversário da cidade");
    expect(nomeDoFeriado("2027-02-28", [bissexto])).toBeUndefined();
  });

  it("o cadastrado com a mesma data de um nacional passa a usar o nome cadastrado", () => {
    const reforco = { ...municipal, nome: "Natal (reforço)", data: "2020-12-25" };
    expect(nomeDoFeriado("2026-12-25", [reforco])).toBe("Natal (reforço)");
  });

  it("proximaOcorrencia pula o que já passou", () => {
    expect(proximaOcorrencia(municipal, "2026-11-09")).toBe("2027-03-10");
    expect(proximaOcorrencia(avulso, "2026-11-09")).toBeUndefined();
  });
});

describe("próximo feriado", () => {
  it("lista o próximo feriado a partir de hoje, e filtra por tipo", () => {
    const [primeiro] = proximosFeriados("2026-11-09", [], 1);
    expect(primeiro).toMatchObject({ iso: "2026-11-15", nome: "Proclamação da República" });
    const [estadual] = proximosFeriados("2026-11-09", [], 1, "estadual");
    expect(estadual?.iso).toBe("2027-07-02");
  });

  it("um feriado cadastrado entra na ordem e leva o tipo cadastrado", () => {
    const ponte = { nome: "Ponte da empresa", data: "2026-11-10", recorrente: false, tipo: "interno" as const, abrangencia: "" };
    const [primeiro] = proximosFeriados("2026-11-09", [ponte], 1);
    expect(primeiro).toMatchObject({ iso: "2026-11-10", tipo: "interno", cadastrado: true });
  });

  it("diasAte conta dias corridos", () => {
    expect(diasAte("2026-11-09", "2026-11-09")).toBe(0);
    expect(diasAte("2026-11-09", "2026-11-15")).toBe(6);
  });
});
