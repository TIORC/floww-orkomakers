import * as XLSX from "xlsx";

// Colunas reconhecidas na planilha de importação (mesmas do floww-hr-portal).
export const COLUNAS_MODELO = [
  "ID",
  "Nome",
  "Nome Completo",
  "Matricula",
  "Email",
  "CPF",
  "Cargo",
  "Cargo Visível ( editável )",
  "Unidade",
  "Departamento",
  "Grupos",
  "Papel",
  "Gestor Direto",
  "Gestor Direto - E-mail",
  "Etnia",
  "Sexo",
  "Gênero",
  "Data de Nascimento",
  "Data de Admissão",
  "Data de Cadastro",
  "Situação",
  "Ultimo Acesso",
  "Origem do Cadastro",
  "Participa gamificação",
  "Desligamento",
  "Ultimo dia trabalhado",
  "Biografia",
  "Idioma",
] as const;

export type LinhaImportada = {
  dados: Record<string, string>;
  nome: string;
  setor: string;
  gestorDireto: string;
  unidade: string;
  erro: string | undefined;
};

function normalizarTexto(valor: unknown) {
  if (valor instanceof Date) return valor.toLocaleDateString("pt-BR");
  return String(valor ?? "").trim();
}

// Compara nomes de coluna ignorando maiúsculas, acentos, espaços e pontuação.
export function chaveColuna(valor: unknown) {
  return normalizarTexto(valor)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function ehLinhaVazia(valores: unknown[]) {
  return valores.every((valor) => normalizarTexto(valor) === "");
}

function mapearColunas(cabecalho: unknown[]) {
  const indicePorColuna = new Map<string, number>();
  cabecalho.forEach((valor, indice) => {
    const chave = chaveColuna(valor);
    if (chave && !indicePorColuna.has(chave)) indicePorColuna.set(chave, indice);
  });
  return indicePorColuna;
}

function validarCabecalho(indicePorColuna: Map<string, number>) {
  const faltando: string[] = [];
  if (!indicePorColuna.has(chaveColuna("ID"))) faltando.push("ID");
  if (!indicePorColuna.has(chaveColuna("Email"))) faltando.push("Email");
  if (!indicePorColuna.has(chaveColuna("Nome")) && !indicePorColuna.has(chaveColuna("Nome Completo"))) {
    faltando.push("Nome ou Nome Completo");
  }
  if (faltando.length > 0) {
    return `Colunas obrigatórias não encontradas no cabeçalho: ${faltando.join(", ")}.`;
  }
  return null;
}

// Lê a primeira aba da planilha e devolve as linhas, marcando as que têm campos obrigatórios vazios.
export function lerPlanilha(arquivo: File) {
  return new Promise<LinhaImportada[]>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const workbook = XLSX.read(leitor.result as ArrayBuffer, { type: "array", cellDates: true });
        const primeiraAba = workbook.SheetNames[0];
        if (!primeiraAba) {
          reject(new Error("Planilha sem abas."));
          return;
        }
        // raw: false usa o texto exibido na célula, para preservar zeros à esquerda (CPF, Matrícula).
        const planilha = workbook.Sheets[primeiraAba];
        if (!planilha) {
          reject(new Error("Planilha sem abas."));
          return;
        }
        const matriz = XLSX.utils.sheet_to_json<unknown[]>(planilha, {
          header: 1,
          defval: "",
          blankrows: false,
          raw: false,
        });
        const linhas = matriz.filter((linha): linha is unknown[] => Array.isArray(linha) && !ehLinhaVazia(linha));
        if (linhas.length === 0) {
          resolve([]);
          return;
        }
        const cabecalho = linhas[0] ?? [];
        const indicePorColuna = mapearColunas(cabecalho);
        const erroCabecalho = validarCabecalho(indicePorColuna);
        if (erroCabecalho) {
          reject(new Error(erroCabecalho));
          return;
        }
        resolve(
          linhas.slice(1).map((linha) => {
            const valores = linha;
            const dados: Record<string, string> = {};
            COLUNAS_MODELO.forEach((coluna) => {
              const indice = indicePorColuna.get(chaveColuna(coluna));
              dados[coluna] = indice === undefined ? "" : normalizarTexto(valores[indice]);
            });
            const nome = dados["Nome Completo"] || dados["Nome"] || "";
            const erros: string[] = [];
            if (!nome) erros.push("Informe o Nome / Nome Completo.");
            if (!dados["ID"]) erros.push("Informe o ID.");
            if (!dados["Email"]) erros.push("Informe o Email.");
            return {
              dados,
              nome,
              setor: dados["Departamento"] ?? "",
              gestorDireto: dados["Gestor Direto"] ?? "",
              unidade: dados["Unidade"] ?? "",
              erro: erros.length > 0 ? erros.join(" ") : undefined,
            };
          }),
        );
      } catch {
        reject(new Error("Não foi possível ler a planilha."));
      }
    };
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.readAsArrayBuffer(arquivo);
  });
}

export function baixarModelo() {
  const workbook = XLSX.utils.book_new();
  const planilha = XLSX.utils.aoa_to_sheet([[...COLUNAS_MODELO]]);
  planilha["!cols"] = COLUNAS_MODELO.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(workbook, planilha, "Colaboradores");
  XLSX.writeFile(workbook, "modelo-importacao-colaboradores.xlsx");
}
