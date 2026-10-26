import type { Workbook } from "exceljs";

import { bancoDeHoras, type EspelhoSalvo } from "@/lib/banco-horas";
import { formatarHorario, formatarHorarioComSinal, formatarTotal } from "@/lib/espelho-ponto";

// Paleta da planilha: azul, branco e amarelo (ARGB, como o Excel pede).
const AZUL = "FF1D3FA5";
const AZUL_ESCURO = "FF14286B";
const AMARELO = "FFFFC72C";
const AMARELO_CLARO = "FFFFF3B8";
const FAIXA_AZUL = "FFEAF0FB";
const BORDA = "FFB8C4E0";
const FUNDO_LOGO = "FFF5F5F5";
const BRANCO = "FFFFFFFF";
const VERMELHO_ESCURO = "FF9C0006";
const VERDE = "FF1E7B34";

type ColunaPlanilha = {
  titulo: string;
  largura: number;
  alinhar: "left" | "center";
  valor: (espelho: EspelhoSalvo) => string;
};

// "+15:40" / "-10:21", ou vazio quando não foi informado.
const comSinal = (minutos: number) => formatarHorarioComSinal(minutos);

const COLUNAS: ColunaPlanilha[] = [
  { titulo: "FUNCIONÁRIO", largura: 40, alinhar: "left", valor: (e) => e.funcionario },
  { titulo: "DEPARTAMENTO", largura: 22, alinhar: "left", valor: (e) => e.departamento },
  {
    titulo: "SALDO ANTERIOR",
    largura: 16,
    alinhar: "center",
    valor: (e) => comSinal(e.saldoAnterior),
  },
  {
    titulo: "HORAS EXTRAS",
    largura: 14,
    alinhar: "center",
    valor: (e) => formatarHorario(e.horasExtras),
  },
  {
    titulo: "HORAS FALTAS",
    largura: 14,
    alinhar: "center",
    valor: (e) => formatarHorario(e.horasFaltas),
  },
  {
    titulo: "HORAS TRABALHADAS",
    largura: 17,
    alinhar: "center",
    valor: (e) => formatarHorario(e.trabalhado),
  },
  {
    titulo: "HORAS PAGAR / DESCONTAR",
    largura: 17,
    alinhar: "center",
    valor: (e) => comSinal(e.pagarDescontar),
  },
  {
    titulo: "BANCO DE HORAS",
    largura: 16,
    alinhar: "center",
    valor: (e) => {
      const banco = bancoDeHoras(e);
      return `${banco < 0 ? "-" : "+"}${formatarHorario(Math.abs(banco))}`;
    },
  },
  {
    titulo: "HORAS PARA COMPENSAR",
    largura: 19,
    alinhar: "center",
    valor: (e) => comSinal(e.compensar),
  },
  { titulo: "OBSERVAÇÕES", largura: 50, alinhar: "left", valor: (e) => e.observacao },
];

// Posições (a partir de 0) das colunas que recebem cor especial.
const COL_SALDO_ANTERIOR = 2;
const COL_PAGAR = 6;
const COL_BANCO = 7;
const COL_COMPENSAR = 8;
const COL_OBSERVACAO = 9;

const LINHA_CABECALHO = 5;

const borda = { style: "thin" as const, color: { argb: BORDA } };
const bordas = { top: borda, left: borda, bottom: borda, right: borda };

type Opcoes = {
  linhas: EspelhoSalvo[];
  // "Setembro 2026"
  titulo: string;
  // "Período 21/09/2026 a 20/10/2026"
  subtitulo: string;
  // "26/10/2026"
  geradoEm: string;
  // PNG do logo. Sem ele, a planilha sai só com o título.
  logo?: ArrayBuffer | undefined;
};

