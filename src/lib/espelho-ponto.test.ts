import { describe, expect, it } from "vitest";

import {
  departamentoDoNomeDoArquivo,
  limparDepartamento,
  formatarTotal,
  formatarHorarioComSinal,
  textoParaMinutos,
  textoParaMinutosComSinal,
  textoParaMinutosNegativo,
  lerEspelhoPonto,
  rotuloDia,
  type ItemTexto,
} from "./espelho-ponto";

const item = (texto: string, x: number, y: number, largura = 20): ItemTexto => ({
  texto,
  x,
  largura,
  y,
});

// Cabeçalho e duas linhas no mesmo desenho do espelho: células vazias não geram item.
const itens: ItemTexto[] = [
  item("ESPELHO PONTO: 21/09/2026 - 20/10/2026", 314, 555, 214),
  item("FUNCIONÁRIO: ANA SOUZA | CPF: 1 | Cargo: ANALISTA | Jornada: 44", 36, 534, 500),
  item("trabalhado", 287, 481, 42),
  item("hora extra", 384, 481, 40),
  item("Faltas", 441, 485, 23),
  item("Observação", 745, 485, 44),
  item("22/09 (Ter)", 37, 460, 37),
  item("09:18", 298, 460),
  item("00:18", 395, 460),
  item("00:00", 443, 460),
  item("00:18", 487, 460),
  item("16/10 (Sex)", 36, 450, 39),
  item("03:53", 298, 450),
  item("04:07", 443, 450),
  item("Esqueci de bater", 740, 450, 54),
];

describe("lerEspelhoPonto", () => {
  it("liga cada valor à coluna certa mesmo com células vazias", () => {
    const espelho = lerEspelhoPonto(itens);
    expect(espelho.funcionario).toBe("ANA SOUZA");
    expect(espelho.cargo).toBe("ANALISTA");
    expect(espelho.periodo).toBe("21/09/2026 - 20/10/2026");
    expect(espelho.periodoInicio).toBe("2026-09-21");
    expect(espelho.periodoFim).toBe("2026-10-20");
    expect(espelho.dias).toEqual([
      {
        data: "22/09",
        dataIso: "2026-09-22",
        diaSemana: "Ter",
        trabalhado: 558,
        horasExtras: 18,
        horasFaltas: 0,
        observacao: "",
        tratamento: "",
      },
      {
        data: "16/10",
        dataIso: "2026-10-16",
        diaSemana: "Sex",
        trabalhado: 233,
        horasExtras: 0,
        horasFaltas: 247,
        observacao: "Esqueci de bater",
        tratamento: "",
      },
    ]);
  });

  it("soma os totais e formata a data com o dia da semana", () => {
    const espelho = lerEspelhoPonto(itens);
    expect(formatarTotal(espelho.totais.horasFaltas)).toBe("4h 07min");
    expect(rotuloDia(espelho.dias[0]!)).toBe("22/09  -  Ter");
  });

  it("recusa um PDF que não é espelho de ponto", () => {
    expect(() => lerEspelhoPonto([item("Outro relatório", 10, 10)])).toThrow();
  });
});

describe("formatarTotal", () => {
  it("separa os milhares e as unidades", () => {
    expect(formatarTotal(115363)).toBe("1.922h 43min");
    expect(formatarTotal(0)).toBe("0h 00min");
  });
});

describe("textoParaMinutos", () => {
  it("aceita os jeitos comuns de digitar um horário", () => {
    expect(textoParaMinutos("1:30")).toBe(90);
    expect(textoParaMinutos("01:30")).toBe(90);
    expect(textoParaMinutos("1h30")).toBe(90);
    expect(textoParaMinutos("0036")).toBe(36);
    expect(textoParaMinutos("")).toBe(0);
  });

  it("rejeita o que não é horário", () => {
    expect(textoParaMinutos("abc")).toBeNull();
    expect(textoParaMinutos("1:75")).toBeNull();
  });
});

describe("data completa", () => {
  it("usa o ano certo quando o período vira o ano", () => {
    const virada: ItemTexto[] = [
      item("ESPELHO PONTO: 21/12/2026 - 20/01/2027", 314, 555, 214),
      item("trabalhado", 287, 481, 42),
      item("hora extra", 384, 481, 40),
      item("Faltas", 441, 485, 23),
      item("Observação", 745, 485, 44),
      item("30/12 (Qua)", 37, 460, 37),
      item("02/01 (Sáb)", 37, 450, 37),
    ];
    const espelho = lerEspelhoPonto(virada);
    expect(espelho.dias.map((d) => d.dataIso)).toEqual(["2026-12-30", "2027-01-02"]);
    expect(espelho.periodoFim).toBe("2027-01-20");
  });
});

