import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Loader2,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUsuarioLogado } from "@/hooks/use-usuario-logado";
import { BATIDAS_POR_DIA, carregarMinhasBatidas, paresDeMarcacoes } from "@/lib/ponto-batidas";
import {
  carregarDiasDoColaborador,
  carregarMinhasSolicitacoes,
  dataBrDeIso,
  diaDaSemanaDeIso,
  enviarSolicitacaoDePonto,
  linhasDoMes,
  mesesDoHistorico,
  rotuloMesCurto,
  validarSolicitacao,
  type LinhaDoMes,
  type NovaSolicitacao,
  type SolicitacaoPonto,
  type TipoSolicitacaoPonto,
} from "@/lib/historico-pontos";
import { cn } from "@/lib/utils";

type Aba = "registrados" | "solicitacoes";

type FormularioAberto = { tipo: TipoSolicitacaoPonto; data: string };

// Data de hoje no fuso local, em AAAA-MM-DD.
function hojeIso() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

// 0 min vira "0h"; 9 h vira "9h"; 8h48 min vira "8h48min", como no espelho do sistema de ponto.
function duracao(minutos: number) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, "0")}min`;
}

const ROTULO_TIPO: Record<TipoSolicitacaoPonto, string> = {
  ponto: "Ponto",
  falta_justificada: "Falta justificada",
};

const ROTULO_STATUS: Record<SolicitacaoPonto["status"], { texto: string; classe: string }> = {
  pendente: { texto: "Pendente", classe: "text-amber-300" },
  aprovado: { texto: "Aprovada", classe: "text-emerald-400" },
  recusado: { texto: "Recusada", classe: "text-red-400" },
};

function Selo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full bg-panel-active px-2.5 py-0.5 text-xs font-medium text-white/80",
        className,
      )}
    >
      {children}
    </span>
  );
}

function BotaoAdicionar({ aoEscolher }: { aoEscolher: (tipo: TipoSolicitacaoPonto) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-brand px-4 py-1.5 text-sm font-semibold text-brand transition hover:bg-brand/10"
        >
          Adicionar
          <ChevronDown className="size-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-panel-active bg-panel text-white">
        <DropdownMenuItem onSelect={() => aoEscolher("ponto")}>Adicionar ponto</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => aoEscolher("falta_justificada")}>
          Falta justificada
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type FormularioProps = {
  tipo: TipoSolicitacaoPonto;
  dataInicial: string;
  hoje: string;
  email: string;
  nome: string;
  aoFechar: () => void;
};

// Pedido de inclusão de horário ou de justificativa de falta. Fica pendente até o RH/gestor decidir.
function FormularioSolicitacao({
  tipo,
  dataInicial,
  hoje,
  email,
  nome,
  aoFechar,
}: FormularioProps) {
  const clienteConsultas = useQueryClient();
  const [data, setData] = useState(dataInicial);
  const [entrada, setEntrada] = useState("");
  const [saida, setSaida] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const ehPonto = tipo === "ponto";

  const enviar = useMutation({
    mutationFn: (dados: NovaSolicitacao) => enviarSolicitacaoDePonto(email, nome, dados),
    onSuccess: () => {
      toast.success("Solicitação enviada. Ela fica pendente até ser aprovada.");
      void clienteConsultas.invalidateQueries({ queryKey: ["ponto-historico-solicitacoes"] });
      aoFechar();
    },
    onError: () => setErro("Não consegui enviar a solicitação. Tente de novo."),
  });

  function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = { tipo, data, entrada, saida, motivo };
    const problema = validarSolicitacao(dados, hoje);
    if (problema) {
      setErro(problema);
      return;
    }
    setErro(null);
    enviar.mutate(dados);
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="border-panel-active bg-panel text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {ehPonto ? "Adicionar ponto" : "Falta justificada"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {ehPonto
              ? "Peça a inclusão do horário de entrada e saída de um dia."
              : "Justifique a falta de um dia. O pedido fica pendente até ser aprovado."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviarFormulario} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="ponto-data">Data</Label>
            <Input
              id="ponto-data"
              type="date"
              max={hoje}
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="border-panel-active bg-background text-white"
            />
          </div>

          {ehPonto && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="ponto-entrada">Entrada</Label>
                <Input
                  id="ponto-entrada"
                  type="time"
                  value={entrada}
                  onChange={(e) => setEntrada(e.target.value)}
                  className="border-panel-active bg-background text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ponto-saida">Saída</Label>
                <Input
                  id="ponto-saida"
                  type="time"
                  value={saida}
                  onChange={(e) => setSaida(e.target.value)}
                  className="border-panel-active bg-background text-white"
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="ponto-motivo">{ehPonto ? "Observação (opcional)" : "Motivo"}</Label>
            <Textarea
              id="ponto-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="border-panel-active bg-background text-white"
            />
          </div>

          {erro && (
            <p role="alert" className="text-sm text-red-400">
              {erro}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={aoFechar}
              className="border-panel-active text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={enviar.isPending}
              className="bg-brand text-slate-900 hover:brightness-110"
            >
              {enviar.isPending && <Loader2 className="animate-spin" aria-hidden />}
              Enviar solicitação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinhaDoDia({
  linha,
  aberto,
  aoAlternar,
  aoAdicionar,
}: {
  linha: LinhaDoMes;
  aberto: boolean;
  aoAlternar: () => void;
  aoAdicionar: (tipo: TipoSolicitacaoPonto) => void;
}) {
  const pendentes = linha.solicitacoes.filter((s) => s.status === "pendente").length;
  const pares = paresDeMarcacoes(linha.marcacoes);
  // Sábado e domingo são DSR (descanso semanal remunerado).
  const diaDaSemana = new Date(`${linha.data}T12:00:00`).getDay();
  const dsr = diaDaSemana === 0 || diaDaSemana === 6;
  return (
    <li className="border-b border-panel-active last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={aoAlternar}
          aria-expanded={aberto}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-left transition hover:text-brand"
        >
          {aberto ? (
            <ChevronDown className="size-4 shrink-0" aria-hidden />
          ) : (
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          )}
          <span className="font-medium text-white">
            {dataBrDeIso(linha.data)} - {linha.diaSemana}
          </span>
          {linha.feriado && <Selo>Feriado</Selo>}
          {linha.folga && <Selo>Folga</Selo>}
          {dsr && <Selo>DSR</Selo>}
          {pendentes > 0 && <Selo className="text-amber-300">Solicitação pendente</Selo>}
        </button>
        <span className="w-24 text-right tabular-nums text-white/80">
          {duracao(linha.horasExtras)}
        </span>
        <span className="w-24 text-right tabular-nums text-white">
          {linha.trabalhado === 0 && linha.feriado
            ? "Feriado"
            : linha.trabalhado === 0 && linha.folga
              ? "Folga"
              : linha.trabalhado === 0 && dsr
                ? "-"
                : duracao(linha.trabalhado)}
        </span>
      </div>

      {aberto && (
        <div className="overflow-x-auto bg-background/40 text-sm">
          <div className="grid min-w-[36rem] grid-cols-[1fr_9rem_9rem_6rem_4.5rem] items-center gap-3 border-b border-panel-active px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/60">
            <div>
              <BotaoAdicionar aoEscolher={aoAdicionar} />
            </div>
            <span className="text-center">Entrada</span>
            <span className="text-center">Saída</span>
            <span className="text-right">Saldo</span>
            <span />
          </div>

          {pares.map((par, indice) => (
            <div
              key={`${par.entrada}-${indice}`}
              className="grid min-w-[36rem] grid-cols-[1fr_9rem_9rem_6rem_4.5rem] items-center gap-3 border-b border-panel-active px-4 py-3 text-white"
            >
              <span />
              <span className="flex items-center justify-center gap-2 tabular-nums">
                {par.entrada}
                <Monitor className="size-4 text-white/60" aria-hidden />
              </span>
              <span className="flex items-center justify-center gap-2 tabular-nums">
                {par.saida ?? "—"}
                {par.saida && <Monitor className="size-4 text-white/60" aria-hidden />}
              </span>
              <span className="text-right font-semibold tabular-nums">
                {par.saldo === null ? "—" : duracao(par.saldo)}
              </span>
              <button
                type="button"
                onClick={() => aoAdicionar("ponto")}
                className="text-right font-semibold text-brand hover:underline"
              >
                Ajuste
              </button>
            </div>
          ))}

          <div className="flex min-w-[36rem] flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-white/60">Jornada</span>
            <span className="flex flex-wrap justify-end gap-x-6 text-white">
              <span className="font-semibold">Horas extras: {duracao(linha.horasExtras)}</span>
              <span className="text-white/80">Trabalhado: {duracao(linha.trabalhado)}</span>
            </span>
          </div>

          <div className="space-y-3 px-4 pb-4">
            {linha.marcacoes.length > 0 && linha.marcacoes.length < BATIDAS_POR_DIA && (
              <p className="text-amber-300">
                Dia com {linha.marcacoes.length} de {BATIDAS_POR_DIA} batidas. Sem as{" "}
                {BATIDAS_POR_DIA} batidas o dia não entra no saldo do banco de horas.
              </p>
            )}
            {linha.observacao && <p className="text-white/70">Observação: {linha.observacao}</p>}

            {linha.solicitacoes.length > 0 ? (
              <ul className="space-y-1">
                {linha.solicitacoes.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-2 text-white/80">
                    <span>
                      {s.tipo === "ponto"
                        ? `Ponto pedido: ${s.entrada} até ${s.saida}`
                        : `Falta justificada: ${s.motivo}`}
                    </span>
                    <span className={cn("font-semibold", ROTULO_STATUS[s.status].classe)}>
                      {ROTULO_STATUS[s.status].texto}
                    </span>
                  </li>
                ))}
              </ul>
            ) : linha.marcacoes.length === 0 ? (
              <p className="text-white/50">
                Nenhuma batida neste dia. Use Adicionar para pedir a inclusão de um horário.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </li>
  );
}

// Tela "Histórico de pontos": aberta pelo botão "Ver histórico de pontos" do modal de bater ponto.
export function HistoricoPontos({ aoVoltar }: { aoVoltar: () => void }) {
  const { data: usuario } = useUsuarioLogado();
  const email = usuario?.email ?? "";
  const nome = usuario?.nomeCompleto || usuario?.nome || "";
  const nomes = [usuario?.nome ?? "", usuario?.nomeCompleto ?? ""];
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const hoje = useMemo(() => hojeIso(), []);
  const [aba, setAba] = useState<Aba>("registrados");
  const [mesEscolhido, setMesEscolhido] = useState<string | null>(null);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [formulario, setFormulario] = useState<FormularioAberto | null>(null);

  const dias = useQuery({
    queryKey: ["ponto-historico-dias", email],
    queryFn: () => carregarDiasDoColaborador(nomes),
    enabled: !!email,
  });
  const solicitacoes = useQuery({
    queryKey: ["ponto-historico-solicitacoes", email],
    queryFn: () => carregarMinhasSolicitacoes(email),
    enabled: !!email,
  });

  const batidas = useQuery({
    queryKey: ["ponto-batidas", email],
    queryFn: () => carregarMinhasBatidas(email),
    enabled: !!email,
  });

  const listaDias = useMemo(() => dias.data ?? [], [dias.data]);
  const listaSolicitacoes = useMemo(() => solicitacoes.data ?? [], [solicitacoes.data]);
  const listaBatidas = useMemo(() => batidas.data ?? [], [batidas.data]);
  const meses = useMemo(
    () => mesesDoHistorico(listaDias, listaSolicitacoes, hoje, listaBatidas),
    [listaDias, listaSolicitacoes, listaBatidas, hoje],
  );
  const mes = mesEscolhido ?? meses[0] ?? hoje.slice(0, 7);
  const linhas = useMemo(
    () => linhasDoMes(listaDias, listaSolicitacoes, mes, listaBatidas, hoje),
    [listaDias, listaSolicitacoes, listaBatidas, mes, hoje],
  );

  function alternarDia(data: string) {
    setExpandidos((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(data)) proximo.delete(data);
      else proximo.add(data);
      return proximo;
    });
  }

  return (
    <div className="flex h-[90vh] flex-col overflow-y-auto bg-background text-white md:flex-row">
      <aside className="shrink-0 border-b border-panel-active p-6 md:w-64 md:border-b-0 md:border-r">
        <p className="text-sm font-bold tracking-wide text-white/90">PONTO ELETRÔNICO</p>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-panel-active bg-panel-active text-xs font-bold">
            {iniciais || "—"}
          </span>
          <p className="truncate text-sm font-semibold text-white">{nome || "—"}</p>
        </div>
        <nav className="mt-6 flex gap-2 md:flex-col" aria-label="Ponto eletrônico">
          {(
            [
              { id: "registrados", rotulo: "Pontos registrados", Icone: Clock },
              { id: "solicitacoes", rotulo: "Solicitações", Icone: ClipboardList },
            ] as const
          ).map(({ id, rotulo, Icone }) => (
            <button
              key={id}
              type="button"
              aria-current={aba === id ? "page" : undefined}
              onClick={() => setAba(id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                aba === id
                  ? "bg-panel-active text-brand"
                  : "text-white/70 hover:bg-panel-active/60 hover:text-white",
              )}
            >
              <Icone className="size-4" aria-hidden />
              {rotulo}
            </button>
          ))}
        </nav>
      </aside>

      <section className="min-w-0 flex-1 p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-white/60">
          <button
            type="button"
            onClick={aoVoltar}
            className="inline-flex items-center gap-1 hover:text-brand"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Voltar
          </button>
          <span aria-hidden>›</span>
          <span className="text-brand">
            {aba === "registrados" ? "Pontos registrados" : "Solicitações"}
          </span>
        </div>

        {aba === "registrados" ? (
          <div className="rounded-xl border border-panel-active bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-panel-active p-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white/80">Mês</span>
                <Select
                  value={mes}
                  onValueChange={(valor) => {
                    setMesEscolhido(valor);
                    setExpandidos(new Set());
                  }}
                >
                  <SelectTrigger className="w-52 border-panel-active bg-background text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-panel-active bg-panel text-white">
                    {meses.map((m) => (
                      <SelectItem key={m} value={m}>
                        {rotuloMesCurto(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <BotaoAdicionar aoEscolher={(tipo) => setFormulario({ tipo, data: hoje })} />
            </div>

            <div className="flex items-center gap-3 border-b border-panel-active px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/60">
              <span className="flex-1">Dia</span>
              <span className="w-24 text-right">Hora extra</span>
              <span className="w-24 text-right">Trabalhado</span>
            </div>

            {dias.isPending || solicitacoes.isPending || batidas.isPending ? (
              <p className="p-6 text-sm text-white/60">Carregando…</p>
            ) : dias.isError || solicitacoes.isError || batidas.isError ? (
              <p className="p-6 text-sm text-red-400">Não consegui carregar os seus pontos.</p>
            ) : linhas.length === 0 ? (
              <p className="p-6 text-sm text-white/60">Nenhum registro neste mês.</p>
            ) : (
              <ul>
                {linhas.map((linha) => (
                  <LinhaDoDia
                    key={linha.data}
                    linha={linha}
                    aberto={expandidos.has(linha.data)}
                    aoAlternar={() => alternarDia(linha.data)}
                    aoAdicionar={(tipo) => setFormulario({ tipo, data: linha.data })}
                  />
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-panel-active bg-panel">
            {solicitacoes.isPending ? (
              <p className="p-6 text-sm text-white/60">Carregando…</p>
            ) : solicitacoes.isError ? (
              <p className="p-6 text-sm text-red-400">Não consegui carregar as solicitações.</p>
            ) : listaSolicitacoes.length === 0 ? (
              <p className="p-6 text-sm text-white/60">Nenhuma solicitação enviada ainda.</p>
            ) : (
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-panel-active text-xs uppercase tracking-wide text-white/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold">Ponto atual</th>
                    <th className="px-4 py-3 font-semibold">Alterar para</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {listaSolicitacoes.map((s) => (
                    <tr key={s.id} className="border-b border-panel-active last:border-b-0">
                      <td className="px-4 py-3">{ROTULO_TIPO[s.tipo]}</td>
                      <td className="px-4 py-3 tabular-nums">{dataBrDeIso(s.data)}</td>
                      <td className="px-4 py-3 text-white/50">—</td>
                      <td className="px-4 py-3">
                        {s.tipo === "ponto" ? `${s.entrada} até ${s.saida}` : s.motivo}
                      </td>
                      <td className={cn("px-4 py-3 font-semibold", ROTULO_STATUS[s.status].classe)}>
                        {ROTULO_STATUS[s.status].texto}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {formulario && (
        <FormularioSolicitacao
          key={`${formulario.tipo}-${formulario.data}`}
          tipo={formulario.tipo}
          dataInicial={formulario.data}
          hoje={hoje}
          email={email}
          nome={nome}
          aoFechar={() => setFormulario(null)}
        />
      )}
    </div>
  );
}