// Monta a planilha colorida do banco de horas, no mesmo desenho da tela e da planilha original.
export async function montarPlanilha({
  linhas,
  titulo,
  subtitulo,
  geradoEm,
  logo,
}: Opcoes): Promise<Workbook> {
  // O exceljs é CommonJS: conforme o empacotador, o Workbook vem direto ou dentro de "default".
  const modulo = await import("exceljs");
  const PastaDeTrabalho =
    modulo.Workbook ?? (modulo as unknown as { default: typeof modulo }).default.Workbook;
  const pasta = new PastaDeTrabalho();
  pasta.creator = "Grupo Orcoma";
  const aba = pasta.addWorksheet("Banco de Horas", {
    views: [{ state: "frozen", xSplit: 1, ySplit: LINHA_CABECALHO, showGridLines: false }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: `${LINHA_CABECALHO}:${LINHA_CABECALHO}`,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
  });
  aba.columns = COLUNAS.map((c) => ({ width: c.largura }));
  const ultimaColuna = COLUNAS.length;

  // Faixa do topo: logo à esquerda, título em azul e subtítulo em amarelo.
  aba.getRow(1).height = 26;
  aba.getRow(2).height = 26;
  aba.getRow(3).height = 22;
  aba.getRow(4).height = 8;
  aba.mergeCells(1, 1, 3, 2);
  aba.getCell(1, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: FUNDO_LOGO } };
  aba.mergeCells(1, 3, 2, ultimaColuna);
  const celulaTitulo = aba.getCell(1, 3);
  celulaTitulo.value = `PLANILHA HORAS SUPLEMENTARES — ${titulo.toUpperCase()}`;
  celulaTitulo.font = { name: "Calibri", size: 20, bold: true, color: { argb: BRANCO } };
  celulaTitulo.alignment = { vertical: "middle", horizontal: "center" };
  celulaTitulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
  aba.mergeCells(3, 3, 3, ultimaColuna);
  const celulaSubtitulo = aba.getCell(3, 3);
  celulaSubtitulo.value = subtitulo;
  celulaSubtitulo.font = { name: "Calibri", size: 12, bold: true, color: { argb: AZUL_ESCURO } };
  celulaSubtitulo.alignment = { vertical: "middle", horizontal: "center" };
  celulaSubtitulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AMARELO } };

  if (logo) {
    const imagem = pasta.addImage({ buffer: logo, extension: "png" });
    aba.addImage(imagem, { tl: { col: 0.15, row: 0.1 }, ext: { width: 200, height: 69 } });
  }

  // Cabeçalho da tabela.
  const cabecalho = aba.getRow(LINHA_CABECALHO);
  cabecalho.height = 38;
  COLUNAS.forEach((coluna, i) => {
    const celula = cabecalho.getCell(i + 1);
    celula.value = coluna.titulo;
    celula.font = { name: "Calibri", size: 11, bold: true, color: { argb: BRANCO } };
    celula.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
    celula.border = { ...bordas, bottom: { style: "thick", color: { argb: AMARELO } } };
  });
  aba.autoFilter = {
    from: { row: LINHA_CABECALHO, column: 1 },
    to: { row: LINHA_CABECALHO, column: ultimaColuna },
  };

  // Uma linha por colaborador, com faixas alternadas e destaque nos campos que o RH digitou.
  linhas.forEach((espelho, indice) => {
    const linha = aba.getRow(LINHA_CABECALHO + 1 + indice);
    const fundo = indice % 2 === 0 ? BRANCO : FAIXA_AZUL;
    const observacao = espelho.observacao;
    linha.height = observacao.length > 55 ? Math.ceil(observacao.length / 55) * 15 + 6 : 21;

    COLUNAS.forEach((coluna, i) => {
      const celula = linha.getCell(i + 1);
      celula.value = coluna.valor(espelho);
      celula.alignment = {
        vertical: "middle",
        horizontal: coluna.alinhar,
        wrapText: i === COL_OBSERVACAO,
        indent: coluna.alinhar === "left" ? 1 : 0,
      };
      celula.border = bordas;
      let preenchimento = fundo;
      let cor = AZUL_ESCURO;
      let negrito = i === 0 || i === COL_BANCO;

      if (i === COL_SALDO_ANTERIOR && espelho.saldoManual !== null) {
        preenchimento = AMARELO_CLARO;
        negrito = true;
      } else if (i === COL_PAGAR && espelho.pagarDescontar < 0) {
        cor = VERMELHO_ESCURO;
        negrito = true;
      } else if (i === COL_BANCO && bancoDeHoras(espelho) !== 0) {
        cor = bancoDeHoras(espelho) > 0 ? VERDE : VERMELHO_ESCURO;
      } else if (i === COL_COMPENSAR && espelho.compensar !== 0) {
        preenchimento = AMARELO_CLARO;
        cor = espelho.compensar > 0 ? VERDE : VERMELHO_ESCURO;
        negrito = true;
      }

      celula.font = { name: "Calibri", size: 11, bold: negrito, color: { argb: cor } };
      celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: preenchimento } };
    });
  });

  // Totais do que está na planilha.
  const linhaTotal = aba.getRow(LINHA_CABECALHO + 1 + linhas.length);
  linhaTotal.height = 24;
  const soma = (campo: "horasExtras" | "horasFaltas" | "trabalhado") =>
    linhas.reduce((total, e) => total + e[campo], 0);
  const totais: Record<number, string> = {
    0: "TOTAL",
    3: formatarTotal(soma("horasExtras")),
    4: formatarTotal(soma("horasFaltas")),
    5: formatarTotal(soma("trabalhado")),
  };
  COLUNAS.forEach((coluna, i) => {
    const celula = linhaTotal.getCell(i + 1);
    celula.value = totais[i] ?? "";
    celula.font = { name: "Calibri", size: 11, bold: true, color: { argb: AZUL_ESCURO } };
    celula.alignment = {
      vertical: "middle",
      horizontal: coluna.alinhar,
      indent: coluna.alinhar === "left" ? 1 : 0,
    };
    celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AMARELO } };
    celula.border = { ...bordas, top: { style: "medium", color: { argb: AZUL_ESCURO } } };
  });

  // Legenda, para quem recebe a planilha entender as cores e o cálculo.
  const primeiraLegenda = LINHA_CABECALHO + linhas.length + 3;
  const legenda: { texto: string; fundo: string; cor: string }[] = [
    {
      texto: "Banco de horas = saldo anterior + horas extras − horas faltas.",
      fundo: FAIXA_AZUL,
      cor: AZUL_ESCURO,
    },
    {
      texto: "Fundo amarelo: valor digitado pelo RH (saldo anterior e horas para compensar).",
      fundo: AMARELO_CLARO,
      cor: AZUL_ESCURO,
    },
    {
      texto:
        "Vermelho escuro: horas a pagar/descontar ou a compensar com saldo negativo. Verde: a compensar com saldo positivo.",
      fundo: BRANCO,
      cor: VERMELHO_ESCURO,
    },
    { texto: `Gerado em ${geradoEm}.`, fundo: BRANCO, cor: "FF5B6B8F" },
  ];
  legenda.forEach(({ texto, fundo, cor }, i) => {
    const numero = primeiraLegenda + i;
    aba.mergeCells(numero, 1, numero, ultimaColuna);
    const celula = aba.getCell(numero, 1);
    celula.value = texto;
    celula.font = { name: "Calibri", size: 10, italic: true, color: { argb: cor } };
    celula.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fundo } };
  });

  return pasta;
}

