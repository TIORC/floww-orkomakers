import type { SupabaseClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

import { supabase } from "@/integrations/supabase/client";
import {
  aplicarSomenteAtivos,
  aplicarSomenteDesativados,
  aplicarSomenteDesligados,
  estaDesativado,
  estaDesligado,
} from "@/lib/desligamento";
import { emailPermitido, MENSAGEM_DOMINIO_EMAIL } from "@/lib/dominios-email";

// A tipagem gerada do banco ainda não inclui colaboradores_importados.
const db = supabase as unknown as SupabaseClient<any>;

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

// Colunas que a planilha exportada pelo sistema pode trazer com outro nome.
const ALTERNATIVAS: Record<string, string[]> = {
  "Cargo Visível ( editável )": ["Cargo visível"],
  "Data de Admissão": ["Data Admissão"],
  Desligamento: ["Desligamento - Tipo"],
};

// Motivo do desligamento: é juntado ao tipo no campo "Desligamento".
const COLUNA_MOTIVO = "Desligamento - Motivo";
const COLUNAS_LEITURA = [...COLUNAS_MODELO, COLUNA_MOTIVO];

const TAMANHO_PAGINA_BANCO = 1000;

export type LinhaImportada = {
  dados: Record<string, string>;
  nome: string;
  setor: string;
  gestorDireto: string;
  unidade: string;
  erro: string | undefined;
};

export type ItemRelatorioImportacao = {
  nome: string;
  identificador: string;
  motivo: string;
};

export type RelatorioImportacao = {
  salvos: number;
  duplicados: ItemRelatorioImportacao[];
  falhas: ItemRelatorioImportacao[];
};

export type ColaboradorImportado = {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  gestorDireto: string;
  gestorDiretoEmail: string;
  gestorDiretoFotoUrl: string;
  unidade: string;
  fotoUrl: string;
  inativo: boolean;
  desativado: boolean;
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

// Procura a coluna pelo nome do modelo e, se não existir, pelos nomes alternativos.
function indiceDaColuna(indicePorColuna: Map<string, number>, coluna: string) {
  for (const nome of [coluna, ...(ALTERNATIVAS[coluna] ?? [])]) {
    const indice = indicePorColuna.get(chaveColuna(nome));
    if (indice !== undefined) return indice;
  }
  return undefined;
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
            const dados: Record<string, string> = {};
            COLUNAS_LEITURA.forEach((coluna) => {
              const indice = indiceDaColuna(indicePorColuna, coluna);
              dados[coluna] = indice === undefined ? "" : normalizarTexto(linha[indice]);
            });
            dados["Desligamento"] = [dados["Desligamento"], dados[COLUNA_MOTIVO]].filter(Boolean).join(" - ");
            const nome = dados["Nome Completo"] || dados["Nome"] || "";
            const erros: string[] = [];
            if (!nome) erros.push("Informe o Nome / Nome Completo.");
            if (!dados["ID"]) erros.push("Informe o ID.");
            if (!dados["Email"]) erros.push("Informe o Email.");
            else if (!emailPermitido(dados["Email"])) erros.push(MENSAGEM_DOMINIO_EMAIL);
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

// Busca todas as chaves já cadastradas (ID, e-mail e CPF), página a página.
async function buscarChavesExistentes() {
  const chaves: { id_planilha: string; email: string; cpf: string }[] = [];
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA_BANCO) {
    const { data, error } = await db
      .from("colaboradores_importados")
      .select("id_planilha, email, cpf")
      .order("id_planilha", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA_BANCO - 1);
    if (error) throw error;
    chaves.push(...(data ?? []));
    if (!data || data.length < TAMANHO_PAGINA_BANCO) break;
  }
  return chaves;
}

// Todos os campos da planilha vão para o banco; a tela usa só alguns deles.
function paraRegistro(linha: LinhaImportada) {
  const dados = linha.dados;
  return {
    id_planilha: dados["ID"],
    nome: dados["Nome"] || linha.nome,
    nome_completo: linha.nome,
    matricula: dados["Matricula"],
    email: dados["Email"],
    cpf: dados["CPF"],
    cargo: dados["Cargo"],
    cargo_visivel: dados["Cargo Visível ( editável )"],
    unidade: dados["Unidade"],
    departamento: dados["Departamento"],
    grupos: dados["Grupos"],
    papel: dados["Papel"],
    gestor_direto: dados["Gestor Direto"],
    gestor_direto_email: dados["Gestor Direto - E-mail"],
    etnia: dados["Etnia"],
    sexo: dados["Sexo"],
    genero: dados["Gênero"],
    data_nascimento: dados["Data de Nascimento"],
    data_admissao: dados["Data de Admissão"],
    data_cadastro: dados["Data de Cadastro"],
    situacao: dados["Situação"],
    ultimo_acesso: dados["Ultimo Acesso"],
    origem_cadastro: dados["Origem do Cadastro"],
    participa_gamificacao: dados["Participa gamificação"],
    desligamento: dados["Desligamento"],
    ultimo_dia_trabalhado: dados["Ultimo dia trabalhado"],
    biografia: dados["Biografia"],
    idioma: dados["Idioma"],
  };
}

// Regra: quem já está no banco prevalece. Duplicado por ID, E-mail ou CPF é ignorado.
// Dentro da própria planilha vale a primeira ocorrência. Cada linha é gravada separadamente.
export async function salvarImportacao(linhas: LinhaImportada[]): Promise<RelatorioImportacao> {
  const existentes = await buscarChavesExistentes();
  const idsVistos = new Set(existentes.map((item) => (item.id_planilha ?? "").trim()));
  const emailsVistos = new Set(existentes.map((item) => (item.email ?? "").trim().toLowerCase()));
  const cpfsVistos = new Set(existentes.map((item) => (item.cpf ?? "").trim()).filter(Boolean));

  const relatorio: RelatorioImportacao = { salvos: 0, duplicados: [], falhas: [] };

  for (const linha of linhas) {
    const nome = linha.nome || "(sem nome)";
    const identificador = linha.dados["ID"] || linha.dados["Email"] || "(sem ID)";
    if (linha.erro) {
      relatorio.falhas.push({ nome, identificador, motivo: linha.erro });
      continue;
    }

    const id = (linha.dados["ID"] ?? "").trim();
    const email = (linha.dados["Email"] ?? "").trim().toLowerCase();
    const cpf = (linha.dados["CPF"] ?? "").trim();

    const motivoDuplicado = idsVistos.has(id)
      ? "ID já cadastrado"
      : emailsVistos.has(email)
        ? "E-mail já cadastrado"
        : cpf && cpfsVistos.has(cpf)
          ? "CPF já cadastrado"
          : null;
    if (motivoDuplicado) {
      relatorio.duplicados.push({ nome, identificador, motivo: motivoDuplicado });
      continue;
    }

    const { error } = await db.from("colaboradores_importados").insert(paraRegistro(linha));
    if (error) {
      relatorio.falhas.push({ nome, identificador, motivo: error.message });
      continue;
    }

    idsVistos.add(id);
    emailsVistos.add(email);
    if (cpf) cpfsVistos.add(cpf);
    relatorio.salvos += 1;
  }

  return relatorio;
}

export const COLABORADORES_POR_PAGINA = 50;

export type PaginaColaboradores = {
  itens: ColaboradorImportado[];
  total: number;
};

// Remove caracteres que quebram o filtro do PostgREST e os curingas do LIKE.
function termoDeBusca(busca: string) {
  return busca.replace(/[,()*%_\\]/g, " ").trim();
}

export type FiltrosColaboradores = {
  busca: string;
  setor: string;
  gestor: string;
  unidade: string;
  // "ativos" na tela principal; "desligados" e "desativados" nos modais; sem valor, não filtra por situação.
  status?: "ativos" | "desligados" | "desativados";
};

// Lista de Cadastro e Desligamento e do modal de desligados: uma página por vez, com os filtros feitos no banco.
export async function listarColaboradoresImportados(
  pagina: number,
  filtros: FiltrosColaboradores,
): Promise<PaginaColaboradores> {
  const termo = termoDeBusca(filtros.busca);
  const inicio = pagina * COLABORADORES_POR_PAGINA;

  let consulta = db
    .from("colaboradores_importados")
    .select("id, nome, cargo, cargo_visivel, departamento, gestor_direto, gestor_direto_email, unidade, foto_url, situacao, desligamento, ultimo_dia_trabalhado", { count: "exact" })
    .order("nome", { ascending: true })
    .order("id", { ascending: true })
    .range(inicio, inicio + COLABORADORES_POR_PAGINA - 1);

  if (filtros.status === "desligados") consulta = aplicarSomenteDesligados(consulta);
  if (filtros.status === "desativados") consulta = aplicarSomenteDesativados(consulta);
  if (filtros.status === "ativos") consulta = aplicarSomenteAtivos(consulta);
  if (termo) {
    consulta = consulta.or(
      `nome.ilike.%${termo}%,departamento.ilike.%${termo}%,gestor_direto.ilike.%${termo}%,unidade.ilike.%${termo}%`,
    );
  }
  if (filtros.setor) consulta = consulta.eq("departamento", filtros.setor);
  if (filtros.gestor) consulta = consulta.eq("gestor_direto", filtros.gestor);
  if (filtros.unidade) consulta = consulta.eq("unidade", filtros.unidade);

  const { data, error, count } = await consulta;
  if (error) throw error;

  const itens: ColaboradorImportado[] = (data ?? []).map((item: Record<string, string | null>) => ({
    id: item["id"] ?? "",
    nome: item["nome"] ?? "",
    cargo: item["cargo_visivel"] || item["cargo"] || "",
    setor: item["departamento"] ?? "",
    gestorDireto: item["gestor_direto"] ?? "",
    gestorDiretoEmail: item["gestor_direto_email"] ?? "",
    gestorDiretoFotoUrl: "",
    unidade: item["unidade"] ?? "",
    fotoUrl: item["foto_url"] ?? "",
    inativo: estaDesligado({ situacao: item["situacao"] ?? null, desligamento: item["desligamento"] ?? null, ultimo_dia_trabalhado: item["ultimo_dia_trabalhado"] ?? null }),
    desativado: estaDesativado({ situacao: item["situacao"] ?? null, desligamento: item["desligamento"] ?? null, ultimo_dia_trabalhado: item["ultimo_dia_trabalhado"] ?? null }),
  }));

  // Foto do gestor: busca só os gestores desta página, pelo nome.
  const gestores = [...new Set(itens.map((item) => item.gestorDireto).filter(Boolean))];
  if (gestores.length > 0) {
    const { data: fotosGestores, error: erroFotos } = await db
      .from("colaboradores_importados")
      .select("nome, foto_url")
      .in("nome", gestores);
    if (erroFotos) throw erroFotos;
    const fotoPorNome = new Map<string, string>();
    (fotosGestores ?? []).forEach((item: Record<string, string | null>) => {
      if (item["nome"] && item["foto_url"]) fotoPorNome.set(item["nome"], item["foto_url"]);
    });
    itens.forEach((item) => {
      item.gestorDiretoFotoUrl = fotoPorNome.get(item.gestorDireto) ?? "";
    });
  }

  return { itens, total: count ?? 0 };
}

export type OpcoesFiltro = {
  setores: string[];
  gestores: string[];
  unidades: string[];
};

// Valores distintos de setor, gestor e unidade, para preencher os filtros.
export async function listarOpcoesFiltro(): Promise<OpcoesFiltro> {
  const setores = new Set<string>();
  const gestores = new Set<string>();
  const unidades = new Set<string>();
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA_BANCO) {
    const { data, error } = await aplicarSomenteAtivos(
      db
        .from("colaboradores_importados")
        .select("id, departamento, gestor_direto, unidade")
        .order("id", { ascending: true })
        .range(inicio, inicio + TAMANHO_PAGINA_BANCO - 1),
    );
    if (error) throw error;
    const lote = data ?? [];
    lote.forEach((item: Record<string, string | null>) => {
      if (item["departamento"]) setores.add(item["departamento"]);
      if (item["gestor_direto"]) gestores.add(item["gestor_direto"]);
      if (item["unidade"]) unidades.add(item["unidade"]);
    });
    if (lote.length < TAMANHO_PAGINA_BANCO) break;
  }
  const ordenar = (valores: Set<string>) => [...valores].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return { setores: ordenar(setores), gestores: ordenar(gestores), unidades: ordenar(unidades) };
}

export type EntradaRanking = {
  nome: string;
  subtitulo: string;
  fotoUrl: string;
};

// Quantidade de posições exibidas no ranking (TOP 10).
export const TOP_RANKING = 10;

// Primeiros colaboradores (ordem alfabética) para o ranking, sem carregar a base inteira.
export async function listarRankingColaboradores(): Promise<EntradaRanking[]> {
  const { data, error } = await aplicarSomenteAtivos(
    db
      .from("colaboradores_importados")
      .select("id, nome, cargo, cargo_visivel, departamento, foto_url")
      .order("nome", { ascending: true })
      .order("id", { ascending: true })
      .range(0, TOP_RANKING - 1),
  );
  if (error) throw error;
  return (data ?? []).map((item: Record<string, string | null>) => ({
    nome: item["nome"] ?? "",
    subtitulo: item["cargo_visivel"] || item["cargo"] || item["departamento"] || "",
    fotoUrl: item["foto_url"] ?? "",
  }));
}

// Posição de um colaborador no ranking completo (1 = primeiro). Conta quantos vêm antes dele, sem trazer a base.
export async function posicaoNoRanking(nome: string): Promise<number | null> {
  if (!nome) return null;
  const { count, error } = await aplicarSomenteAtivos(
    db.from("colaboradores_importados").select("id", { count: "exact", head: true }).lt("nome", nome),
  );
  if (error) throw error;
  return (count ?? 0) + 1;
}

// Gestores da base (valores distintos de Gestor Direto), com a foto de quem for gestor.
export async function listarRankingGestores(): Promise<EntradaRanking[]> {
  const { gestores } = await listarOpcoesFiltro();
  const nomes = gestores.slice(0, TOP_RANKING);
  if (nomes.length === 0) return [];
  const { data, error } = await db
    .from("colaboradores_importados")
    .select("nome, foto_url")
    .in("nome", nomes);
  if (error) throw error;
  const fotoPorNome = new Map<string, string>();
  (data ?? []).forEach((item: Record<string, string | null>) => {
    if (item["nome"] && item["foto_url"]) fotoPorNome.set(item["nome"], item["foto_url"]);
  });
  return nomes.map((nome) => ({ nome, subtitulo: "Gestor", fotoUrl: fotoPorNome.get(nome) ?? "" }));
}

export function baixarModelo() {
  const workbook = XLSX.utils.book_new();
  const planilha = XLSX.utils.aoa_to_sheet([[...COLUNAS_MODELO]]);
  planilha["!cols"] = COLUNAS_MODELO.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(workbook, planilha, "Colaboradores");
  XLSX.writeFile(workbook, "modelo-importacao-colaboradores.xlsx");
}
