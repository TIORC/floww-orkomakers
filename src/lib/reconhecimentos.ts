import { supabase } from "@/integrations/supabase/client";

export type TipoMencao = "pessoa" | "setor" | "todos";
// valor: e-mail (pessoa), nome do setor (setor) ou "todos". rotulo: texto exibido após o @.
export type Mencao = { tipo: TipoMencao; valor: string; rotulo: string; fotoUrl?: string | null };

export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ\s._-]/g, "")
    .toLowerCase();
}

// Recebida = marcou @todos, o seu e-mail ou o seu setor.
export function ehParaMim(mencoes: Mencao[], email: string, setor: string) {
  return mencoes.some(
    (mencao) =>
      mencao.tipo === "todos" ||
      (mencao.tipo === "pessoa" && mencao.valor.toLowerCase() === email) ||
      (mencao.tipo === "setor" && Boolean(setor) && normalizar(mencao.valor) === normalizar(setor)),
  );
}

// Trimestre do calendário em que estamos: [inicio, fim).
export function trimestreAtual(agora: Date = new Date()) {
  const primeiroMes = Math.floor(agora.getMonth() / 3) * 3;
  const inicio = new Date(agora.getFullYear(), primeiroMes, 1);
  const fim = new Date(agora.getFullYear(), primeiroMes + 3, 1);
  const numero = Math.floor(agora.getMonth() / 3) + 1;
  return { inicio, fim, rotulo: `${numero}º trimestre · ${agora.getFullYear()}` };
}

// Conta as publicações do trimestre em que a pessoa foi marcada (recebidas) e as que ela publicou (enviadas).
export async function contarReconhecimentosTrimestre(email: string, setor: string) {
  const { inicio, fim } = trimestreAtual();
  const emailMinusculo = email.toLowerCase();
  const { data, error } = await supabase
    .from("reconhecimentos")
    .select("autor_email, reconhecimento_mencoes(tipo, valor)")
    .gte("criado_em", inicio.toISOString())
    .lt("criado_em", fim.toISOString());
  if (error) throw error;

  let recebidos = 0;
  let enviados = 0;
  for (const linha of data ?? []) {
    const mencoes: Mencao[] = (linha.reconhecimento_mencoes ?? []).map((mencao) => ({
      tipo: mencao.tipo as TipoMencao,
      valor: mencao.valor,
      rotulo: "",
    }));
    if (ehParaMim(mencoes, emailMinusculo, setor)) recebidos += 1;
    if (linha.autor_email.toLowerCase() === emailMinusculo) enviados += 1;
  }
  return { recebidos, enviados };
}
