import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, UserRound } from "lucide-react";
import { toast } from "sonner";

import { useUsuarioLogado } from "@/hooks/use-usuario-logado";
import {
  contarNaoLidas,
  listarNotificacoes,
  marcarTodasComoLidas,
  tempoRelativo,
} from "@/lib/notificacoes";
import { cn } from "@/lib/utils";

// Atualiza o contador sozinho, para notificações novas aparecerem sem recarregar a página.
const INTERVALO_ATUALIZACAO_MS = 60_000;

export function NotificacoesPainel() {
  const queryClient = useQueryClient();
  const { data: usuario } = useUsuarioLogado();
  const email = usuario?.email ?? "";
  const [aberto, setAberto] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);

  const { data: naoLidas = 0 } = useQuery({
    queryKey: ["notificacoes-nao-lidas", email],
    queryFn: () => contarNaoLidas(email),
    enabled: Boolean(email),
    refetchInterval: INTERVALO_ATUALIZACAO_MS,
  });

  const { data: lista = [], isPending, isError } = useQuery({
    queryKey: ["notificacoes", email],
    queryFn: () => listarNotificacoes(email),
    enabled: Boolean(email) && aberto,
    placeholderData: keepPreviousData,
  });

  // Fecha o painel ao clicar fora dele.
  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (painelRef.current && !painelRef.current.contains(evento.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  async function marcarTodas() {
    try {
      await marcarTodasComoLidas(email);
      await queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
      await queryClient.invalidateQueries({ queryKey: ["notificacoes-nao-lidas"] });
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível marcar as notificações.");
    }
  }

  return (
    <div ref={painelRef} className="relative">
      <motion.button
        type="button"
        aria-label="Notificações"
        whileHover={{ y: -2, scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        aria-expanded={aberto}
        title="Notificações"
        onClick={() => setAberto((atual) => !atual)}
        className={cn(
          "relative rounded-full p-1.5 transition hover:bg-panel-active hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
          aberto ? "text-white ring-2 ring-brand" : "text-panel-label",
        )}
      >
        <Bell className="size-5" aria-hidden />
        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.6rem] font-bold text-white">
            {naoLidas > 99 ? "99+" : naoLidas}
          </span>
        )}
      </motion.button>

      {aberto && (
        <div className="absolute right-0 top-full z-50 mt-3 flex max-h-[70vh] w-[22rem] flex-col overflow-hidden rounded-xl border border-panel-active bg-panel shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-panel-active px-4 py-3">
            <h2 className="font-display text-sm font-bold text-white">Notificações</h2>
            <button
              type="button"
              onClick={marcarTodas}
              disabled={naoLidas === 0}
              className="rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Marcar todas como lidas
            </button>
          </div>

          <ul className="flex-1 divide-y divide-panel-active/60 overflow-y-auto">
            {isPending ? (
              <li className="px-4 py-8 text-center text-sm text-panel-label">Carregando...</li>
            ) : isError ? (
              <li className="px-4 py-8 text-center text-sm text-panel-label">Não foi possível carregar as notificações.</li>
            ) : lista.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-panel-label">Nenhuma notificação por enquanto.</li>
            ) : (
              lista.map((notificacao) => (
                <li
                  key={notificacao.id}
                  className={cn("flex gap-3 px-4 py-3", notificacao.lida ? "bg-transparent" : "bg-brand/5")}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel-active text-panel-text">
                    {notificacao.atorFotoUrl ? (
                      <img src={notificacao.atorFotoUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <UserRound className="size-5" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white">
                      {notificacao.atorNome && <strong className="font-bold">{notificacao.atorNome} </strong>}
                      <span className="text-white/90">{notificacao.texto}</span>
                    </p>
                    <p className="mt-1 text-xs text-panel-label">{tempoRelativo(notificacao.criadaEm)}</p>
                  </div>
                  {!notificacao.lida && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-label="Não lida" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
