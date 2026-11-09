import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { EspelhoDiaADiaDialog } from "@/components/banco-de-horas/espelho-dia-a-dia-dialog";
import { ZonaDeArquivos } from "@/components/banco-de-horas/zona-de-arquivos";
import { GradeEditavel, type ColunaGrade } from "@/components/banco-de-horas/grade-editavel";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import {
  abrirNovosPeriodos,
  atualizarEspelho,
  bancoDeHoras,
  carregarEspelhos,
  encadearSaldos,
  excluirEspelho,
  rotuloMes,
  salvarEspelhos,
  type CampoEditavel,
  type EspelhoSalvo,
} from "@/lib/banco-horas";
import {
  formatarHorario,
  formatarHorarioComSinal,
  formatarTotal,
  lerEspelhoDoArquivo,
  textoParaMinutos,
  textoParaMinutosComSinal,
  textoParaMinutosNegativo,
} from "@/lib/espelho-ponto";
import { emParalelo } from "@/lib/em-paralelo";
import { exportarBancoDeHoras, tituloDoMes } from "@/lib/exportar-banco-horas";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/banco-de-horas")({
  head: () => ({
    meta: [{ title: "Banco de Horas — Orcoma Orkomakers" }],
  }),
  component: BancoDeHorasPage,
});

// Total de horas em destaque: o número grande e as unidades (h, min) menores e mais discretas.
function TotalHoras({ minutos }: { minutos: number }) {
  const unidade = "text-base font-medium text-white/60";
  return (
    <>
      {Math.floor(minutos / 60).toLocaleString("pt-BR")}
      <span className={cn(unidade, "ml-1 mr-2")}>h</span>
      {String(minutos % 60).padStart(2, "0")}
      <span className={cn(unidade, "ml-1")}>min</span>
    </>
  );
}

// Cada linha da planilha é um espelho: um colaborador em um período.
type LinhaGrade = EspelhoSalvo;

const TODOS = "todos";
const CHAVE_CONSULTA = ["banco-de-horas"];

const CAMPO =
  "h-10 rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50";

const VAZIO = <span className="text-white/40">—</span>;

// Saldo com sinal explícito: +15:40 ou -10:21.
function comSinal(minutos: number) {
  return `${minutos < 0 ? "-" : "+"}${formatarHorario(Math.abs(minutos))}`;
}

// Horas para compensar: positivo em verde, negativo em vermelho escuro.
function corCompensacao(linha: LinhaGrade) {
  if (linha.compensar > 0) return "font-semibold text-emerald-400";
  if (linha.compensar < 0) return "font-semibold text-red-600";
  return undefined;
}

// Horas lidas do PDF. Elas podem ser corrigidas na tabela; digita-se HH:MM (ex.: 79:00).
function colunaDeHoras(
  chave: "horasExtras" | "horasFaltas" | "trabalhado",
  titulo: string,
): ColunaGrade<LinhaGrade> {
  return {
    chave,
    titulo,
    editavel: true,
    texto: (linha) => formatarHorario(linha[chave]),
    exibir: (linha) => formatarHorario(linha[chave]) || VAZIO,
  };
}

