// Leitura do "Espelho Ponto" em PDF (relatório do Coalize). O PDF tem uma tabela com uma linha por dia;
// as células vazias não aparecem no texto, então cada valor é ligado à coluna pela posição horizontal.

export type ItemTexto = { texto: string; x: number; largura: number; y: number };

export type DiaEspelho = {
  // "21/09"
  data: string;
  // "2026-09-21": a data completa, com o ano tirado do período do espelho.
  dataIso: string;
  // "Seg"
  diaSemana: string;
  // Minutos. "Total trabalhado" é o saldo do dia.
  trabalhado: number;
  horasExtras: number;
  horasFaltas: number;
  observacao: string;
  // Preenchido pelo RH na tela; o PDF não traz.
  tratamento: string;
};

export type EspelhoPonto = {
  funcionario: string;
  cargo: string;
  // Não vem dentro do PDF: é tirado do nome do arquivo ("... - Dpto. TI.pdf" vira "TI").
  departamento: string;
  periodo: string;
  // "2026-09-21" e "2026-10-20".
  periodoInicio: string;
  periodoFim: string;
  dias: DiaEspelho[];
  totais: { trabalhado: number; horasExtras: number; horasFaltas: number };
};

const DIA = /^(\d{2}\/\d{2})(?:\/\d{4})?\s*\(([^)]+)\)/;
const HORARIO = /^\d{1,3}:\d{2}$/;
const TOTAL_EXTENSO = /^(\d+)h(\d{2})min$/;

export function horarioParaMinutos(valor: string): number {
  const [h = 0, m = 0] = valor.split(":").map(Number);
  return h * 60 + m;
}

// Texto digitado pelo RH ("1:30", "01:30", "1h30", "130") para minutos. Vazio vale zero; inválido devolve null.
export function textoParaMinutos(texto: string): number | null {
  const limpo = texto.trim().toLowerCase();
  if (!limpo) return 0;
  const casou =
    /^(\d{1,3})(?::|h)([0-5]\d)(?:min)?$/.exec(limpo) ?? /^(\d{1,3})([0-5]\d)$/.exec(limpo);
  return casou ? Number(casou[1]) * 60 + Number(casou[2]) : null;
}

// Horas com sinal opcional ("+13:00", "-13:00", "13:00"). Sem sinal vale positivo. Vazio vale zero; inválido devolve null.
export function textoParaMinutosComSinal(texto: string): number | null {
  // A planilha escreve o negativo como "(-)10:21"; aqui isso vale o mesmo que "-10:21".
  const limpo = texto.trim().replace(/^\(([+-])\)/, "$1");
  const negativo = limpo.startsWith("-");
  const minutos = textoParaMinutos(negativo || limpo.startsWith("+") ? limpo.slice(1) : limpo);
  if (minutos === null || (limpo !== "" && minutos === 0 && /^[+-]$/.test(limpo))) return null;
  return (negativo ? -minutos : minutos) || 0;
}

// Valor que só pode ser negativo (horas a pagar/descontar): "1:03", "-1:03" e "(-)1:03" viram -63.
// Um "+" é recusado, porque aqui não existe saldo positivo. Vazio vale zero; inválido devolve null.
export function textoParaMinutosNegativo(texto: string): number | null {
  if (texto.trim().startsWith("+")) return null;
  const minutos = textoParaMinutosComSinal(texto);
  return minutos === null ? null : -Math.abs(minutos) || 0;
}

// 780 vira "+13:00" e -780 vira "-13:00". Zero vira vazio.
export function formatarHorarioComSinal(minutos: number): string {
  if (minutos === 0) return "";
  return `${minutos < 0 ? "-" : "+"}${formatarHorario(Math.abs(minutos))}`;
}

// "02h56min" (formato da linha TOTAL do PDF) para minutos.
function totalExtensoParaMinutos(valor: string): number | null {
  const casou = TOTAL_EXTENSO.exec(valor);
  return casou ? Number(casou[1]) * 60 + Number(casou[2]) : null;
}

export function formatarHorario(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatarTotal(minutos: number): string {
  // "1.922h 43min": separador de milhar nas horas e espaço entre horas e minutos, para totais grandes ficarem legíveis.
  return `${Math.floor(minutos / 60).toLocaleString("pt-BR")}h ${String(minutos % 60).padStart(2, "0")}min`;
}

// "ESPELHO PONTO: 21/09/2026 - 20/10/2026" para as duas datas em ISO.
function lerPeriodo(texto: string): { inicio: string; fim: string } {
  const casou = /(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2})\/(\d{2})\/(\d{4})/.exec(texto);
  if (!casou) throw new Error("Não encontrei o período do espelho de ponto.");
  return {
    inicio: `${casou[3]}-${casou[2]}-${casou[1]}`,
    fim: `${casou[6]}-${casou[5]}-${casou[4]}`,
  };
}

