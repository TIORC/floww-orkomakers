import { describe, expect, it } from "vitest";
import { Workbook } from "exceljs";

import type { EspelhoSalvo } from "@/lib/banco-horas";
import { montarPlanilha, subtituloDoPeriodo, tituloDoMes } from "./exportar-banco-horas";

const base: EspelhoSalvo = {
  id: "1",
  funcionario: "GABRIEL ANACLETO DE SOUZA CRUZ",
  cargo: "AUXILIAR DE TI",
  departamento: "TI",
  periodoInicio: "2026-09-21",
  periodoFim: "2026-10-20",
  mes: "2026-10",
  horasExtras: 9 * 60 + 22,
  horasFaltas: 10 * 60 + 25,
  trabalhado: 169 * 60 + 2,
  saldoAnterior: 17 * 60 + 13,
  saldoManual: 17 * 60 + 13,
  pagarDescontar: -63,
  compensar: 17 * 60 + 13,
  observacao: "DIAS QUE A EMPRESA FECHOU (22, 25 e 26/06)",
};

const outra: EspelhoSalvo = {
  ...base,
  id: "2",
  funcionario: "ANNA GABRIELLA SILVA",
  departamento: "PESSOAL",
  horasExtras: 13,
  horasFaltas: 2 * 60 + 53,
  saldoAnterior: -(8 * 60 + 48),
  saldoManual: -(8 * 60 + 48),
  pagarDescontar: 0,
  compensar: -(8 * 60 + 48),
  observacao: "",
};

async function gerar() {
  const pasta = await montarPlanilha({
    linhas: [base, outra],
    titulo: "Outubro 2026",
    subtitulo: "Período 21/09/2026 a 20/10/2026",
    geradoEm: "26/10/2026",
  });
  const recarregada = new Workbook();
  await recarregada.xlsx.load(await pasta.xlsx.writeBuffer());
  return recarregada.getWorksheet("Banco de Horas")!;
}

describe("montarPlanilha", () => {
  it("escreve título, cabeçalho, linhas e totais no desenho da planilha", async () => {
    const aba = await gerar();
    expect(aba.getCell("C1").value).toBe("PLANILHA HORAS SUPLEMENTARES — OUTUBRO 2026");
    expect(aba.getCell("C3").value).toBe("Período 21/09/2026 a 20/10/2026");
    expect(aba.getRow(5).values).toEqual([
      undefined,
      "FUNCIONÁRIO",
      "DEPARTAMENTO",
      "SALDO ANTERIOR",
      "HORAS EXTRAS",
      "HORAS FALTAS",
      "HORAS TRABALHADAS",
      "HORAS PAGAR / DESCONTAR",
      "BANCO DE HORAS",
      "HORAS PARA COMPENSAR",
      "OBSERVAÇÕES",
    ]);
    // Linha do Gabriel: banco = 17:13 + 9:22 - 10:25 = 16:10.
    expect(aba.getRow(6).values).toEqual([
      undefined,
      "GABRIEL ANACLETO DE SOUZA CRUZ",
      "TI",
      "+17:13",
      "09:22",
      "10:25",
      "169:02",
      "-01:03",
      "+16:10",
      "+17:13",
      "DIAS QUE A EMPRESA FECHOU (22, 25 e 26/06)",
    ]);
    // Anna: -8:48 + 0:13 - 2:53 = -11:28.
    expect(aba.getCell("H7").value).toBe("-11:28");
    expect(aba.getCell("I7").value).toBe("-08:48");
    expect(aba.getCell("A8").value).toBe("TOTAL");
    expect(aba.getCell("D8").value).toBe("9h 35min");
  });

  it("pinta pagar/descontar e compensar conforme o sinal", async () => {
    const aba = await gerar();
    expect(aba.getCell("G6").font?.color?.argb).toBe("FF9C0006");
    expect(aba.getCell("I6").font?.color?.argb).toBe("FF1E7B34");
    expect(aba.getCell("I7").font?.color?.argb).toBe("FF9C0006");
    // Banco: Gabriel +16:10 (verde), Anna -11:28 (vermelho escuro).
    expect(aba.getCell("H6").font?.color?.argb).toBe("FF1E7B34");
    expect(aba.getCell("H7").font?.color?.argb).toBe("FF9C0006");
    expect(aba.getCell("A5").fill).toMatchObject({ fgColor: { argb: "FF1D3FA5" } });
  });
});

describe("textos do cabeçalho", () => {
  it("monta o título do mês e o período", () => {
    expect(tituloDoMes("outubro de 2026")).toBe("Outubro 2026");
    expect(subtituloDoPeriodo([base, outra])).toBe("Período 21/09/2026 a 20/10/2026");
    expect(subtituloDoPeriodo([base, { ...outra, periodoFim: "2026-11-20" }])).toBe(
      "Vários períodos",
    );
  });
});
