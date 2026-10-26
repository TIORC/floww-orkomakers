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

type Props = {
  espelho: EspelhoSalvo | null;
  aoFechar: () => void;
};

const VAZIO = <span className="text-white/40">—</span>;

const horarioOuVazio = (minutos: number) => (minutos > 0 ? formatarHorario(minutos) : VAZIO);

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
    titulo: "Saldo do dia",
    editavel: false,
    texto: (dia) => (dia.trabalhado > 0 ? formatarHorario(dia.trabalhado) : ""),
    exibir: (dia) => horarioOuVazio(dia.trabalhado),
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
export function EspelhoDiaADiaDialog({ espelho, aoFechar }: Props) {
  const clienteConsultas = useQueryClient();
  const chave = useMemo(() => ["banco-de-horas-dias", espelho?.id], [espelho?.id]);
  const consulta = useQuery({
    queryKey: chave,
    queryFn: () => carregarDias(espelho?.id ?? ""),
    enabled: !!espelho,
  });
  const dias = useMemo(() => consulta.data ?? [], [consulta.data]);

  const totais = useMemo(
    () => ({
      horasExtras: dias.reduce((soma, d) => soma + d.horasExtras, 0),
      horasFaltas: dias.reduce((soma, d) => soma + d.horasFaltas, 0),
      trabalhado: dias.reduce((soma, d) => soma + d.trabalhado, 0),
    }),
    [dias],
  );

  // O RH só escreve o tratamento da falta; o resto vem do PDF.
  function editar(dia: DiaSalvo, _chave: string, valor: string): string | null {
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
          colunas={COLUNAS}
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
