import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, Clock, FileText, Mail, Send } from "lucide-react";
import { toast } from "sonner";

import { listarSetores } from "@/lib/cargos";
import { useUsuarioLogado } from "@/hooks/use-usuario-logado";

const TIPOS_AUSENCIA = [
  { valor: "dia-inteiro", rotulo: "Dia Inteiro" },
  { valor: "manha", rotulo: "Manhã (08:00 - 12:00)" },
  { valor: "tarde", rotulo: "Tarde (13:00 - 18:00)" },
  { valor: "personalizado", rotulo: "Horário Personalizado" },
] as const;

type TipoAusencia = (typeof TIPOS_AUSENCIA)[number]["valor"];

const CAMPO =
  "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900";
const ROTULO = "grid gap-1.5 text-sm font-medium text-slate-900";
const AJUDA = "text-xs text-slate-500";
const SECAO = "flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900";

// Formulário de Aviso de Ausência, replicado dentro do card. O nome vem do usuário logado.
export function FormularioAvisoAusencia() {
  const { data: usuario } = useUsuarioLogado();
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: listarSetores });

  const [setor, setSetor] = useState("");

  // Puxa o setor do usuário logado assim que ele carrega, sem sobrescrever uma escolha já feita.
  useEffect(() => {
    if (usuario?.setor) setSetor((atual) => atual || usuario.setor);
  }, [usuario?.setor]);

  // Puxa o e-mail do gestor direto como líder do setor, sem sobrescrever o que já foi digitado.
  useEffect(() => {
    if (usuario?.gestorDiretoEmail) setEmailLider((atual) => atual || usuario.gestorDiretoEmail);
  }, [usuario?.gestorDiretoEmail]);

  const [email, setEmail] = useState("");
  const [data, setData] = useState("");
  const [periodo, setPeriodo] = useState(false);
  const [dataFim, setDataFim] = useState("");
  const [tipo, setTipo] = useState<TipoAusencia>("dia-inteiro");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [motivo, setMotivo] = useState("");
  const [emailLider, setEmailLider] = useState("");
  const [observacoes, setObservacoes] = useState("");

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!setor || !email || !data || !motivo.trim() || !emailLider) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    // O envio ainda não grava nada: a tabela de avisos e o fluxo de aprovação não foram criados.
    toast.info("Formulário pronto. O envio ainda não está ligado ao banco.");
  }

  return (
    <form
      onSubmit={enviar}
      className="mt-8 grid gap-6 rounded-2xl bg-white p-6 text-slate-900 shadow-sm sm:p-8"
    >
      <header className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <FileText className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold">Nova Solicitação de Ausência</h3>
          <p className="text-sm text-slate-500">Preencha os campos obrigatórios para registrar sua solicitação</p>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <p className={`${SECAO} md:col-span-2`}>
          <span className="size-2 rounded-full bg-red-500" aria-hidden /> Campos obrigatórios
        </p>

        <label className={ROTULO}>
          Nome do Colaborador *
          <input
            value={usuario?.nomeCompleto ?? usuario?.nome ?? ""}
            readOnly
            aria-readonly="true"
            className={`${CAMPO} cursor-not-allowed opacity-80`}
          />
        </label>

        <label className={ROTULO}>
          Email do Colaborador *
          <span className="relative block">
            <input
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="email@empresa.com"
              className={`${CAMPO} pr-10`}
            />
            <Mail className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          </span>
          <span className={AJUDA}>Este email receberá a notificação de aprovação ou recusa</span>
        </label>

        <label className={ROTULO}>
          Setor *
          <select value={setor} onChange={(evento) => setSetor(evento.target.value)} className={CAMPO}>
            <option value="">Selecione o setor</option>
            {setores.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-1.5 text-sm font-medium text-slate-900">
          <div className="flex items-center justify-between">
            <span>Data da Ausência *</span>
            <button
              type="button"
              onClick={() => setPeriodo((atual) => !atual)}
              aria-pressed={periodo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              <CalendarRange className="size-3.5" aria-hidden />
              {periodo ? "Usar data única" : "Usar período"}
            </button>
          </div>
          {periodo ? (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                aria-label="Data inicial"
                value={data}
                onChange={(evento) => setData(evento.target.value)}
                className={CAMPO}
              />
              <input
                type="date"
                aria-label="Data final"
                value={dataFim}
                min={data || undefined}
                onChange={(evento) => setDataFim(evento.target.value)}
                className={CAMPO}
              />
            </div>
          ) : (
            <input
              type="date"
              aria-label="Data da ausência"
              value={data}
              onChange={(evento) => setData(evento.target.value)}
              className={CAMPO}
            />
          )}
        </div>

        <fieldset className="grid gap-2 md:col-span-2">
          <legend className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-900">
            <Clock className="size-4" aria-hidden /> Tipo de Ausência
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {TIPOS_AUSENCIA.map((opcao) => {
              const ativo = tipo === opcao.valor;
              return (
                <button
                  key={opcao.valor}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setTipo(opcao.valor)}
                  className={`h-11 rounded-lg border px-3 text-left text-sm transition ${ativo ? "border-slate-900 bg-slate-100 font-semibold" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  {opcao.rotulo}
                </button>
              );
            })}
          </div>
          {tipo === "personalizado" && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className={ROTULO}>
                Hora de início
                <input type="time" value={horaInicio} onChange={(evento) => setHoraInicio(evento.target.value)} className={CAMPO} />
              </label>
              <label className={ROTULO}>
                Hora de término
                <input type="time" value={horaFim} onChange={(evento) => setHoraFim(evento.target.value)} className={CAMPO} />
              </label>
            </div>
          )}
        </fieldset>

        <label className={`${ROTULO} md:col-span-2`}>
          Motivo da Ausência *
          <textarea
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            placeholder="Descreva o motivo da sua ausência"
            rows={4}
            className={`${CAMPO} h-auto py-2`}
          />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <p className={`${SECAO} md:col-span-2`}>
          <Mail className="size-3.5" aria-hidden /> Email para notificação
        </p>
        <label className={`${ROTULO} md:col-span-2`}>
          Email do Líder do Setor *
          <input
            type="email"
            value={emailLider}
            onChange={(evento) => setEmailLider(evento.target.value)}
            placeholder="lider@orcoma.com.br"
            className={CAMPO}
          />
          <span className={AJUDA}>O líder do seu setor receberá um email de notificação sobre esta solicitação</span>
        </label>
        <label className={`${ROTULO} md:col-span-2`}>
          Observações
          <textarea
            value={observacoes}
            onChange={(evento) => setObservacoes(evento.target.value)}
            placeholder="Observações adicionais (opcional)"
            rows={3}
            className={`${CAMPO} h-auto py-2`}
          />
        </label>
      </div>

      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Send className="size-4" aria-hidden />
        Enviar Solicitação
      </button>
    </form>
  );
}
