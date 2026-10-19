import { useRef, useState, type ChangeEvent } from "react";
import { Download, FileSpreadsheet, X } from "lucide-react";
import { toast } from "sonner";

import { baixarModelo, lerPlanilha, type LinhaImportada } from "@/lib/importacao-colaboradores";
import { cn } from "@/lib/utils";

const PREVIA_LIMITE = 10;

export function ImportarColaboradoresDialog({
  aberto,
  onFechar,
  onImportar,
}: {
  aberto: boolean;
  onFechar: () => void;
  onImportar: (linhas: LinhaImportada[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [linhas, setLinhas] = useState<LinhaImportada[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [lendo, setLendo] = useState(false);

  if (!aberto) return null;

  const validas = linhas.filter((linha) => !linha.erro);
  const invalidas = linhas.length - validas.length;

  async function aoSelecionarArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    if (!/\.(xlsx|xls|csv)$/i.test(arquivo.name)) {
      toast.error("Selecione uma planilha do Excel (.xlsx, .xls ou .csv).");
      return;
    }
    setLendo(true);
    try {
      const resultado = await lerPlanilha(arquivo);
      if (resultado.length === 0) {
        toast.error("A planilha está vazia.");
        setLinhas([]);
        setNomeArquivo("");
        return;
      }
      setLinhas(resultado);
      setNomeArquivo(arquivo.name);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível ler a planilha.");
      setLinhas([]);
      setNomeArquivo("");
    } finally {
      setLendo(false);
    }
  }

  function confirmar() {
    if (validas.length === 0) return;
    onImportar(validas);
    toast.success(`${validas.length} colaborador(es) importado(s).`);
    setLinhas([]);
    setNomeArquivo("");
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="importar-colaboradores-titulo"
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-panel-active bg-panel p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onFechar}
          className="absolute right-4 top-4 rounded-md p-1.5 text-white/80 transition hover:bg-panel-active hover:text-white"
        >
          <X className="size-5" aria-hidden />
        </button>

        <h2 id="importar-colaboradores-titulo" className="font-display text-xl font-semibold text-white">
          Importar Colaboradores (Planilha)
        </h2>
        <p className="mt-2 text-sm text-white/80">
          Envie uma planilha do Excel (.xlsx, .xls ou .csv) com a primeira linha de cabeçalho. As colunas são
          reconhecidas pelo nome, em qualquer ordem, e as vazias podem ser omitidas. Obrigatórias: ID, Nome (ou Nome
          Completo) e Email.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={aoSelecionarArquivo}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={lendo}
            className="inline-flex items-center gap-2 rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10 disabled:opacity-60"
          >
            <FileSpreadsheet className="size-4" aria-hidden />
            {lendo ? "Lendo planilha..." : "Selecionar planilha"}
          </button>
          <button
            type="button"
            onClick={baixarModelo}
            className="inline-flex items-center gap-2 rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
          >
            <Download className="size-4" aria-hidden />
            Baixar modelo
          </button>
        </div>

        {linhas.length === 0 ? (
          <div className="mt-5 flex min-h-32 items-center justify-center rounded-xl border border-dashed border-panel-active p-6 text-center text-sm text-white/80">
            Nenhuma planilha selecionada. Escolha um arquivo para ver o preview aqui.
          </div>
        ) : (
          <div className="mt-5">
            <p className="mb-2 text-xs text-white/80">
              {nomeArquivo} · {validas.length} linha(s) válida(s), {invalidas} com erro
            </p>
            <div className="overflow-x-auto rounded-xl border border-panel-active">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-panel-active text-left text-xs font-semibold text-white/80">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Setor</th>
                    <th className="px-3 py-2">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.slice(0, PREVIA_LIMITE).map((linha, indice) => (
                    <tr key={indice} className="border-b border-panel-active/60 text-white">
                      <td className="px-3 py-2">{linha.dados["ID"] || "—"}</td>
                      <td className="px-3 py-2">{linha.nome || "—"}</td>
                      <td className="px-3 py-2">{linha.dados["Email"] || "—"}</td>
                      <td className="px-3 py-2">{linha.setor || "—"}</td>
                      <td className={cn("px-3 py-2", linha.erro ? "text-destructive" : "text-brand")}>
                        {linha.erro ?? "Válida"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {linhas.length > PREVIA_LIMITE ? (
              <p className="mt-2 text-xs text-white/70">Mostrando {PREVIA_LIMITE} de {linhas.length} linhas.</p>
            ) : null}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={validas.length === 0}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Importar {validas.length} colaborador(es)
          </button>
        </div>
      </div>
    </div>
  );
}
