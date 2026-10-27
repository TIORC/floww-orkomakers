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

// Formulário de Aviso de Retrabalho, no mesmo padrão do de Horas Extras. O nome vem do usuário logado.
export function FormularioRetrabalho() {
  const { data: usuario } = useUsuarioLogado();
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: listarSetores });
  const queryClient = useQueryClient();

  const [setor, setSetor] = useState("");
  const [email, setEmail] = useState("");
  const [emailLider, setEmailLider] = useState("");
  const [dataRetrabalho, setDataRetrabalho] = useState("");
  const [horasRetrabalho, setHorasRetrabalho] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [descricao, setDescricao] = useState("");
  const [motivo, setMotivo] = useState("");

  // Puxa o setor e o líder direto do usuário logado, sem sobrescrever o que já foi escolhido.
  useEffect(() => {
    if (usuario?.setor) setSetor((atual) => atual || usuario.setor);
  }, [usuario?.setor]);

  useEffect(() => {
    if (usuario?.gestorDiretoEmail) setEmailLider((atual) => atual || usuario.gestorDiretoEmail);
  }, [usuario?.gestorDiretoEmail]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (
      !setor ||
      !email ||
      !dataRetrabalho ||
      !horasRetrabalho.trim() ||
      !horarioInicio ||
      !descricao.trim() ||
      !motivo.trim() ||
      !emailLider
    ) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    try {
      await criarAviso({
        tipo: "retrabalho",
        solicitanteEmail: usuario?.email ?? "",
        solicitanteNome: usuario?.nomeCompleto ?? usuario?.nome ?? "",
        setor,
        gestorEmail: emailLider || null,
        payload: {
          emailContato: email,
          data: dataRetrabalho,
          horas: horasRetrabalho,
          horarioInicio,
          descricao,
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
          <h3 className="font-display text-lg font-semibold">Novo Aviso de Retrabalho</h3>
          <p className="text-sm text-slate-500">Preencha os campos obrigatórios para registrar o retrabalho</p>
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
          Data do Retrabalho *
          <input
            type="date"
            value={dataRetrabalho}
            onChange={(evento) => setDataRetrabalho(evento.target.value)}
            className={CAMPO}
          />
        </label>

        <label className={ROTULO}>
          Qtd. Horas de Retrabalho *
          <input
            value={horasRetrabalho}
            onChange={(evento) => setHorasRetrabalho(evento.target.value)}
            placeholder="Ex: 2h"
            className={CAMPO}
          />
        </label>

        <label className={ROTULO}>
          <span className="flex items-center gap-2">
            <Clock className="size-4" aria-hidden /> Horário de Início *
          </span>
          <input
            type="time"
            value={horarioInicio}
            onChange={(evento) => setHorarioInicio(evento.target.value)}
            className={CAMPO}
          />
        </label>

        <label className={`${ROTULO} md:col-span-2`}>
          Descrição do Retrabalho *
          <textarea
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
            rows={4}
            className={`${CAMPO} h-auto py-2`}
          />
        </label>

        <label className={`${ROTULO} md:col-span-2`}>
          Motivo / Causa do Retrabalho *
          <textarea
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
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
            readOnly
            aria-readonly="true"
            className={`${CAMPO} cursor-not-allowed opacity-80`}
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
