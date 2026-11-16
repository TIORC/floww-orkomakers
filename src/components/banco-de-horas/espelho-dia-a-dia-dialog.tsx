import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { GradeEditavel, type ColunaGrade } from "@/components/banco-de-horas/grade-editavel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  atualizarTratamentoDoDia,
  carregarDias,
  rotuloMes,
  type DiaSalvo,
  type EspelhoSalvo,
} from "@/lib/banco-horas";
import { formatarHorario, formatarTotal, rotuloDia } from "@/lib/espelho-ponto";
import type { DiaRegistrado } from "@/lib/historico-pontos";

type Props = {
  espelho: EspelhoSalvo | null;
  aoFechar: () => void;
  // Só quem gerencia o banco de horas escreve o tratamento da falta; os demais veem o espelho só para leitura.
  podeEditar: boolean;
  // Dias do bater ponto que o PDF não cobre. Entram na tabela quando caem no período do espelho.
  diasSemPdf: DiaRegistrado[];
};

const VAZIO = <span className="text-white/40">—</span>;

const horarioOuVazio = (minutos: number) => (minutos > 0 ? formatarHorario(minutos) : VAZIO);

// Saldo com sinal: "+01:30" quando sobrou, "-00:52" quando faltou, "00:00" quando bateu a jornada.
function saldoComSinal(minutos: number) {
  if (minutos === 0) return "00:00";
  return `${minutos > 0 ? "+" : "-"}${formatarHorario(Math.abs(minutos))}`;
}

const COLUNAS: ColunaGrade<DiaSalvo>[] = [
  { chave: "data", titulo: "Data", editavel: false, texto: (dia) => rotuloDia(dia) },
  {
    chave: "horasExtras",
    titulo: "Horas extras",
    editavel: false,
    texto: (dia) => (dia.horasExtras > 0 ? formatarHorario(dia.horasExtras) : ""),
    exibir: (dia) => horarioOuVazio(dia.horasExtras),
  },
  {
    chave: "horasFaltas",
    titulo: "Horas faltas",
    editavel: false,
    texto: (dia) => (dia.horasFaltas > 0 ? formatarHorario(dia.horasFaltas) : ""),
    exibir: (dia) => horarioOuVazio(dia.horasFaltas),
    classe: (dia) => (dia.horasFaltas > 0 ? "text-red-400" : undefined),
  },
  {
    chave: "tratamento",
    titulo: "Tratamento da falta",
    editavel: true,
    texto: (dia) => dia.tratamento,
    exibir: (dia) => dia.tratamento || VAZIO,
  },
  {
    chave: "trabalhado",
    titulo: "Trabalhado",
    editavel: false,
    texto: (dia) => (dia.trabalhado > 0 ? formatarHorario(dia.trabalhado) : ""),
    exibir: (dia) => horarioOuVazio(dia.trabalhado),
  },
  {
    chave: "saldo",
    titulo: "Saldo do dia",
    editavel: false,
    texto: (dia) => saldoComSinal(dia.horasExtras - dia.horasFaltas),
    exibir: (dia) => {
      const saldo = dia.horasExtras - dia.horasFaltas;
      const cor = saldo > 0 ? "text-emerald-400" : saldo < 0 ? "text-red-400" : "text-white/60";
      return <span className={`font-semibold tabular-nums ${cor}`}>{saldoComSinal(saldo)}</span>;
    },
  },
  {
    chave: "observacao",
    titulo: "Observação",
    editavel: false,
    texto: (dia) => dia.observacao,
    exibir: (dia) => dia.observacao || VAZIO,
  },
];

