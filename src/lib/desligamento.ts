// Situação é texto livre na planilha. Só quem está com a situação "Ativo" aparece nas listas e no organograma.
const REGRA_SITUACAO_ATIVA = /^ativo$/i;
// Afastamento temporário (férias, licença...). Fica no quarto dos desativados, não no dos desligados.
const REGRA_SITUACAO_DESATIVADA = /^desativado$/i;

export type LinhaDesligamento = {
  situacao: string | null;
  desligamento: string | null;
  ultimo_dia_trabalhado: string | null;
};

export function estaDesativado(linha: LinhaDesligamento) {
  return REGRA_SITUACAO_DESATIVADA.test((linha.situacao ?? "").trim());
}

// Pessoa inativa: qualquer situação diferente de "Ativo" (Desligado, vazio...),
// ou com data de desligamento / último dia trabalhado preenchida.
// Quem está "Desativado" não é desligado: fica de fora desta regra.
export function estaDesligado(linha: LinhaDesligamento) {
  if (estaDesativado(linha)) return false;
  return (
    Boolean(linha.desligamento?.trim()) ||
    Boolean(linha.ultimo_dia_trabalhado?.trim()) ||
    !REGRA_SITUACAO_ATIVA.test((linha.situacao ?? "").trim())
  );
}

// Mesma regra de estaDesligado, escrita como filtros do banco. Mantenha as duas alinhadas.
// Vazio e nulo contam como "sem data", igual ao trim() da regra em JS.
// A consulta é do cliente do Supabase, que não está tipado para esta tabela.
export function aplicarSomenteAtivos(consulta: any): any {
  return consulta
    .ilike("situacao", "ativo")
    .or('desligamento.is.null,desligamento.eq.""')
    .or('ultimo_dia_trabalhado.is.null,ultimo_dia_trabalhado.eq.""');
}

// Inverso de aplicarSomenteAtivos, sem quem está desativado: qualquer pessoa que estaDesligado.
// Cada .or() é combinado com AND pelo PostgREST, então o primeiro exclui os desativados.
export function aplicarSomenteDesligados(consulta: any): any {
  return consulta
    .or("situacao.is.null,situacao.not.ilike.desativado")
    .or('situacao.is.null,situacao.not.ilike.ativo,desligamento.neq."",ultimo_dia_trabalhado.neq.""');
}

// Quem está com situação "Desativado" (afastamento temporário).
export function aplicarSomenteDesativados(consulta: any): any {
  return consulta.ilike("situacao", "desativado");
}
