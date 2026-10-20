// Situação é texto livre na planilha. Só quem está com a situação "Ativo" aparece nas listas e no organograma.
const REGRA_SITUACAO_ATIVA = /^ativo$/i;

export type LinhaDesligamento = {
  situacao: string | null;
  desligamento: string | null;
  ultimo_dia_trabalhado: string | null;
};

// Pessoa inativa: qualquer situação diferente de "Ativo" (Desligado, Desativado, vazio...),
// ou com data de desligamento / último dia trabalhado preenchida.
export function estaDesligado(linha: LinhaDesligamento) {
  return (
    Boolean(linha.desligamento?.trim()) ||
    Boolean(linha.ultimo_dia_trabalhado?.trim()) ||
    !REGRA_SITUACAO_ATIVA.test((linha.situacao ?? "").trim())
  );
}

// Mesma regra de estaDesligado, escrita como filtro do banco. Mantenha as duas alinhadas.
// A consulta é do cliente do Supabase, que não está tipado para esta tabela.
export function aplicarSomenteAtivos(consulta: any): any {
  return consulta
    .ilike("situacao", "ativo")
    .eq("desligamento", "")
    .eq("ultimo_dia_trabalhado", "");
}
