import { describe, expect, it } from "vitest";

import { criarSolicitacao, mensagemDaSolicitacao } from "./ferias-solicitacao";

describe("criarSolicitacao", () => {
  it("calcula os dias, o retorno e entra como pendente do líder", () => {
    const s = criarSolicitacao(
      "2026-11-09",
      "2026-11-13",
      "Geane Lopes",
      new Date("2026-10-26T12:00:00Z"),
    );
    expect(s).toMatchObject({
      inicio: "2026-11-09",
      fim: "2026-11-13",
      dias: 5,
      retorno: "2026-11-16", // sexta -> segunda
      status: "pendente_lider",
      liderNome: "Geane Lopes",
    });
  });

  it("aceita os cliques em ordem invertida", () => {
    const s = criarSolicitacao("2026-11-20", "2026-11-10", "Geane Lopes");
    expect([s.inicio, s.fim, s.dias]).toEqual(["2026-11-10", "2026-11-20", 11]);
  });

  it("monta a mensagem para o colaborador", () => {
    const s = criarSolicitacao("2026-11-10", "2026-11-30", "Geane Lopes");
    expect(mensagemDaSolicitacao(s)).toBe(
      "Você solicitou as suas férias para o dia 10/11/2026 com retorno para o dia 01/12/2026. Você será informado quando houver aprovação de Geane Lopes.",
    );
  });
});
