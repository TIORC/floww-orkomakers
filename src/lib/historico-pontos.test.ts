import { describe, expect, it } from "vitest";

import {
  dataBrDeIso,
  diaDaSemanaDeIso,
  linhasDoMes,
  mesesDoHistorico,
  rotuloMesCurto,
  validarSolicitacao,
  type DiaRegistrado,
  type SolicitacaoPonto,
} from "@/lib/historico-pontos";

const dia = (data: string, extra: Partial<DiaRegistrado> = {}): DiaRegistrado => ({
  data,
  diaSemana: diaDaSemanaDeIso(data),
  trabalhado: 0,
  horasExtras: 0,
  horasFaltas: 0,
  observacao: "",
  ...extra,
});

const solicitacao = (data: string, extra: Partial<SolicitacaoPonto> = {}): SolicitacaoPonto => ({
  id: `s-${data}`,
  tipo: "ponto",
  data,
  entrada: "13:05",
  saida: "20:47",
  motivo: "",
  status: "pendente",
  ...extra,
});

describe("rótulos de data", () => {
  it("mostra a data no formato brasileiro e o dia da semana com inicial maiúscula", () => {
    expect(dataBrDeIso("2026-11-02")).toBe("02/11/2026");
    expect(diaDaSemanaDeIso("2026-11-02")).toBe("Segunda-feira");
  });

  it("nomeia o mês do seletor como na tela", () => {
    expect(rotuloMesCurto("2026-11")).toBe("Novembro/2026");
  });
});

describe("linhasDoMes", () => {
  it("mostra só os dias do mês, em ordem de data", () => {
    const dias = [
      dia("2026-11-03", { trabalhado: 540 }),
      dia("2026-10-31", { trabalhado: 60 }),
      dia("2026-11-01"),
    ];
    const linhas = linhasDoMes(dias, [], "2026-11");
    expect(linhas.map((l) => l.data)).toEqual(["2026-11-01", "2026-11-03"]);
  });

  it("marca feriado pelo calendário nacional e folga pela observação", () => {
    const dias = [
      dia("2026-11-02", { horasExtras: 916 }),
      dia("2026-11-08", { observacao: "Folga" }),
    ];
    const [feriado, folga] = linhasDoMes(dias, [], "2026-11");
    expect(feriado?.feriado).toBe("Finados");
    expect(feriado?.folga).toBe(false);
    expect(folga?.folga).toBe(true);
    expect(folga?.feriado).toBeNull();
  });

  it("inclui o dia que só tem solicitação, zerado, e liga a solicitação ao dia", () => {
    const linhas = linhasDoMes([], [solicitacao("2026-11-13")], "2026-11");
    expect(linhas).toHaveLength(1);
    expect(linhas[0]?.trabalhado).toBe(0);
    expect(linhas[0]?.solicitacoes.map((s) => s.id)).toEqual(["s-2026-11-13"]);
  });

  it("soma duas linhas do mesmo dia", () => {
    const linhas = linhasDoMes(
      [dia("2026-11-05", { trabalhado: 300 }), dia("2026-11-05", { trabalhado: 240 })],
      [],
      "2026-11",
    );
    expect(linhas[0]?.trabalhado).toBe(540);
  });
});

describe("mesesDoHistorico", () => {
  it("lista os meses do mais recente para o mais antigo e sempre inclui o mês de hoje", () => {
    const meses = mesesDoHistorico([dia("2026-10-21")], [solicitacao("2026-09-30")], "2026-11-16");
    expect(meses).toEqual(["2026-11", "2026-10", "2026-09"]);
  });

  it("mostra o mês de hoje mesmo sem registros", () => {
    expect(mesesDoHistorico([], [], "2026-11-16")).toEqual(["2026-11"]);
  });
});

describe("validarSolicitacao", () => {
  const hoje = "2026-11-16";
  const base = {
    tipo: "ponto" as const,
    data: "2026-11-13",
    entrada: "13:05",
    saida: "20:47",
    motivo: "",
  };

  it("aceita um ponto com entrada e saída", () => {
    expect(validarSolicitacao(base, hoje)).toBeNull();
  });

  it("aceita entrada depois da saída, para turno que cruza a meia-noite", () => {
    expect(validarSolicitacao({ ...base, entrada: "13:05", saida: "00:06" }, hoje)).toBeNull();
  });

  it("pede a data", () => {
    expect(validarSolicitacao({ ...base, data: "" }, hoje)).toBe("Escolha a data.");
  });

  it("não aceita data futura", () => {
    expect(validarSolicitacao({ ...base, data: "2026-11-17" }, hoje)).toMatch(/ainda não chegou/);
  });

  it("pede entrada e saída para o ponto", () => {
    expect(validarSolicitacao({ ...base, saida: "" }, hoje)).toBe("Informe a entrada e a saída.");
  });

  it("recusa entrada igual à saída", () => {
    expect(validarSolicitacao({ ...base, saida: "13:05" }, hoje)).toMatch(/não podem ser iguais/);
  });

  it("exige o motivo na falta justificada e ignora os horários", () => {
    const falta = {
      tipo: "falta_justificada" as const,
      data: "2026-11-13",
      entrada: "",
      saida: "",
      motivo: "  ",
    };
    expect(validarSolicitacao(falta, hoje)).toBe("Explique o motivo da falta.");
    expect(validarSolicitacao({ ...falta, motivo: "Consulta médica" }, hoje)).toBeNull();
  });
});
