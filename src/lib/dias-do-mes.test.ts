import { describe, expect, it } from "vitest";

import { diasAteOFim, linhasDoMes } from "@/lib/historico-pontos";

describe("diasAteOFim", () => {
  it("no mês atual, vai do dia 1 até hoje", () => {
    expect(diasAteOFim("2026-11", "2026-11-16")).toHaveLength(16);
    expect(diasAteOFim("2026-11", "2026-11-16")[0]).toBe("2026-11-01");
    expect(diasAteOFim("2026-11", "2026-11-16").at(-1)).toBe("2026-11-16");
  });

  it("em mês que já passou, vai até o último dia do mês", () => {
    expect(diasAteOFim("2026-10", "2026-11-16")).toHaveLength(31);
    expect(diasAteOFim("2026-02", "2026-11-16")).toHaveLength(28);
  });

  it("em mês futuro, não tem dia nenhum", () => {
    expect(diasAteOFim("2026-12", "2026-11-16")).toEqual([]);
  });
});

describe("linhasDoMes com hoje", () => {
  it("mostra os dias zerados desde o dia 1 até hoje", () => {
    const linhas = linhasDoMes([], [], "2026-11", [], "2026-11-16");
    expect(linhas).toHaveLength(16);
    expect(linhas[0]?.data).toBe("2026-11-01");
    expect(linhas[0]?.trabalhado).toBe(0);
  });

  it("sem hoje, mantém só os dias com registro", () => {
    expect(linhasDoMes([], [], "2026-11")).toEqual([]);
  });
});
