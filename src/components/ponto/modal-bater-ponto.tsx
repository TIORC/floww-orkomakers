import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, History, Loader2, MapPinOff, ScanFace, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { HistoricoPontos } from "@/components/ponto/historico-pontos";
import { MapaLocalizacao, type Localizacao } from "@/components/ponto/mapa-localizacao";
import { useUsuarioLogado } from "@/hooks/use-usuario-logado";
import { carregarDiasDoColaborador, linhasDoMes } from "@/lib/historico-pontos";
import {
  agruparBatidasPorDia,
  BATIDAS_POR_DIA,
  carregarMinhasBatidas,
  registrarBatida,
  rotuloDaBatida,
  ultimaBatida,
  type LocalizacaoDaBatida,
} from "@/lib/ponto-batidas";
import {
  carregarEspelhosDoColaborador,
  formatarDuracao,
  resumoDoMes,
} from "@/lib/resumo-do-mes";

type Props = {
  aberto: boolean;
  aoMudarAberto: (aberto: boolean) => void;
};

// Etapas do fluxo: início → localizando → validada (com botão de confirmar) ou erro. "historico" é a tela de pontos.
type Etapa = "inicio" | "localizando" | "validada" | "erro" | "historico";

function dataExtensa(data: Date) {
  return data.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function horaCurta(data: Date) {
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Data e hora do registro no formato da tela: 09/11/2026 e 10h37min.
function dataDoRegistro(data: Date) {
  return data.toLocaleDateString("pt-BR");
}

function horaDoRegistro(data: Date) {
  const horas = String(data.getHours()).padStart(2, "0");
  const minutos = String(data.getMinutes()).padStart(2, "0");
  return `${horas}h${minutos}min`;
}

// Valor que ainda não vem do banco: aparece como traço, sem número inventado.
const SEM_DADO = "—";

function Estatistica({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-4 py-6", destaque && "bg-panel-active/60")}>
      <p className="text-sm text-white/60">{rotulo}</p>
      <p className="text-3xl font-bold tabular-nums text-white">{valor}</p>
    </div>
  );
}

// Modal de registro de ponto, aberto pelo botão "Bater Ponto" do topo.
export function ModalBaterPonto({ aberto, aoMudarAberto }: Props) {
  const [agora, setAgora] = useState(() => new Date());
  const [etapa, setEtapa] = useState<Etapa>("inicio");
  const [registro, setRegistro] = useState<Date | null>(null);
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null);

  const clienteConsultas = useQueryClient();
  const { data: usuario } = useUsuarioLogado();
  const email = usuario?.email ?? "";
  const nome = usuario?.nomeCompleto || usuario?.nome || "";
  const batidas = useQuery({
    queryKey: ["ponto-batidas", email],
    queryFn: () => carregarMinhasBatidas(email),
    enabled: !!email,
  });
  const ultima = ultimaBatida(batidas.data ?? []);

  // As 4 batidas do dia, na ordem: a próxima é a que está sendo registrada agora.
  const hojeIso = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
  const batidasHoje = agruparBatidasPorDia(batidas.data ?? []).get(hojeIso) ?? [];
  const proximaBatida =
    batidasHoje.length < BATIDAS_POR_DIA ? rotuloDaBatida(batidasHoje.length) : null;

  // Números do cartão de resumo: mês atual, com os dias e espelhos da própria pessoa (mesmas chaves da tela de histórico).
  const nomes = [usuario?.nome ?? "", usuario?.nomeCompleto ?? ""];
  const dias = useQuery({
    queryKey: ["ponto-historico-dias", email],
    queryFn: () => carregarDiasDoColaborador(nomes),
    enabled: !!email,
  });
  const espelhos = useQuery({
    queryKey: ["ponto-historico-espelhos", email],
    queryFn: () => carregarEspelhosDoColaborador(nomes),
    enabled: !!email,
  });
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const resumo = useMemo(
    () =>
      resumoDoMes(
        linhasDoMes(dias.data ?? [], [], mesAtual, batidas.data ?? []),
        espelhos.data ?? [],
        mesAtual,
      ),
    [dias.data, espelhos.data, batidas.data, mesAtual],
  );

  const confirmar = useMutation({
    mutationFn: ({ local }: { local: LocalizacaoDaBatida; rotulo: string }) =>
      registrarBatida(email, nome, local),
    onSuccess: (_, { rotulo }) => {
      toast.success(`${rotulo} registrada.`);
      void clienteConsultas.invalidateQueries({ queryKey: ["ponto-batidas"] });
      setEtapa("inicio");
    },
    onError: () => toast.error("Não consegui registrar o ponto. Tente de novo."),
  });

  // Relógio da tela atualiza a cada 30 segundos, enquanto o modal estiver aberto.
  useEffect(() => {
    if (!aberto) {
      setEtapa("inicio");
      return;
    }
    setAgora(new Date());
    const id = window.setInterval(() => setAgora(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [aberto]);

  // Calcula a localização atual do dispositivo antes de liberar a confirmação do ponto.
  function baterPonto() {
    if (!("geolocation" in navigator)) {
      setEtapa("erro");
      return;
    }
    setEtapa("localizando");
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        setLocalizacao({
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
          precisao: posicao.coords.accuracy,
        });
        setRegistro(new Date());
        setEtapa("validada");
      },
      () => setEtapa("erro"),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent
        className={cn(
          "overflow-hidden rounded-2xl border border-brand bg-panel p-0 text-white shadow-2xl shadow-brand/10",
          etapa === "historico"
            ? "w-[96vw] max-w-[96vw] xl:max-w-[1500px]"
            : "max-w-6xl",
        )}
      >
        <DialogTitle className="sr-only">Registre o seu ponto</DialogTitle>
        <DialogDescription className="sr-only">Bata o ponto e veja seus registros do mês.</DialogDescription>

        {etapa === "inicio" && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-6 p-8">
              <div className="flex items-start gap-4">
                <ScanFace className="mt-1 size-7 shrink-0 text-brand" aria-hidden />
                <div>
                  <h2 className="text-2xl font-bold text-white">Registre o seu ponto</h2>
                  <p className="mt-1 text-lg text-white/80">
                    {dataExtensa(agora)}, {horaCurta(agora)}h
                  </p>
                </div>
              </div>
              <div className="min-w-56 rounded-xl bg-panel-active/60 px-6 py-4 text-center">
                <p className="text-sm text-white/60">Última batida</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {ultima ? horaDoRegistro(new Date(ultima.registradoEm)) : SEM_DADO}
                </p>
                {ultima && (
                  <p className="text-xs text-white/60">{dataDoRegistro(new Date(ultima.registradoEm))}</p>
                )}
              </div>
            </div>

            <div className="px-8">
              <button
                type="button"
                disabled={!proximaBatida}
                onClick={baterPonto}
                className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-slate-900 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Bater ponto
              </button>
              <p className="mt-3 text-center text-sm text-white/70">
                {proximaBatida
                  ? `Hoje: ${batidasHoje.length} de ${BATIDAS_POR_DIA} batidas · Próxima: ${proximaBatida}`
                  : "As 4 batidas de hoje já foram registradas."}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-3 divide-x divide-panel-active border-y border-panel-active">
              <Estatistica
                rotulo="Dias trabalhados"
                valor={dias.data && batidas.data ? String(resumo.diasTrabalhados) : SEM_DADO}
              />
              <Estatistica
                rotulo="Horas no mês"
                valor={dias.data && batidas.data ? formatarDuracao(resumo.horasNoMes) : SEM_DADO}
                destaque
              />
              <Estatistica
                rotulo="Banco de horas"
                valor={
                  espelhos.data && resumo.bancoDeHoras !== null
                    ? formatarDuracao(resumo.bancoDeHoras)
                    : SEM_DADO
                }
              />
            </div>

            <div className="p-8">
              <button
                type="button"
                onClick={() => setEtapa("historico")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand py-3 text-base font-semibold text-brand transition hover:bg-brand/10"
              >
                <History className="size-5" aria-hidden />
                Ver histórico de pontos
              </button>
            </div>
          </>
        )}

        {etapa === "historico" && <HistoricoPontos aoVoltar={() => setEtapa("inicio")} />}

        {etapa === "localizando" && (
          <div className="flex flex-col items-center gap-4 p-10 text-center" role="status">
            <Loader2 className="size-10 animate-spin text-brand" aria-hidden />
            <p className="text-lg font-semibold text-white">Calculando sua localização…</p>
            <p className="text-sm text-white/60">Permita o acesso à localização do navegador se ele pedir.</p>
          </div>
        )}

        {etapa === "validada" && registro && localizacao && (
          <div className="flex flex-col gap-6 p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <ShieldCheck className="size-12 text-brand" aria-hidden />
              <h2 className="text-xl font-bold text-white">Localização validada com sucesso!</h2>
              {proximaBatida ? (
                <p className="text-sm text-white/70">
                  Esta batida é: <span className="font-semibold text-white">{proximaBatida}</span>
                </p>
              ) : (
                <p className="text-sm text-white/70">As 4 batidas de hoje já foram registradas.</p>
              )}
            </div>

            <MapaLocalizacao localizacao={localizacao} />

            <div className="grid grid-cols-2 divide-x divide-panel-active rounded-xl bg-panel-active/60 py-4">
              <div className="flex items-center justify-center gap-3 px-4 text-left">
                <CalendarDays className="size-6 shrink-0 text-brand" aria-hidden />
                <div>
                  <p className="text-xs text-white/60">Data do registro</p>
                  <p className="font-semibold text-white">{dataDoRegistro(registro)}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 px-4 text-left">
                <Clock className="size-6 shrink-0 text-brand" aria-hidden />
                <div>
                  <p className="text-xs text-white/60">Horário do registro</p>
                  <p className="font-semibold text-white">{horaDoRegistro(registro)}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!email || !proximaBatida || confirmar.isPending}
              onClick={() =>
                localizacao &&
                proximaBatida &&
                confirmar.mutate({ local: localizacao, rotulo: proximaBatida })
              }
              className="w-full rounded-xl bg-brand py-3 text-base font-bold uppercase tracking-wide text-slate-900 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirmar.isPending ? "Registrando…" : "Confirmar ponto"}
            </button>
            <button
              type="button"
              onClick={() => setEtapa("inicio")}
              className="text-sm font-semibold text-brand transition hover:underline"
            >
              Cancelar ponto
            </button>
          </div>
        )}

        {etapa === "erro" && (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <MapPinOff className="size-12 text-red-400" aria-hidden />
            <p className="text-lg font-semibold text-white">Não foi possível obter sua localização.</p>
            <p className="text-sm text-white/60">
              Confira se o navegador tem permissão de localização e tente de novo.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEtapa("inicio")}
                className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={baterPonto}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-slate-900 transition hover:brightness-110"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
