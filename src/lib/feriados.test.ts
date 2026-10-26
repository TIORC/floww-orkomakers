import { describe, expect, it } from "vitest";

import { feriadosDoAno, nomeDoFeriado } from "./feriados";

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
