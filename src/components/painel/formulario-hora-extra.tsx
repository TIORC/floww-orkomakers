import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, FileText, Mail, Send } from "lucide-react";
import { toast } from "sonner";

import { criarAviso } from "@/lib/avisos";
import { listarSetores } from "@/lib/cargos";
import { useUsuarioLogado } from "@/hooks/use-usuario-logado";

const CAMPO =
  "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900";
const ROTULO = "grid gap-1.5 text-sm font-medium text-slate-900";
const SECAO = "flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900";

// Formulário de Solicitação de Hora Extra, dentro do card. O nome vem do usuário logado.
export function FormularioHoraExtra() {
  const { data: usuario } = useUsuarioLogado();
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: listarSetores });
  const queryClient = useQueryClient();

  const [setor, setSetor] = useState("");
  const [email, setEmail] = useState("");
  const [horasPrevistas, setHorasPrevistas] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [horarioLiberacao, setHorarioLiberacao] = useState("");
  const [descricaoServico, setDescricaoServico] = useState("");
  const [motivo, setMotivo] = useState("");

  // Puxa o setor do usuário logado assim que ele carrega, sem sobrescrever uma escolha já feita.
  useEffect(() => {
    if (usuario?.setor) setSetor((atual) => atual || usuario.setor);
  }, [usuario?.setor]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (
      !setor ||
      !email ||
      !horasPrevistas.trim() ||
      !dataInicial ||
      !dataFinal ||
      !horarioLiberacao ||
      !descricaoServico.trim() ||
      !motivo.trim()
    ) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    try {
      await criarAviso({
        tipo: "hora_extra",
        solicitanteEmail: usuario?.email ?? "",
        solicitanteNome: usuario?.nomeCompleto ?? usuario?.nome ?? "",
        setor,
        gestorEmail: usuario?.gestorDiretoEmail || null,
        payload: {
          emailContato: email,
          dataInicial,
          dataFinal,
          horasPrevistas,
          horarioLiberacao,
          descricao: descricaoServico,
          motivo,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["avisos-minhas"] });
      toast.success("Solicitação enviada para aprovação.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar a solicitação.");
    }
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
          <h3 className="font-display text-lg font-semibold">Nova Solicitação de Hora Extra</h3>
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

        <label className={ROTULO}>
          Qtd. Horas Extras Previstas *
          <input
            value={horasPrevistas}
            onChange={(evento) => setHorasPrevistas(evento.target.value)}
            placeholder="Ex: 2h"
            className={CAMPO}
          />
        </label>

        <label className={ROTULO}>
          Data Inicial *
          <input
            type="date"
            value={dataInicial}
            onChange={(evento) => setDataInicial(evento.target.value)}
            className={CAMPO}
          />
        </label>

        <label className={ROTULO}>
          Data Final *
          <input
            type="date"
            value={dataFinal}
            min={dataInicial || undefined}
            onChange={(evento) => setDataFinal(evento.target.value)}
            className={CAMPO}
          />
        </label>

        <label className={`${ROTULO} md:col-span-2`}>
          <span className="flex items-center gap-2">
            <Clock className="size-4" aria-hidden /> Horário para Liberação do Computador *
          </span>
          <input
            type="time"
            value={horarioLiberacao}
            onChange={(evento) => setHorarioLiberacao(evento.target.value)}
            className={CAMPO}
          />
        </label>

        <label className={`${ROTULO} md:col-span-2`}>
          Descrição do Serviço *
          <textarea
            value={descricaoServico}
            onChange={(evento) => setDescricaoServico(evento.target.value)}
            rows={4}
            className={`${CAMPO} h-auto py-2`}
          />
        </label>

        <label className={`${ROTULO} md:col-span-2`}>
          Motivo da Hora Extra *
          <textarea
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            rows={4}
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