// Espelho de ponto de uma pessoa, dia a dia, aberto ao clicar no nome dela na planilha do banco de horas.
export function EspelhoDiaADiaDialog({ espelho, aoFechar, podeEditar, diasSemPdf }: Props) {
  const clienteConsultas = useQueryClient();
  const colunas = useMemo(
    () => COLUNAS.map((c) => (c.chave === "tratamento" ? { ...c, editavel: podeEditar } : c)),
    [podeEditar],
  );
  const chave = useMemo(() => ["banco-de-horas-dias", espelho?.id], [espelho?.id]);
  const consulta = useQuery({
    queryKey: chave,
    queryFn: () => carregarDias(espelho?.id ?? ""),
    enabled: !!espelho,
  });
  const diasDoPdf = useMemo(() => consulta.data ?? [], [consulta.data]);

  // Dias do bater ponto dentro do período deste espelho, sem sobrepor os dias que o PDF já traz.
  const diasDoBatida = useMemo<DiaSalvo[]>(() => {
    if (!espelho) return [];
    const doPdf = new Set(diasDoPdf.map((d) => d.dataIso));
    return diasSemPdf
      .filter(
        (d) =>
          d.data >= espelho.periodoInicio && d.data <= espelho.periodoFim && !doPdf.has(d.data),
      )
      .map((d) => ({
        id: `batida-${d.data}`,
        dataIso: d.data,
        data: `${d.data.slice(8, 10)}/${d.data.slice(5, 7)}`,
        diaSemana: d.diaSemana,
        trabalhado: d.trabalhado,
        horasExtras: d.horasExtras,
        horasFaltas: d.horasFaltas,
        tratamento: "",
        observacao: d.observacao,
      }));
  }, [espelho, diasDoPdf, diasSemPdf]);

  const dias = useMemo(
    () => [...diasDoPdf, ...diasDoBatida].sort((a, b) => a.dataIso.localeCompare(b.dataIso)),
    [diasDoPdf, diasDoBatida],
  );

  const totais = useMemo(
    () => ({
      horasExtras: dias.reduce((soma, d) => soma + d.horasExtras, 0),
      horasFaltas: dias.reduce((soma, d) => soma + d.horasFaltas, 0),
      trabalhado: dias.reduce((soma, d) => soma + d.trabalhado, 0),
    }),
    [dias],
  );

  // O RH só escreve o tratamento da falta dos dias do PDF; os dias do bater ponto não são guardados nessa tabela.
  function editar(dia: DiaSalvo, _chave: string, valor: string): string | null {
    if (dia.id.startsWith("batida-")) {
      return "Este dia vem do bater ponto e não tem tratamento de falta.";
    }
    clienteConsultas.setQueryData<DiaSalvo[]>(chave, (atuais) =>
      atuais?.map((d) => (d.id === dia.id ? { ...d, tratamento: valor } : d)),
    );
    atualizarTratamentoDoDia(dia.id, valor).catch(() => {
      toast.error("Não consegui salvar o tratamento. A tabela foi recarregada.");
      void clienteConsultas.invalidateQueries({ queryKey: chave });
    });
    return null;
  }

  return (
    <Dialog open={!!espelho} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-panel-active bg-panel sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-white">{espelho?.funcionario}</DialogTitle>
          <DialogDescription className="text-white/70">
            {[
              espelho?.departamento,
              espelho?.cargo,
              espelho &&
                `${rotuloMes(espelho.mes)} · ${espelho.periodoInicio.split("-").reverse().join("/")} a ${espelho.periodoFim.split("-").reverse().join("/")}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          {[
            { rotulo: "Horas extras", minutos: totais.horasExtras },
            { rotulo: "Horas faltas", minutos: totais.horasFaltas },
            { rotulo: "Total trabalhado", minutos: totais.trabalhado },
          ].map(({ rotulo, minutos }) => (
            <div key={rotulo} className="rounded-xl border border-panel-active bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                {rotulo}
              </p>
              <p className="mt-1 font-display text-xl font-semibold tabular-nums text-white">
                {formatarTotal(minutos)}
              </p>
            </div>
          ))}
        </div>

        <GradeEditavel
          linhas={dias}
          colunas={colunas}
          chaveLinha={(dia) => dia.id}
          aoEditar={editar}
          vazio={
            consulta.isPending
              ? "Carregando…"
              : consulta.isError
                ? "Não consegui carregar o espelho."
                : "O detalhe por dia ainda não foi guardado para este espelho. Importe o PDF dele novamente para ver os dias."
          }
        />
      </DialogContent>
    </Dialog>
  );
}
