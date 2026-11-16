import { useEffect, useSyncExternalStore } from "react";

import { useUsuarioLogado } from "@/hooks/use-usuario-logado";
import { supabase } from "@/integrations/supabase/client";

// Quem está online: cada pessoa logada entra num canal de presença do Supabase Realtime, com o e-mail como chave.
// O canal é um só para a aplicação inteira, para a lista da Academy e o registro de presença não brigarem.
const NOME_DO_CANAL = "presenca-sistema";

type Canal = ReturnType<typeof supabase.channel>;

const VAZIO: ReadonlySet<string> = new Set();
let canal: Canal | null = null;
let emailAtual = "";
let online: ReadonlySet<string> = VAZIO;
const ouvintes = new Set<() => void>();

// O Supabase devolve o mesmo canal enquanto o nome dele ainda estiver aberto, e não aceita novos "presence"
// depois do subscribe. Por isso cada troca de canal espera o anterior sair por completo, nesta fila.
let fila: Promise<void> = Promise.resolve();

function avisar() {
  for (const ouvinte of ouvintes) ouvinte();
}

function enfileirar(tarefa: () => Promise<void>) {
  fila = fila.then(tarefa).catch(() => {});
}

async function fecharCanal(): Promise<void> {
  const antigo = canal;
  canal = null;
  if (!antigo) return;
  try {
    await supabase.removeChannel(antigo);
  } catch {
    // Se não fechar, a próxima entrada tenta de novo sem quebrar a tela.
  }
}

export function sairDaPresenca() {
  emailAtual = "";
  online = VAZIO;
  avisar();
  enfileirar(fecharCanal);
}

// Entra no canal como esta pessoa. Chamar de novo com o mesmo e-mail não faz nada.
export function entrarNaPresenca(email: string) {
  const chave = email.trim().toLowerCase();
  if (!chave || chave === emailAtual) return;
  emailAtual = chave;
  online = VAZIO;
  avisar();

  enfileirar(async () => {
    await fecharCanal();
    // Se outra pessoa entrou enquanto este pedido esperava na fila, ele já não vale.
    if (emailAtual !== chave) return;

    const novo = supabase.channel(NOME_DO_CANAL, { config: { presence: { key: chave } } });
    canal = novo;
    try {
      novo.on("presence", { event: "sync" }, () => {
        if (canal !== novo) return;
        online = new Set(Object.keys(novo.presenceState()));
        avisar();
      });
      novo.subscribe((status) => {
        if (status === "SUBSCRIBED") void novo.track({ desde: new Date().toISOString() });
      });
    } catch (erro) {
      // Nunca deixa a presença derrubar a barra lateral; a lista só fica sem os online.
      console.error("Não consegui entrar no canal de presença:", erro);
    }
  });
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

// Os e-mails (em minúsculas) de quem está online agora.
export function usePresenca(): ReadonlySet<string> {
  return useSyncExternalStore(
    assinar,
    () => online,
    () => VAZIO,
  );
}

// Registra a presença de quem está logado. Fica no menu lateral, que aparece em todas as páginas.
export function useRegistrarPresenca() {
  const { data: usuario } = useUsuarioLogado();
  const email = usuario?.email;
  useEffect(() => {
    if (email) entrarNaPresenca(email);
  }, [email]);
}