// "outubro de 2026" vira "Outubro 2026".
export function tituloDoMes(rotulo: string) {
  const semDe = rotulo.replace(" de ", " ");
  return semDe.charAt(0).toUpperCase() + semDe.slice(1);
}

function dataBr(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

// "Período 21/09/2026 a 20/10/2026" quando todos os espelhos são do mesmo período.
export function subtituloDoPeriodo(linhas: EspelhoSalvo[]) {
  const periodos = new Set(linhas.map((e) => `${e.periodoInicio}|${e.periodoFim}`));
  if (periodos.size !== 1 || !linhas[0]) return "Vários períodos";
  return `Período ${dataBr(linhas[0].periodoInicio)} a ${dataBr(linhas[0].periodoFim)}`;
}

async function carregarLogo(): Promise<ArrayBuffer | undefined> {
  try {
    const resposta = await fetch("/images/logo-grupo-orcoma-azul.png");
    return resposta.ok ? await resposta.arrayBuffer() : undefined;
  } catch {
    return undefined;
  }
}

// Gera a planilha e baixa o arquivo .xlsx.
export async function exportarBancoDeHoras(linhas: EspelhoSalvo[], titulo: string) {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const pasta = await montarPlanilha({
    linhas,
    titulo,
    subtitulo: subtituloDoPeriodo(linhas),
    geradoEm: hoje,
    logo: await carregarLogo(),
  });
  const conteudo = await pasta.xlsx.writeBuffer();
  const arquivo = new Blob([conteudo], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const endereco = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = endereco;
  link.download = `Banco de Horas - ${titulo}.xlsx`;
  link.click();
  URL.revokeObjectURL(endereco);
}
