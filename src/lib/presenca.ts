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

function avisar() {
  for (const ouvinte of ouvintes) ouvinte();
}

export function sairDaPresenca() {
  if (canal) void supabase.removeChannel(canal);
  canal = null;
  emailAtual = "";
  online = VAZIO;
  avisar();
}

// Entra no canal como esta pessoa. Chamar de novo com o mesmo e-mail não faz nada.
export function entrarNaPresenca(email: string) {
  const chave = email.trim().toLowerCase();
  if (!chave || chave === emailAtual) return;
  sairDaPresenca();
  emailAtual = chave;

  const novo = supabase.channel(NOME_DO_CANAL, { config: { presence: { key: chave } } });
  novo.on("presence", { event: "sync" }, () => {
    online = new Set(Object.keys(novo.presenceState()));
    avisar();
  });
  novo.subscribe((status) => {
    if (status === "SUBSCRIBED") void novo.track({ desde: new Date().toISOString() });
  });
  canal = novo;
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
