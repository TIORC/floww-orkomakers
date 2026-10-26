import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

export type ColunaGrade<L> = {
  chave: string;
  titulo: string;
  editavel: boolean;
  // Texto "cru" da célula: é o que aparece ao editar e o que vai para a área de transferência.
  texto: (linha: L) => string;
  // Como a célula aparece quando não está sendo editada. Sem isso, mostra o texto.
  exibir?: (linha: L) => ReactNode;
  classe?: ((linha: L) => string | undefined) | undefined;
  // Ação ao clicar na célula (ou apertar Enter nela), para colunas que abrem algo, como o nome do colaborador.
  aoClicar?: ((linha: L) => void) | undefined;
};

type Props<L> = {
  linhas: L[];
  colunas: ColunaGrade<L>[];
  chaveLinha: (linha: L) => string;
  // Devolve uma mensagem de erro quando o valor não vale; a célula então mantém o valor anterior.
  aoEditar: (linha: L, chave: string, valor: string) => string | null;
  rodape?: ReactNode;
  vazio: ReactNode;
};

function limitar(valor: number, maximo: number) {
  return Math.max(0, Math.min(valor, maximo));
}

// Tabela editável no estilo planilha: célula selecionada, setas, Enter/Tab/F2, digitar para sobrescrever,
// Delete para limpar, duplo clique para editar e copiar/colar (inclusive vários valores vindos do Excel).
export function GradeEditavel<L>({
  linhas,
  colunas,
  chaveLinha,
  aoEditar,
  rodape,
  vazio,
}: Props<L>) {
  const [selecao, setSelecao] = useState({ linha: 0, coluna: 0 });
  // A célula em edição é lembrada à parte da seleção: clicar em outra célula no meio da edição grava na certa.
  const [edicao, setEdicao] = useState<{ linha: number; coluna: number; valor: string } | null>(
    null,
  );
  const grade = useRef<HTMLDivElement>(null);
  // O blur do campo dispara também quando o Enter o remove da tela; este marcador evita confirmar duas vezes.
  const editando = useRef(false);

  const ultimaLinha = linhas.length - 1;
  const ultimaColuna = colunas.length - 1;
  const linha = limitar(selecao.linha, ultimaLinha);
  const coluna = limitar(selecao.coluna, ultimaColuna);
  const colunaAtual = colunas[coluna];

  useEffect(() => {
    grade.current
      ?.querySelector('[data-selecionada="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [linha, coluna]);

  if (linhas.length === 0 || !colunaAtual) {
    return (
      <div className="rounded-xl border border-panel-active py-12 text-center text-white/80">
        {vazio}
      </div>
    );
  }

  function focar() {
    queueMicrotask(() => grade.current?.focus());
  }

  function mover(dLinha: number, dColuna: number) {
    setSelecao({
      linha: limitar(linha + dLinha, ultimaLinha),
      coluna: limitar(coluna + dColuna, ultimaColuna),
    });
  }

  function iniciarEdicao(valor: string) {
    if (!colunaAtual?.editavel) return;
    editando.current = true;
    setEdicao({ linha, coluna, valor });
  }

  function aplicar(linhaAlvo: number, colunaAlvo: number, valor: string) {
    const alvo = linhas[linhaAlvo];
    const coluna = colunas[colunaAlvo];
    if (!alvo || !coluna?.editavel) return null;
    return aoEditar(alvo, coluna.chave, valor);
  }

  function confirmar(valor: string, dLinha: number, dColuna: number) {
    if (!editando.current) return;
    editando.current = false;
    const erro = edicao ? aplicar(edicao.linha, edicao.coluna, valor) : null;
    setEdicao(null);
    if (erro) toast.error(erro);
    else mover(dLinha, dColuna);
    focar();
  }

  function cancelar() {
    editando.current = false;
    setEdicao(null);
    focar();
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (editando.current) return;
    const { key } = evento;
    const atalho = evento.ctrlKey || evento.metaKey || evento.altKey;
    const movimentos: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      Tab: [0, evento.shiftKey ? -1 : 1],
    };
    const movimento = movimentos[key];
    if (movimento) {
      // Tab na última célula deixa o foco sair da grade, como em qualquer página.
      const saindo =
        key === "Tab" &&
        (evento.shiftKey
          ? linha === 0 && coluna === 0
          : linha === ultimaLinha && coluna === ultimaColuna);
      if (saindo) return;
      evento.preventDefault();
      // Tab no fim da linha continua na linha de baixo.
      if (key === "Tab" && !evento.shiftKey && coluna === ultimaColuna)
        setSelecao({ linha: linha + 1, coluna: 0 });
      else if (key === "Tab" && evento.shiftKey && coluna === 0)
        setSelecao({ linha: linha - 1, coluna: ultimaColuna });
      else mover(...movimento);
    } else if (key === "Enter" || key === "F2") {
      evento.preventDefault();
      if (colunaAtual?.aoClicar) colunaAtual.aoClicar(linhas[linha] as L);
      else iniciarEdicao(colunaAtual?.texto(linhas[linha] as L) ?? "");
    } else if (key === "Delete" || key === "Backspace") {
      evento.preventDefault();
      const erro = aplicar(linha, coluna, "");
      if (erro) toast.error(erro);
    } else if (key.length === 1 && !atalho) {
      evento.preventDefault();
      iniciarEdicao(key);
    }
  }

  function aoCopiar(evento: ClipboardEvent<HTMLDivElement>) {
    if (editando.current) return;
    evento.preventDefault();
    evento.clipboardData.setData("text/plain", colunaAtual?.texto(linhas[linha] as L) ?? "");
  }

  // Cola a partir da célula selecionada: linhas por quebra de linha e colunas por tabulação, como no Excel.
  function aoColar(evento: ClipboardEvent<HTMLDivElement>) {
    if (editando.current) return;
    evento.preventDefault();
    const blocos = evento.clipboardData
      .getData("text/plain")
      .replace(/\r/g, "")
      .replace(/\n$/, "")
      .split("\n")
      .map((registro) => registro.split("\t"));
    let primeiroErro: string | null = null;
    blocos.forEach((valores, i) => {
      valores.forEach((valor, j) => {
        const erro = aplicar(linha + i, coluna + j, valor);
        primeiroErro ??= erro;
      });
    });
    if (primeiroErro) toast.error(primeiroErro);
  }

  return (
    <div
      ref={grade}
      role="grid"
      tabIndex={0}
      aria-label="Tabela de banco de horas editável"
      onKeyDown={aoTeclar}
      onCopy={aoCopiar}
      onPaste={aoColar}
      className="max-h-[70vh] overflow-auto rounded-xl border border-panel-active outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-panel">
          <tr className="text-left text-xs font-semibold text-white/80">
            {colunas.map((c) => (
              <th key={c.chave} className="border border-panel-active px-3 py-2.5">
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={chaveLinha(l)} className="text-white">
              {colunas.map((c, j) => {
                const selecionada = i === linha && j === coluna;
                return (
                  <td
                    key={c.chave}
                    role="gridcell"
                    aria-selected={selecionada}
                    data-selecionada={selecionada}
                    onMouseDown={() => setSelecao({ linha: i, coluna: j })}
                    onClick={() => c.aoClicar?.(l)}
                    onDoubleClick={() => {
                      setSelecao({ linha: i, coluna: j });
                      if (c.editavel) {
                        editando.current = true;
                        setEdicao({ linha: i, coluna: j, valor: c.texto(l) });
                      }
                    }}
                    className={cn(
                      "h-10 border border-panel-active/60 p-0 align-middle",
                      !c.editavel && "bg-white/[0.03] text-white/80",
                      selecionada && "outline outline-2 -outline-offset-2 outline-brand",
                      c.classe?.(l),
                    )}
                  >
                    {edicao?.linha === i && edicao.coluna === j ? (
                      <input
                        autoFocus
                        value={edicao.valor}
                        aria-label={c.titulo}
                        onChange={(evento) => setEdicao({ ...edicao, valor: evento.target.value })}
                        onFocus={(evento) =>
                          evento.target.setSelectionRange(
                            evento.target.value.length,
                            evento.target.value.length,
                          )
                        }
                        onBlur={(evento) => confirmar(evento.target.value, 0, 0)}
                        onKeyDown={(evento) => {
                          evento.stopPropagation();
                          if (evento.key === "Enter") {
                            evento.preventDefault();
                            confirmar(evento.currentTarget.value, 1, 0);
                          } else if (evento.key === "Tab") {
                            evento.preventDefault();
                            confirmar(evento.currentTarget.value, 0, evento.shiftKey ? -1 : 1);
                          } else if (evento.key === "Escape") {
                            evento.preventDefault();
                            cancelar();
                          }
                        }}
                        className="h-10 w-full bg-background px-3 text-sm text-white outline-none"
                      />
                    ) : (
                      <div className="flex h-10 items-center whitespace-pre px-3">
                        {c.exibir ? c.exibir(l) : c.texto(l)}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {rodape && <tfoot className="sticky bottom-0 bg-panel">{rodape}</tfoot>}
      </table>
    </div>
  );
}