// As colunas seguem a planilha do banco de horas.
function montarColunas(abrirEspelho: (linha: LinhaGrade) => void): ColunaGrade<LinhaGrade>[] {
  return [
    {
      chave: "funcionario",
      titulo: "Funcionário",
      editavel: false,
      texto: (linha) => linha.funcionario,
      // Clicar no nome abre o espelho dia a dia da pessoa.
      exibir: (linha) => (
        <span
          title="Abrir o espelho de ponto dia a dia"
          className="cursor-pointer underline-offset-4 hover:text-brand hover:underline"
        >
          {linha.funcionario}
        </span>
      ),
      aoClicar: (linha) => abrirEspelho(linha),
    },
    {
      chave: "departamento",
      titulo: "Departamento",
      editavel: false,
      texto: (linha) => linha.departamento,
      exibir: (linha) => linha.departamento || VAZIO,
    },
    {
      chave: "saldoAnterior",
      titulo: "Saldo anterior",
      editavel: true,
      // Automático (banco de horas do mês anterior) até o RH digitar. Digita-se +15:40 ou -10:21 (sem sinal vale
      // positivo; o (-) da planilha também funciona). Apagar a célula volta para o automático.
      texto: (linha) => formatarHorarioComSinal(linha.saldoAnterior),
      exibir: (linha) => {
        const valor = formatarHorarioComSinal(linha.saldoAnterior) || VAZIO;
        return linha.saldoManual === null ? (
          <span title="Calculado: banco de horas do mês anterior. Digite para substituir; apague para voltar ao automático.">
            {valor}
          </span>
        ) : (
          valor
        );
      },
      classe: (linha) => (linha.saldoManual === null ? "italic text-white/60" : undefined),
    },
    colunaDeHoras("horasExtras", "Horas extras"),
    colunaDeHoras("horasFaltas", "Horas faltas"),
    colunaDeHoras("trabalhado", "Horas trabalhadas"),
    {
      chave: "pagarDescontar",
      titulo: "Horas pagar / descontar",
      editavel: true,
      // Só existe saldo negativo aqui: digitar 1:03 já vale -1:03.
      texto: (linha) => formatarHorarioComSinal(linha.pagarDescontar),
      exibir: (linha) => formatarHorarioComSinal(linha.pagarDescontar) || VAZIO,
      classe: (linha) => (linha.pagarDescontar < 0 ? "font-semibold text-red-600" : undefined),
    },
    {
      chave: "banco",
      titulo: "Banco de horas",
      editavel: false,
      texto: (linha) => comSinal(bancoDeHoras(linha)),
      // Positivo em verde escuro, negativo em vermelho escuro.
      classe: (linha) => {
        const banco = bancoDeHoras(linha);
        if (banco > 0) return "font-semibold text-emerald-600";
        if (banco < 0) return "font-semibold text-red-600";
        return undefined;
      },
    },
    {
      chave: "compensar",
      titulo: "Horas para compensar",
      editavel: true,
      // Digita-se +13:00 ou -13:00 (sem sinal vale positivo).
      texto: (linha) => formatarHorarioComSinal(linha.compensar),
      exibir: (linha) => formatarHorarioComSinal(linha.compensar) || VAZIO,
      classe: corCompensacao,
    },
    {
      chave: "observacao",
      titulo: "Observações",
      editavel: true,
      texto: (linha) => linha.observacao,
      exibir: (linha) => linha.observacao || VAZIO,
    },
  ];
}

