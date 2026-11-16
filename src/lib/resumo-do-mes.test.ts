import { describe, expect, it } from "vitest";

import type { EspelhoSalvo } from "@/lib/banco-horas";
import type { LinhaDoMes } from "@/lib/historico-pontos";
import { formatarDuracao, resumoDoMes } from "@/lib/resumo-do-mes";

const linha = (data: string, trabalhado: number): LinhaDoMes => ({
  data,
  diaSemana: "",
  trabalhado,
  horasExtras: 0,
  horasFaltas: 0,
  observacao: "",
  feriado: null,
  folga: false,
  solicitacoes: [],
  marcacoes: [],
});

const espelho = (
  mes: string,
  saldoAnterior: number,
  horasExtras: number,
  horasFaltas: number,
): EspelhoSalvo => ({
  id: mes,
  funcionario: "GABRIEL",
  cargo: "",
  departamento: "",
  periodoInicio: "",
  periodoFim: "",
  mes,
  horasExtras,
  horasFaltas,
  trabalhado: 0,
  saldoAnterior,
  saldoManual: null,
  pagarDescontar: 0,
  compensar: 0,
  observacao: "",
});

describe("formatarDuracao", () => {
  it("segue o formato da tela: 9h, 8h48min e 0h", () => {
    expect(formatarDuracao(540)).toBe("9h");
    expect(formatarDuracao(528)).toBe("8h48min");
    expect(formatarDuracao(0)).toBe("0h");
  });

  it("mostra o sinal de negativo", () => {
    expect(formatarDuracao(-90)).toBe("-1h30min");
  });
});

describe("resumoDoMes", () => {
  it("conta os dias com trabalho e soma as horas do mês", () => {
    const linhas = [
      linha("2026-11-02", 0),
      linha("2026-11-03", 540),
      linha("2026-11-04", 528),
      linha("2026-11-08", 0),
      linha("2026-10-31", 600),
    ];
    const resumo = resumoDoMes(linhas, [], "2026-11");
    expect(resumo.diasTrabalhados).toBe(2);
    expect(resumo.horasNoMes).toBe(1068);
  });

  it("usa o saldo do espelho do mês como banco de horas", () => {
    const espelhos = [espelho("2026-10", 0, 100, 0), espelho("2026-11", 100, 300, 60)];
    expect(resumoDoMes([], espelhos, "2026-11").bancoDeHoras).toBe(340);
  });

  it("deixa o banco de horas vazio quando não há espelho do mês", () => {
    expect(resumoDoMes([], [espelho("2026-10", 0, 100, 0)], "2026-11").bancoDeHoras).toBeNull();
  });

  it("zera tudo quando o mês não tem nada", () => {
    expect(resumoDoMes([], [], "2026-11")).toEqual({
      diasTrabalhados: 0,
      horasNoMes: 0,
      bancoDeHoras: null,
    });
  });
});
