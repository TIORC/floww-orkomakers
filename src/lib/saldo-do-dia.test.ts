import { describe, expect, it } from "vitest";

import type { EspelhoSalvo } from "@/lib/banco-horas";
import type { DiaRegistrado } from "@/lib/historico-pontos";
import type { Batida } from "@/lib/ponto-batidas";
import {
  aplicarBatidasNoBanco,
  diasDeBatidasCompletas,
  jornadaPrevista,
  saldoDoDia,
} from "@/lib/saldo-do-dia";

const batida = (
  id: string,
  ano: number,
  mes: number,
  dia: number,
  hora: number,
  minuto: number,
): Batida => ({
  id,
  registradoEm: new Date(ano, mes - 1, dia, hora, minuto).toISOString(),
});

describe("jornadaPrevista", () => {
  it("dá 9h em dia útil, e zero no sábado, no domingo e no feriado", () => {
    expect(jornadaPrevista("2026-11-16")).toBe(540);
    expect(jornadaPrevista("2026-11-14")).toBe(0);
    expect(jornadaPrevista("2026-11-15")).toBe(0);
    expect(jornadaPrevista("2026-11-02")).toBe(0);
  });
});

describe("saldoDoDia", () => {
  it("quem faz a jornada inteira não tem saldo", () => {
    expect(saldoDoDia("2026-11-16", 540)).toEqual({ horasExtras: 0, horasFaltas: 0 });
  });

  it("passou da jornada vira hora extra", () => {
    expect(saldoDoDia("2026-11-16", 600)).toEqual({ horasExtras: 60, horasFaltas: 0 });
  });

  it("ficou abaixo da jornada vira hora falta", () => {
    expect(saldoDoDia("2026-11-16", 488)).toEqual({ horasExtras: 0, horasFaltas: 52 });
  });

  it("no domingo, tudo trabalhado é hora extra", () => {
    expect(saldoDoDia("2026-11-15", 970)).toEqual({ horasExtras: 970, horasFaltas: 0 });
  });
});

describe("diasDeBatidasCompletas", () => {
  it("calcula o saldo de um dia com as 4 batidas", () => {
    // 08:00 às 12:00 (240) + 13:00 às 19:00 (360) = 600 minutos
    const dias = diasDeBatidasCompletas([
      batida("a", 2026, 11, 16, 8, 0),
      batida("b", 2026, 11, 16, 12, 0),
      batida("c", 2026, 11, 16, 13, 0),
      batida("d", 2026, 11, 16, 19, 0),
    ]);
    expect(dias).toEqual([
      {
        data: "2026-11-16",
        diaSemana: expect.any(String),
        trabalhado: 600,
        horasExtras: 60,
        horasFaltas: 0,
        observacao: "Bater ponto",
      },
    ]);
  });

  it("deixa de fora o dia com menos de 4 batidas", () => {
    expect(diasDeBatidasCompletas([batida("a", 2026, 11, 16, 8, 0)])).toEqual([]);
    expect(
      diasDeBatidasCompletas([batida("a", 2026, 11, 16, 8, 0), batida("b", 2026, 11, 16, 18, 0)]),
    ).toEqual([]);
  });
});

describe("aplicarBatidasNoBanco", () => {
  const espelho = (funcionario: string): EspelhoSalvo => ({
    id: funcionario,
    funcionario,
    cargo: "",
    departamento: "",
    periodoInicio: "2026-10-21",
    periodoFim: "2026-11-20",
    mes: "2026-11",
    horasExtras: 100,
    horasFaltas: 10,
    trabalhado: 2000,
    saldoAnterior: 0,
    saldoManual: null,
    pagarDescontar: 0,
    compensar: 0,
    observacao: "",
  });
  const dia = (
    data: string,
    trabalhado: number,
    horasExtras: number,
    horasFaltas: number,
  ): DiaRegistrado => ({
    data,
    diaSemana: "",
    trabalhado,
    horasExtras,
    horasFaltas,
    observacao: "Bater ponto",
  });

  it("soma os dias do bater ponto ao espelho da própria pessoa, dentro do período", () => {
    const [resultado] = aplicarBatidasNoBanco(
      [espelho("GABRIEL")],
      ["Gabriel"],
      [dia("2026-11-16", 600, 60, 0), dia("2026-12-01", 540, 0, 0)],
    );
    expect(resultado?.trabalhado).toBe(2600);
    expect(resultado?.horasExtras).toBe(160);
    expect(resultado?.horasFaltas).toBe(10);
  });

  it("não mexe no espelho de outra pessoa", () => {
    const original = espelho("ANA");
    const [resultado] = aplicarBatidasNoBanco(
      [original],
      ["Gabriel"],
      [dia("2026-11-16", 600, 60, 0)],
    );
    expect(resultado).toEqual(original);
  });
});
