import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import {
  completarDepartamentos,
  encadearSaldos,
  normalizarNome,
  novosPeriodos,
  type EspelhoSalvo,
} from "./banco-horas";

const espelho = (funcionario: string, departamento = ""): EspelhoSalvo => ({
  id: funcionario,
  funcionario,
  cargo: "",
  departamento,
  periodoInicio: "2026-09-21",
  periodoFim: "2026-10-20",
  mes: "2026-10",
  horasExtras: 0,
  horasFaltas: 0,
  trabalhado: 0,
  saldoAnterior: 0,
  saldoManual: null,
  pagarDescontar: 0,
  compensar: 0,
  observacao: "",
});

describe("completarDepartamentos", () => {
  const cadastro = new Map([[normalizarNome("Eduarda Vitória dos Santos de Jesus"), "Fiscal"]]);

  it("preenche pelo cadastro ignorando acento, maiúsculas e espaços", () => {
    const [e] = completarDepartamentos([espelho("EDUARDA VITORIA  DOS SANTOS DE JESUS")], cadastro);
    expect(e?.departamento).toBe("Fiscal");
  });

  it("mantém o departamento que já veio do arquivo", () => {
    const [e] = completarDepartamentos(
      [espelho("EDUARDA VITORIA DOS SANTOS DE JESUS", "TI")],
      cadastro,
    );
    expect(e?.departamento).toBe("TI");
  });

  it("deixa vazio quando ninguém no cadastro tem esse nome", () => {
    const [e] = completarDepartamentos([espelho("FULANO DE TAL")], cadastro);
    expect(e?.departamento).toBe("");
  });
});

const periodo = (
  id: string,
  inicio: string,
  fim: string,
  extras: number,
  faltas: number,
  manual: number | null = null,
  nome = "ANA SOUZA",
): EspelhoSalvo => ({
  ...espelho(nome),
  id,
  periodoInicio: inicio,
  periodoFim: fim,
  horasExtras: extras,
  horasFaltas: faltas,
  saldoManual: manual,
});

describe("encadearSaldos", () => {
  it("o saldo anterior do mês é o banco de horas do mês anterior", () => {
    const set = periodo("set", "2026-08-21", "2026-09-20", 600, 120); // banco = 480
    const out = periodo("out", "2026-09-21", "2026-10-20", 60, 0); // saldo 480, banco = 540
    const nov = periodo("nov", "2026-10-21", "2026-11-20", 0, 0); // saldo 540
    // Fora de ordem de propósito: o encadeamento ordena por período.
    const [a, b, c] = encadearSaldos([nov, set, out]);
    expect(a?.saldoAnterior).toBe(540);
    expect(b?.saldoAnterior).toBe(0);
    expect(c?.saldoAnterior).toBe(480);
  });

  it("o valor digitado pelo RH vale no lugar do cálculo e segue para os meses seguintes", () => {
    const set = periodo("set", "2026-08-21", "2026-09-20", 600, 0);
    const out = periodo("out", "2026-09-21", "2026-10-20", 0, 0, 100);
    const nov = periodo("nov", "2026-10-21", "2026-11-20", 0, 0);
    const resultado = encadearSaldos([set, out, nov]);
    expect(resultado.map((e) => e.saldoAnterior)).toEqual([0, 100, 100]);
  });

  it("não mistura colaboradores", () => {
    const a = periodo("a1", "2026-08-21", "2026-09-20", 600, 0, null, "ANA SOUZA");
    const b = periodo("b2", "2026-09-21", "2026-10-20", 0, 0, null, "BIA LIMA");
    expect(encadearSaldos([a, b]).map((e) => e.saldoAnterior)).toEqual([0, 0]);
  });
});

describe("novosPeriodos", () => {
  const out = periodo("out", "2026-09-21", "2026-10-20", 60, 0);
  const outBia = periodo("outb", "2026-09-21", "2026-10-20", 0, 30, null, "BIA LIMA");

  it("não abre nada enquanto o período atual não terminou", () => {
    expect(novosPeriodos([out, outBia], "2026-10-20")).toEqual([]);
  });

  it("abre o período seguinte para todos quando ele começa", () => {
    const novos = novosPeriodos([out, outBia], "2026-10-21");
    expect(novos.map((n) => [n.funcionario, n.periodoInicio, n.periodoFim])).toEqual([
      ["ANA SOUZA", "2026-10-21", "2026-11-20"],
      ["BIA LIMA", "2026-10-21", "2026-11-20"],
    ]);
  });

  it("abre vários meses de uma vez se ninguém acessou por um tempo, sem repetir os que já existem", () => {
    const nov = periodo("nov", "2026-10-21", "2026-11-20", 0, 0);
    const novos = novosPeriodos([out, outBia, nov], "2026-12-25");
    const chaves = novos.map((n) => `${n.funcionario}|${n.periodoFim}`);
    expect(chaves).toEqual([
      "BIA LIMA|2026-11-20",
      "ANA SOUZA|2026-12-20",
      "BIA LIMA|2026-12-20",
      "ANA SOUZA|2027-01-20",
      "BIA LIMA|2027-01-20",
    ]);
  });

  it("passa o ano e ajusta fim de mês curto", () => {
    const dez = periodo("dez", "2026-11-21", "2026-12-20", 0, 0);
    expect(novosPeriodos([dez], "2026-12-21")[0]?.periodoFim).toBe("2027-01-20");
    const fev = periodo("jan", "2027-01-29", "2027-01-30", 0, 0);
    expect(novosPeriodos([fev], "2027-02-01")[0]?.periodoFim).toBe("2027-02-28");
  });
});