// "21/09" dentro do período vira "2026-09-21". Períodos que viram o ano (dez a jan) usam o ano certo de cada mês.
function dataCompleta(data: string, inicio: string, fim: string): string {
  const [dia = "", mes = ""] = data.split("/");
  const anoInicio = Number(inicio.slice(0, 4));
  const anoFim = Number(fim.slice(0, 4));
  const ano =
    anoInicio === anoFim || Number(mes) >= Number(inicio.slice(5, 7)) ? anoInicio : anoFim;
  return `${ano}-${mes}-${dia}`;
}

// "Espelho - GABRIEL - Dpto. TI.pdf" vira "TI": o que vem depois de "Dpto." (ou "Departamento"), sem a palavra.
export function departamentoDoNomeDoArquivo(nome: string): string {
  const semExtensao = nome.replace(/\.pdf$/i, "");
  // Aceita "Dpto. TI", "Dpto.TI", "Dpto - TI", "Departamento: TI"; o ponto, o espaço e o separador são opcionais.
  const achado = /(?:dpto|depto|departamento)\.?\s*[-:]?\s*(.+)$/i.exec(semExtensao)?.[1] ?? "";
  // Cópias baixadas do navegador acrescentam " (1)" ou " - Copia" ao final; isso não faz parte do departamento.
  return limparDepartamento(
    achado.replace(/\s*\(\d+\)\s*$/, "").replace(/\s*-?\s*c[óo]pia\s*$/i, ""),
  );
}

// Deixa só o nome do departamento: "Departamento Fiscal", "Dpto. Fiscal" e "Setor: Fiscal" viram "Fiscal".
export function limparDepartamento(texto: string): string {
  return texto
    .trim()
    .replace(/^(?:(?:departamento|dpto|depto|setor)\b\.?\s*[-:]?\s*)+/i, "")
    .trim();
}

export function rotuloDia(dia: Pick<DiaEspelho, "data" | "diaSemana">): string {
  return `${dia.data}  -  ${dia.diaSemana}`;
}

function centro(item: ItemTexto) {
  return item.x + item.largura / 2;
}

// Agrupa itens que estão na mesma linha visual (y parecido), da esquerda para a direita.
function agruparLinhas(itens: ItemTexto[]): ItemTexto[][] {
  const ordenados = [...itens].sort((a, b) => b.y - a.y || a.x - b.x);
  const linhas: ItemTexto[][] = [];
  for (const item of ordenados) {
    const linha = linhas.find((l) => Math.abs((l[0]?.y ?? Number.NaN) - item.y) <= 2);
    if (linha) linha.push(item);
    else linhas.push([item]);
  }
  return linhas.map((l) => l.sort((a, b) => a.x - b.x));
}

type ChaveColuna = "trabalhado" | "horasExtras" | "horasFaltas";

function colunaMaisProxima(item: ItemTexto, colunas: { chave: ChaveColuna; centro: number }[]) {
  return colunas.reduce((melhor, coluna) =>
    Math.abs(coluna.centro - centro(item)) < Math.abs(melhor.centro - centro(item))
      ? coluna
      : melhor,
  ).chave;
}

