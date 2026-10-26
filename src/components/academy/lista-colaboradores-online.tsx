import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { listarTodosColaboradores } from "@/lib/colaboradores-diretorio";
import { getIniciais } from "@/lib/iniciais";
import { usePresenca } from "@/lib/presenca";
import { cn } from "@/lib/utils";

// Lista no estilo de mensageiro: foto, nome e uma bolinha (verde online, cinza offline). Quem está online vem primeiro.
export function ListaColaboradoresOnline() {
  const [busca, setBusca] = useState("");
  const online = usePresenca();
  const consulta = useQuery({
    queryKey: ["todos-colaboradores"],
    queryFn: listarTodosColaboradores,
  });

  const { lista, totalOnline } = useMemo(() => {
    const todos = (consulta.data ?? []).map((c) => ({
      ...c,
      online: online.has(c.email.trim().toLowerCase()),
    }));
    const termo = busca.trim().toLowerCase();
    const filtrados = termo ? todos.filter((c) => c.nome.toLowerCase().includes(termo)) : todos;
    return {
      lista: [...filtrados].sort(
        (a, b) => Number(b.online) - Number(a.online) || a.nome.localeCompare(b.nome, "pt-BR"),
      ),
      totalOnline: todos.filter((c) => c.online).length,
    };
  }, [consulta.data, online, busca]);

  return (
    <aside
      aria-label="Colaboradores"
      className="flex max-h-[28rem] w-full shrink-0 flex-col rounded-2xl border border-panel-active bg-panel lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:w-72 lg:self-start 2xl:w-80"
    >
      <header className="border-b border-panel-active p-4">
        <h2 className="font-display text-base font-semibold text-white">Colaboradores</h2>
        <p className="mt-0.5 text-xs text-white/60">
          {totalOnline} online · {consulta.data?.length ?? 0} no total
        </p>
        <label className="relative mt-3 block">
          <span className="sr-only">Buscar colaborador</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50"
            aria-hidden
          />
          <input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar"
            className="h-9 w-full rounded-lg border border-panel-active bg-background pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-brand"
          />
        </label>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {consulta.isError ? (
          <p className="p-3 text-sm text-red-400">Não consegui carregar os colaboradores.</p>
        ) : consulta.isPending ? (
          <p className="p-3 text-sm text-white/60">Carregando…</p>
        ) : lista.length === 0 ? (
          <p className="p-3 text-sm text-white/60">Ninguém encontrado.</p>
        ) : (
          <ul>
            {lista.map((colaborador) => (
              <li
                key={colaborador.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-panel-active/50"
              >
                <span className="relative shrink-0">
                  <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-panel-active text-sm font-bold text-panel-text">
                    {colaborador.fotoUrl ? (
                      <img src={colaborador.fotoUrl} alt="" className="size-full object-cover" />
                    ) : (
                      getIniciais(colaborador.nome) || "—"
                    )}
                  </span>
                  <span
                    role="img"
                    aria-label={colaborador.online ? "Online" : "Offline"}
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full ring-2 ring-panel",
                      colaborador.online ? "bg-green-500" : "bg-slate-500",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "min-w-0 truncate text-sm",
                    colaborador.online ? "font-medium text-white" : "text-white/70",
                  )}
                >
                  {colaborador.nome}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