describe("departamentoDoNomeDoArquivo", () => {
  it("pega só o nome do departamento, sem a palavra Dpto.", () => {
    expect(departamentoDoNomeDoArquivo("Espelho - GABRIEL ANACLETO DE S CRUZ - Dpto. TI.pdf")).toBe(
      "TI",
    );
    expect(departamentoDoNomeDoArquivo("Espelho - ANA - Dpto. Recursos Humanos.PDF")).toBe(
      "Recursos Humanos",
    );
    expect(departamentoDoNomeDoArquivo("Espelho - ANA - Departamento Financeiro.pdf")).toBe(
      "Financeiro",
    );
  });

  it("aceita variações de escrita e ignora o sufixo de cópia", () => {
    expect(departamentoDoNomeDoArquivo("Espelho - DANUSA - Dpto.Sucesso do Cliente.pdf")).toBe(
      "Sucesso do Cliente",
    );
    expect(departamentoDoNomeDoArquivo("Espelho - DANUSA - Dpto - Sucesso do Cliente.pdf")).toBe(
      "Sucesso do Cliente",
    );
    expect(departamentoDoNomeDoArquivo("Espelho - DANUSA - Dpto. Sucesso do Cliente (1).pdf")).toBe(
      "Sucesso do Cliente",
    );
    expect(departamentoDoNomeDoArquivo("Espelho - DANUSA - Dpto. Fiscal - Cópia.pdf")).toBe(
      "Fiscal",
    );
  });

  it("devolve vazio quando o nome do arquivo não traz departamento", () => {
    expect(departamentoDoNomeDoArquivo("espelho.pdf")).toBe("");
  });
});

describe("horas para compensar com sinal", () => {
  it("lê +13:00 e -13:00; sem sinal vale positivo", () => {
    expect(textoParaMinutosComSinal("+13:00")).toBe(780);
    expect(textoParaMinutosComSinal("-13:00")).toBe(-780);
    expect(textoParaMinutosComSinal("13:00")).toBe(780);
    expect(textoParaMinutosComSinal("")).toBe(0);
  });

  it("recusa o que não é horário", () => {
    expect(textoParaMinutosComSinal("-")).toBeNull();
    expect(textoParaMinutosComSinal("+abc")).toBeNull();
  });

  it("mostra o sinal junto do valor", () => {
    expect(formatarHorarioComSinal(780)).toBe("+13:00");
    expect(formatarHorarioComSinal(-780)).toBe("-13:00");
    expect(formatarHorarioComSinal(0)).toBe("");
  });
});

describe("formato da planilha de banco de horas", () => {
  it("entende o (-) da planilha", () => {
    expect(textoParaMinutosComSinal("(-)10:21")).toBe(-621);
    expect(textoParaMinutosComSinal("(-)00:10")).toBe(-10);
  });

  it("horas a pagar/descontar são sempre negativas e recusam o +", () => {
    expect(textoParaMinutosNegativo("1:03")).toBe(-63);
    expect(textoParaMinutosNegativo("-1:03")).toBe(-63);
    expect(textoParaMinutosNegativo("(-)01:03")).toBe(-63);
    expect(textoParaMinutosNegativo("")).toBe(0);
    expect(textoParaMinutosNegativo("+1:03")).toBeNull();
    expect(textoParaMinutosNegativo("abc")).toBeNull();
  });
});

describe("limparDepartamento", () => {
  it("tira a palavra Departamento e variações, deixando só o nome", () => {
    expect(limparDepartamento("Departamento Fiscal")).toBe("Fiscal");
    expect(limparDepartamento("DEPARTAMENTO: Sucesso do Cliente")).toBe("Sucesso do Cliente");
    expect(limparDepartamento("Dpto. TI")).toBe("TI");
    expect(limparDepartamento("Setor - Contábil")).toBe("Contábil");
    expect(limparDepartamento("Fiscal")).toBe("Fiscal");
  });

  it("não corta nomes que apenas começam parecido", () => {
    expect(limparDepartamento("Departamentos Gerais")).toBe("Departamentos Gerais");
  });
});