export function lerEspelhoPonto(itens: ItemTexto[]): EspelhoPonto {
  const linhas = agruparLinhas(itens);
  const textoDe = (linha: ItemTexto[]) => linha.map((i) => i.texto).join(" ");

  // Posição das colunas, tirada do cabeçalho: "Total trabalhado" e "Total hora extra" quebram em duas linhas,
  // então o texto da segunda linha ("trabalhado", "hora extra") é o que marca a coluna.
  const achar = (rotulo: string) => itens.find((i) => i.texto.trim().toLowerCase() === rotulo);
  const trabalhado = achar("trabalhado");
  const horaExtra = achar("hora extra");
  const faltas = achar("faltas");
  const observacao = achar("observação") ?? achar("observacao");
  if (!trabalhado || !horaExtra || !faltas || !observacao) {
    throw new Error(
      "Não encontrei o cabeçalho do espelho de ponto (Total trabalhado, Total hora extra, Faltas, Observação).",
    );
  }
  const colunas: { chave: ChaveColuna; centro: number }[] = [
    { chave: "trabalhado", centro: centro(trabalhado) },
    { chave: "horasExtras", centro: centro(horaExtra) },
    { chave: "horasFaltas", centro: centro(faltas) },
  ];
  // Tudo que cai antes de "Total trabalhado" são as batidas (entradas e saídas); depois de "Faltas" vêm as colunas de H.E.
  const limiteHE = centro(faltas) + (centro(faltas) - centro(horaExtra)) / 2;
  const inicioObservacao = observacao.x - 20;

  const textoTodo = linhas.map(textoDe);
  const dias: DiaEspelho[] = [];
  for (const linha of linhas) {
    const primeiro = linha[0];
    const casou = primeiro && DIA.exec(primeiro.texto.trim());
    if (!casou) continue;

    const dia: DiaEspelho = {
      data: casou[1] ?? "",
      dataIso: "",
      diaSemana: (casou[2] ?? "").trim().replace(/^./, (c) => c.toUpperCase()),
      trabalhado: 0,
      horasExtras: 0,
      horasFaltas: 0,
      observacao: "",
      tratamento: "",
    };
    const textosObservacao: string[] = [];
    for (const item of linha.slice(1)) {
      const texto = item.texto.trim();
      if (!texto) continue;
      if (item.x >= inicioObservacao && !HORARIO.test(texto)) {
        textosObservacao.push(texto);
      } else if (
        HORARIO.test(texto) &&
        centro(item) < limiteHE &&
        centro(item) >= centro(trabalhado) - 15
      ) {
        const chave = colunaMaisProxima(item, colunas);
        dia[chave] = horarioParaMinutos(texto);
      }
    }
    dia.observacao = textosObservacao.join(" ");
    dias.push(dia);
  }
  if (dias.length === 0)
    throw new Error("Não encontrei nenhuma linha de data no espelho de ponto.");

  const { inicio: periodoInicio, fim: periodoFim } = lerPeriodo(
    textoTodo.find((t) => t.includes("ESPELHO PONTO")) ?? "",
  );
  for (const dia of dias) dia.dataIso = dataCompleta(dia.data, periodoInicio, periodoFim);

  const soma = (campo: "trabalhado" | "horasExtras" | "horasFaltas") =>
    dias.reduce((s, d) => s + d[campo], 0);

  const cabecalho = textoTodo.find((t) => t.includes("FUNCIONÁRIO")) ?? "";
  const funcionario = /FUNCION[ÁA]RIO:\s*(.*?)\s*\|/.exec(cabecalho)?.[1] ?? "";
  const cargo = /Cargo:\s*(.*?)\s*\|/.exec(cabecalho)?.[1] ?? "";
  const periodo =
    /ESPELHO PONTO:\s*(.*)$/
      .exec(textoTodo.find((t) => t.includes("ESPELHO PONTO")) ?? "")?.[1]
      ?.trim() ?? "";

  return {
    funcionario,
    cargo,
    departamento: "",
    periodo,
    periodoInicio,
    periodoFim,
    dias,
    totais: {
      trabalhado: soma("trabalhado"),
      horasExtras: soma("horasExtras"),
      horasFaltas: soma("horasFaltas"),
    },
  };
}

// Totais impressos na linha TOTAL do PDF (em ordem, da esquerda para a direita: trabalhado, normais, extras, faltas).
// Servem para conferir a soma feita pelas linhas.
export function totaisImpressos(itens: ItemTexto[]): number[] {
  const linha = agruparLinhas(itens).find((l) => l[0]?.texto.trim() === "TOTAL");
  if (!linha) return [];
  return linha
    .map((i) => totalExtensoParaMinutos(i.texto.trim()))
    .filter((v): v is number => v !== null);
}

export async function lerEspelhoDoArquivo(arquivo: File): Promise<EspelhoPonto> {
  const [pdfjs, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const documento = await pdfjs.getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()) })
    .promise;
  const itens: ItemTexto[] = [];
  let deslocamentoY = 0;
  for (let numero = 1; numero <= documento.numPages; numero++) {
    const pagina = await documento.getPage(numero);
    const conteudo = await pagina.getTextContent();
    for (const item of conteudo.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      // Páginas seguintes ficam "abaixo" da anterior, para as linhas não se misturarem.
      itens.push({
        texto: item.str,
        x: item.transform[4] ?? 0,
        largura: item.width,
        y: (item.transform[5] ?? 0) - deslocamentoY,
      });
    }
    deslocamentoY += (pagina.view[3] ?? 0) + 100;
  }
  return { ...lerEspelhoPonto(itens), departamento: departamentoDoNomeDoArquivo(arquivo.name) };
}
