import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import {
  COLABORADORES_POR_PAGINA,
  listarColaboradoresImportados,
  type FiltrosColaboradores,
} from "@/lib/importacao-colaboradores";
import type { IdentificadorColaborador } from "@/components/painel/detalhes-colaborador-dialog";

const CAMPO =
  "h-10 rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand";

const COLUNAS = ["Nome", "Cargo", "Setor", "Gestor Direto", "Unidade"];

// Textos de cada quarto. "desligados" e "desativados" usam a mesma tela, só muda o que aparece.
const TEXTOS_QUARTO = {
  desligados: {
    titulo: "Desligados",
    descricao: "Colaboradores inativos ou com data de desligamento.",
    busca: "Buscar desligado por nome",
    carregando: "Carregando desligados...",
    erro: "Não foi possível carregar os desligados.",
    vazio: "Nenhum desligado encontrado.",
    contagem: "desligado(s)",
  },
  desativados: {
    titulo: "Desativados",
    descricao: "Colaboradores afastados temporariamente (férias, licença, lua de mel...).",
    busca: "Buscar desativado por nome",
    carregando: "Carregando desativados...",
    erro: "Não foi possível carregar os desativados.",
    vazio: "Nenhum desativado encontrado.",
    contagem: "desativado(s)",
  },
} as const;

// Quarto dos desligados ou dos desativados: lista separada da tela principal, só com quem não está ativo.
export function DesligadosDialog({
  aberto,
  status,
  onFechar,
  onDetalhe,
}: {
  aberto: boolean;
  status: "desligados" | "desativados";
  onFechar: () => void;
  onDetalhe: (identificador: IdentificadorColaborador) => void;
}) {
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(0);
  const textos = TEXTOS_QUARTO[status];

  // Espera a pessoa parar de digitar antes de consultar o banco.
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaAplicada(busca.trim());
      setPagina(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  const filtros: FiltrosColaboradores = { busca: buscaAplicada, setor: "", gestor: "", unidade: "", status };

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ["colaboradores-importados", status, pagina, filtros],
    queryFn: () => listarColaboradoresImportados(pagina, filtros),
    placeholderData: keepPreviousData,
    enabled: aberto,
  });

  if (!aberto) return null;

  const colaboradores = data?.itens ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / COLABORADORES_POR_PAGINA));

  function fechar() {
    setBusca("");
    setPagina(0);
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`titulo-${status}`}
        className="flex max-h-[85vh] w-full max-w-5xl flex-col rounded-2xl border border-panel-active bg-panel p-6 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id={`titulo-${status}`} className="font-display text-2xl font-semibold text-white">
              {textos.titulo}
            </h2>
            <p className="mt-1 text-sm text-white/80">{textos.descricao}</p>
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="rounded-md p-2 text-white/80 transition hover:bg-panel-active hover:text-brand"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <label className="relative mt-5 block w-full max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" aria-hidden />
          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder={textos.busca}
            aria-label={textos.busca}
            className={`${CAMPO} w-full pl-10 pr-3`}
          />
        </label>

        <div className="mt-5 min-h-0 flex-1 overflow-auto rounded-xl border border-panel-active">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead className="sticky top-0 bg-panel">
              <tr className="border-b border-panel-active text-left text-xs font-semibold text-white/80">
                {COLUNAS.map((coluna) => (
                  <th key={coluna} className="px-4 py-3">
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td colSpan={COLUNAS.length} className="py-12 text-center text-white/80">
                    {textos.carregando}
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={COLUNAS.length} className="py-12 text-center text-white/80">
                    {textos.erro}
                  </td>
                </tr>
              ) : colaboradores.length === 0 ? (
                <tr>
                  <td colSpan={COLUNAS.length} className="py-12 text-center text-white/80">
                    {textos.vazio}
                  </td>
                </tr>
              ) : (
                colaboradores.map((colaborador) => (
                  <tr key={colaborador.id} className="border-b border-panel-active/60 text-white">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onDetalhe({ id: colaborador.id })}
                        className="text-left hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        {colaborador.nome || "—"}
                      </button>
                    </td>
                    <td className="px-4 py-3">{colaborador.cargo || "—"}</td>
                    <td className="px-4 py-3">{colaborador.setor || "—"}</td>
                    <td className="px-4 py-3">{colaborador.gestorDireto || "—"}</td>
                    <td className="px-4 py-3">{colaborador.unidade || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
          <span>
            {total} {textos.contagem} · página {pagina + 1} de {totalPaginas}
            {isFetching && !isPending ? " · atualizando..." : ""}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPagina((atual) => Math.max(0, atual - 1))}
              disabled={pagina === 0 || isPending}
              className="rounded-lg border border-panel-active px-4 py-2 font-semibold text-white transition hover:bg-panel-active disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPagina((atual) => atual + 1)}
              disabled={pagina + 1 >= totalPaginas || isPending}
              className="rounded-lg border border-panel-active px-4 py-2 font-semibold text-white transition hover:bg-panel-active disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