function BancoDeHorasPage() {
  const clienteConsultas = useQueryClient();
  const [espelhoAberto, setEspelhoAberto] = useState<EspelhoSalvo | null>(null);
  const colunas = useMemo(() => montarColunas(setEspelhoAberto), []);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [importando, setImportando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [progresso, setProgresso] = useState<{ lidos: number; total: number } | null>(null);
  const [mesEscolhido, setMesEscolhido] = useState<string | null>(null);
  const [colaboradorEscolhido, setColaboradorEscolhido] = useState(TODOS);

  const consulta = useQuery({ queryKey: CHAVE_CONSULTA, queryFn: carregarEspelhos });
  // Saldo anterior de cada mês = banco de horas do mês anterior, a menos que o RH tenha digitado outro valor.
  const espelhos = useMemo(() => encadearSaldos(consulta.data ?? []), [consulta.data]);

  // Quando um período novo começa (21/10 para o ciclo 21/09 a 20/10), abre o período para todos, zerado.
  const periodosVerificados = useRef(false);
  useEffect(() => {
    if (!consulta.data || periodosVerificados.current) return;
    periodosVerificados.current = true;
    const hoje = new Date().toLocaleDateString("sv-SE");
    abrirNovosPeriodos(consulta.data, hoje)
      .then((abertos) => {
        if (abertos > 0) void clienteConsultas.invalidateQueries({ queryKey: CHAVE_CONSULTA });
      })
      .catch(() => {
        // Sem permissão de gravação (ou sem rede), a tela segue só com o que já existe.
      });
  }, [consulta.data, clienteConsultas]);

  // Meses que têm espelho, do mais recente para o mais antigo. O padrão é o mais recente que já tem horas
  // importadas, para um mês recém-aberto (zerado) não aparecer antes de os PDFs chegarem.
  const meses = useMemo(
    () => [...new Set(espelhos.map((e) => e.mes))].sort((a, b) => b.localeCompare(a)),
    [espelhos],
  );
  const mes =
    mesEscolhido === TODOS || (mesEscolhido && meses.includes(mesEscolhido))
      ? mesEscolhido
      : (meses.find((m) => espelhos.some((e) => e.mes === m && e.trabalhado > 0)) ??
        meses[0] ??
        TODOS);

  const espelhosDoMes = useMemo(
    () => espelhos.filter((e) => mes === TODOS || e.mes === mes),
    [espelhos, mes],
  );
  const colaboradores = useMemo(
    () =>
      [...new Set(espelhosDoMes.map((e) => e.funcionario))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [espelhosDoMes],
  );
  const colaborador = colaboradores.includes(colaboradorEscolhido) ? colaboradorEscolhido : TODOS;

  const espelhosFiltrados = useMemo(
    () =>
      espelhosDoMes
        .filter((e) => colaborador === TODOS || e.funcionario === colaborador)
        .sort(
          (a, b) =>
            a.periodoInicio.localeCompare(b.periodoInicio) ||
            a.funcionario.localeCompare(b.funcionario, "pt-BR"),
        ),
    [espelhosDoMes, colaborador],
  );

  const linhas = espelhosFiltrados;

  const totais = useMemo(
    () => ({
      horasExtras: linhas.reduce((soma, l) => soma + l.horasExtras, 0),
      horasFaltas: linhas.reduce((soma, l) => soma + l.horasFaltas, 0),
      trabalhado: linhas.reduce((soma, l) => soma + l.trabalhado, 0),
    }),
    [linhas],
  );

  async function importar() {
    if (arquivos.length === 0) return;
    setImportando(true);
    setProgresso({ lidos: 0, total: arquivos.length });

    // Ler o PDF não depende do banco, então vários são lidos ao mesmo tempo; a gravação vem depois, de uma vez.
    let lidos = 0;
    const leituras = await emParalelo(arquivos, 4, async (arquivo) => {
      try {
        return await lerEspelhoDoArquivo(arquivo);
      } finally {
        lidos += 1;
        setProgresso({ lidos, total: arquivos.length });
      }
    });
    const espelhos = leituras.flatMap((r) => (r.ok ? [r.valor] : []));
    const falhas = leituras.flatMap((r, i) =>
      r.ok
        ? []
        : [
            `${arquivos[i]?.name}: ${r.erro instanceof Error ? r.erro.message : "não consegui ler este PDF."}`,
          ],
    );
    // Muitos erros viram um aviso só, para não encher a tela.
    if (falhas.length > 0) {
      toast.error(
        falhas.length <= 3
          ? falhas.join("\n")
          : `${falhas.slice(0, 3).join("\n")}\ne mais ${falhas.length - 3} arquivos com erro.`,
      );
    }

    if (espelhos.length > 0) {
      try {
        await salvarEspelhos(espelhos);
        await clienteConsultas.invalidateQueries({ queryKey: CHAVE_CONSULTA });
        setMesEscolhido(
          espelhos
            .map((e) => e.periodoFim)
            .sort()
            .at(-1)
            ?.slice(0, 7) ?? null,
        );
        setColaboradorEscolhido(TODOS);
        setArquivos([]);
        toast.success(
          espelhos.length === 1
            ? "Espelho importado e salvo."
            : `${espelhos.length} espelhos importados e salvos.`,
        );
      } catch {
        toast.error("Li os PDFs, mas não consegui salvar no banco. Tente importar de novo.");
      }
    }
    setImportando(false);
    setProgresso(null);
  }

  // Aplica uma edição da grade na tela na hora e grava no banco em seguida. Se a gravação falhar, recarrega do banco.
  function editar(linha: LinhaGrade, chave: string, valor: string): string | null {
    const campo = chave as CampoEditavel;
    let novoValor: number | string | null = valor;
    if (chave === "saldoAnterior" && valor.trim() === "") {
      // Célula apagada: o saldo volta a ser calculado automaticamente.
      novoValor = null;
    } else if (chave === "saldoAnterior" || chave === "compensar") {
      const minutos = textoParaMinutosComSinal(valor);
      if (minutos === null)
        return `"${valor}" não é um valor válido. Use +HH:MM ou -HH:MM, por exemplo -13:00.`;
      novoValor = minutos;
    } else if (chave === "horasExtras" || chave === "horasFaltas" || chave === "trabalhado") {
      const minutos = textoParaMinutos(valor);
      if (minutos === null)
        return `"${valor}" não é um valor válido. Use HH:MM, por exemplo 79:00.`;
      novoValor = minutos;
    } else if (chave === "pagarDescontar") {
      const minutos = textoParaMinutosNegativo(valor);
      if (minutos === null)
        return `"${valor}" não é um valor válido. Horas a pagar/descontar são sempre negativas: use HH:MM, por exemplo 01:03.`;
      novoValor = minutos;
    }

    clienteConsultas.setQueryData<EspelhoSalvo[]>(CHAVE_CONSULTA, (atuais) =>
      atuais?.map((e) =>
        e.id === linha.id
          ? { ...e, [campo === "saldoAnterior" ? "saldoManual" : campo]: novoValor }
          : e,
      ),
    );
    atualizarEspelho(linha.id, campo, novoValor).catch(() => {
      toast.error("Não consegui salvar a alteração. A tabela foi recarregada.");
      void clienteConsultas.invalidateQueries({ queryKey: CHAVE_CONSULTA });
    });
    return null;
  }

  // Baixa em Excel exatamente o que está na tela (mês e colaborador filtrados).
  async function exportar() {
    setExportando(true);
    try {
      await exportarBancoDeHoras(
        linhas,
        mes === TODOS ? "Todos os meses" : tituloDoMes(rotuloMes(mes)),
      );
    } catch {
      toast.error("Não consegui gerar a planilha.");
    } finally {
      setExportando(false);
    }
  }

  async function excluir(espelho: EspelhoSalvo) {
    const confirmado = window.confirm(
      `Excluir o espelho de ${espelho.funcionario} (${rotuloMes(espelho.mes)})? O que foi digitado nele também será apagado.`,
    );
    if (!confirmado) return;
    try {
      await excluirEspelho(espelho.id);
      await clienteConsultas.invalidateQueries({ queryKey: CHAVE_CONSULTA });
      toast.success("Espelho excluído.");
    } catch {
      toast.error("Não consegui excluir o espelho.");
    }
  }

  const espelhoUnico = espelhosFiltrados.length === 1 ? espelhosFiltrados[0] : undefined;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <header>
          <h1 className="font-display text-3xl font-semibold text-white">Banco de Horas</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Importe os espelhos de ponto em PDF, quantos quiser de uma vez, um por colaborador. O
            espelho calcula as horas extras, faltas e trabalhadas; saldo anterior, horas a
            pagar/descontar, horas para compensar e observações você digita na própria tabela, como
            numa planilha. Tudo fica salvo. O saldo anterior é calculado sozinho (banco de horas do
            mês anterior) e cada mês novo abre zerado; digite na célula só se precisar corrigir.
          </p>
        </header>

        <section className="mt-8 grid gap-4 rounded-2xl border border-panel-active bg-panel p-6">
          <ZonaDeArquivos arquivos={arquivos} aoEscolher={setArquivos} desabilitado={importando} />
          <div>
            <button
              type="button"
              disabled={arquivos.length === 0 || importando}
              onClick={importar}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="size-4" aria-hidden />
              {importando
                ? progresso
                  ? `Lendo ${progresso.lidos} de ${progresso.total}…`
                  : "Salvando…"
                : "Importar e salvar"}
            </button>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div className="grid gap-2">
            <label htmlFor="filtro-mes" className="text-sm font-semibold text-white">
              Mês
            </label>
            <select
              id="filtro-mes"
              value={mes}
              disabled={meses.length === 0}
              onChange={(evento) => setMesEscolhido(evento.target.value)}
              className={cn(CAMPO, "min-w-[14rem] capitalize")}
            >
              <option value={TODOS}>Todos os meses</option>
              {meses.map((m) => (
                <option key={m} value={m}>
                  {rotuloMes(m)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="filtro-colaborador" className="text-sm font-semibold text-white">
              Colaborador
            </label>
            <select
              id="filtro-colaborador"
              value={colaborador}
              disabled={colaboradores.length === 0}
              onChange={(evento) => setColaboradorEscolhido(evento.target.value)}
              className={cn(CAMPO, "min-w-[18rem]")}
            >
              <option value={TODOS}>Todos os colaboradores</option>
              {colaboradores.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </div>
          {espelhosFiltrados.length > 0 && (
            <p className="pb-2.5 text-sm text-white/70">
              {espelhosFiltrados.length}{" "}
              {espelhosFiltrados.length === 1 ? "colaborador" : "colaboradores"}
            </p>
          )}
          {espelhoUnico && (
            <button
              type="button"
              onClick={() => excluir(espelhoUnico)}
              className="mb-0.5 inline-flex items-center gap-2 rounded-lg border border-panel-active px-3 py-2 text-sm text-white/80 transition hover:border-red-400 hover:text-red-400"
            >
              <Trash2 className="size-4" aria-hidden />
              Excluir espelho
            </button>
          )}
          <button
            type="button"
            disabled={linhas.length === 0 || exportando}
            onClick={exportar}
            className="mb-0.5 ml-auto inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="size-4" aria-hidden />
            {exportando ? "Gerando planilha…" : "Exportar para Excel"}
          </button>
        </div>

        <section className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { rotulo: "Total de horas extras", minutos: totais.horasExtras },
            { rotulo: "Total de horas faltas", minutos: totais.horasFaltas },
            { rotulo: "Total trabalhado", minutos: totais.trabalhado },
          ].map(({ rotulo, minutos }) => (
            <div key={rotulo} className="rounded-2xl border border-panel-active bg-panel p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                {rotulo}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-white">
                <TotalHoras minutos={minutos} />
              </p>
            </div>
          ))}
        </section>

        <div className="mt-6">
          <GradeEditavel
            linhas={linhas}
            colunas={colunas}
            chaveLinha={(linha) => linha.id}
            aoEditar={editar}
            vazio={
              consulta.isPending
                ? "Carregando…"
                : consulta.isError
                  ? "Não consegui carregar o banco de horas. Verifique se você tem acesso de Administrador."
                  : "Nenhum espelho importado ainda. Importe os PDFs para ver o cálculo."
            }
            rodape={
              <tr className="font-semibold text-white">
                <td className="border border-panel-active px-3 py-2.5">Total</td>
                <td className="border border-panel-active px-3 py-2.5" />
                <td className="border border-panel-active px-3 py-2.5" />
                <td className="border border-panel-active px-3 py-2.5">
                  {formatarTotal(totais.horasExtras)}
                </td>
                <td className="border border-panel-active px-3 py-2.5">
                  {formatarTotal(totais.horasFaltas)}
                </td>
                <td className="border border-panel-active px-3 py-2.5">
                  {formatarTotal(totais.trabalhado)}
                </td>
                <td className="border border-panel-active px-3 py-2.5" />
                <td className="border border-panel-active px-3 py-2.5" />
                <td className="border border-panel-active px-3 py-2.5" />
                <td className="border border-panel-active px-3 py-2.5" />
              </tr>
            }
          />
          {linhas.length > 0 && (
            <p className="mt-3 text-xs text-white/60">
              Setas e Tab movem a seleção · Enter ou duplo clique edita · digitar sobrescreve ·
              Delete limpa · Esc cancela · Ctrl+C / Ctrl+V copiam e colam (também do Excel). As
              alterações são salvas na hora. Saldo anterior em cinza itálico é automático; apague a
              célula para voltar ao automático.
            </p>
          )}
        </div>
      </main>
      <EspelhoDiaADiaDialog espelho={espelhoAberto} aoFechar={() => setEspelhoAberto(null)} />
    </div>
  );
}
