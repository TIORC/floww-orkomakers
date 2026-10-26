// O departamento é guardado como texto livre, então o mesmo setor aparece com grafias diferentes
// ("TI", "Departamento TI", "TI / Desenvolvimento", "Departamento TI/Desenvolvimento"). Aqui elas são agrupadas.

// Grafias que são o mesmo setor mesmo depois de limpar o texto.
const SINONIMOS: Record<string, string> = { tidesenvolvimento: "ti" };

// Compara ignorando o prefixo "Departamento", acentos, maiúsculas, espaços e pontuação.
export function chaveDoSetor(nome: string): string {
  const chave = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/departamento/g, "")
    .replace(/[^a-z0-9]/g, "");
  return SINONIMOS[chave] ?? chave;
}

export type SetorAgrupado = {
  chave: string;
  // O nome mostrado: entre as grafias, a que começa com "Departamento"; se empatar, a mais completa.
  rotulo: string;
  // Todas as grafias que existem no cadastro, para buscar as pessoas de qualquer uma.
  variantes: string[];
};

export function agruparSetores(nomes: string[]): SetorAgrupado[] {
  const grupos = new Map<string, string[]>();
  for (const nome of nomes) {
    const limpo = nome.trim();
    if (!limpo) continue;
    const chave = chaveDoSetor(limpo);
    if (!chave) continue;
    const variantes = grupos.get(chave) ?? [];
    if (!variantes.includes(limpo)) variantes.push(limpo);
    grupos.set(chave, variantes);
  }

  const pontuar = (nome: string) => (/^departamento\b/i.test(nome) ? 1000 : 0) + nome.length;
  return [...grupos.entries()]
    .map(([chave, variantes]) => ({
      chave,
      rotulo: [...variantes].sort((a, b) => pontuar(b) - pontuar(a))[0] ?? "",
      variantes,
    }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}
