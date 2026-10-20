import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Camera, Loader2, User, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listarSetores } from "@/lib/cargos";
import { listarPessoasParaGestor } from "@/lib/organograma-dados";
import { cn } from "@/lib/utils";

const CAMPO =
  "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand";
const ROTULO = "grid gap-1.5 text-sm font-semibold text-white";

// A tipagem gerada do banco ainda não inclui colaboradores_importados.
const db = supabase as unknown as SupabaseClient<any>;

type Formulario = {
  nome: string;
  nomeCompleto: string;
  matricula: string;
  email: string;
  cpf: string;
  cargo: string;
  cargoVisivel: string;
  unidade: string;
  departamento: string;
  grupos: string;
  papel: string;
  gestorEmail: string;
  etnia: string;
  sexo: string;
  genero: string;
  dataNascimento: string;
  dataAdmissao: string;
  situacao: string;
  origem: string;
  gamificacao: "sim" | "nao";
};

const FORMULARIO_VAZIO: Formulario = {
  nome: "",
  nomeCompleto: "",
  matricula: "",
  email: "",
  cpf: "",
  cargo: "",
  cargoVisivel: "",
  unidade: "",
  departamento: "",
  grupos: "",
  papel: "",
  gestorEmail: "",
  etnia: "",
  sexo: "",
  genero: "",
  dataNascimento: "",
  dataAdmissao: "",
  situacao: "Ativo",
  origem: "Manual",
  gamificacao: "nao",
};

// Data do input (AAAA-MM-DD) para o mesmo formato da planilha (DD/MM/AAAA).
function dataParaPlanilha(valor: string) {
  const [ano, mes, dia] = valor.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "";
}

function Obrigatorio() {
  return <span className="ml-0.5 text-destructive">*</span>;
}

export function CadastrarColaboradorDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Formulario>(FORMULARIO_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const { data: setoresLista = [] } = useQuery({ queryKey: ["setores"], queryFn: listarSetores });
  const { data: gestores = [] } = useQuery({
    queryKey: ["pessoas-gestor"],
    queryFn: listarPessoasParaGestor,
    enabled: aberto,
  });

  if (!aberto) return null;

  function atualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function fechar() {
    setForm(FORMULARIO_VAZIO);
    onFechar();
  }

  // Grava o colaborador no banco. O organograma e a lista leem daí, então a pessoa aparece no time do gestor.
  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nome = form.nome.trim();
    const email = form.email.trim();
    if (!nome || !email) {
      toast.error("Informe o nome e o e-mail.");
      return;
    }

    const gestor = gestores.find((pessoa) => pessoa.email === form.gestorEmail);
    setSalvando(true);
    const { error } = await db.from("colaboradores_importados").insert({
      id_planilha: `MANUAL-${Date.now()}`,
      nome,
      nome_completo: form.nomeCompleto.trim() || nome,
      matricula: form.matricula.trim(),
      email,
      cpf: form.cpf.trim(),
      cargo: form.cargo.trim(),
      cargo_visivel: form.cargoVisivel.trim(),
      unidade: form.unidade.trim(),
      departamento: form.departamento.trim(),
      grupos: form.grupos.trim(),
      papel: form.papel.trim(),
      gestor_direto: gestor?.nome ?? "",
      gestor_direto_email: gestor?.email ?? "",
      etnia: form.etnia.trim(),
      sexo: form.sexo.trim(),
      genero: form.genero.trim(),
      data_nascimento: dataParaPlanilha(form.dataNascimento),
      data_admissao: dataParaPlanilha(form.dataAdmissao),
      situacao: form.situacao.trim(),
      origem_cadastro: form.origem.trim(),
      participa_gamificacao: form.gamificacao === "sim" ? "Sim" : "Não",
    });
    setSalvando(false);

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Já existe um colaborador com este e-mail." : error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["organograma"] });
    await queryClient.invalidateQueries({ queryKey: ["colaboradores-importados"] });
    toast.success(`${nome} cadastrado(a) no organograma.`);
    fechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cadastrar-colaborador-titulo"
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-panel-active bg-panel p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={fechar}
          className="absolute right-4 top-4 rounded-md p-1.5 text-white/80 transition hover:bg-panel-active hover:text-white"
        >
          <X className="size-5" aria-hidden />
        </button>

        <h2 id="cadastrar-colaborador-titulo" className="font-display text-xl font-semibold text-white">
          Cadastrar colaborador
        </h2>
        <p className="mt-1 text-sm text-white/80">
          Preencha os dados do novo colaborador. Campos com <span className="text-destructive">*</span> são obrigatórios.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[14rem_1fr]">
          <div className="grid content-start gap-3">
            <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-panel-active bg-background p-4 text-center">
              <User className="size-16 text-white/60" aria-hidden />
              <p className="text-xs text-white/80">Nenhuma foto selecionada</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10"
            >
              <Camera className="size-4" aria-hidden />
              Selecionar foto
            </button>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={salvar}>
            <label className={cn(ROTULO, "sm:col-span-2")}>
              Nome (nome que será exibido)
              <Obrigatorio />
              <input
                value={form.nome}
                onChange={(evento) => atualizar("nome", evento.target.value)}
                placeholder="Ex.: Maria Silva"
                className={CAMPO}
                required
              />
            </label>
            <label className={cn(ROTULO, "sm:col-span-2")}>
              Nome Completo
              <input
                value={form.nomeCompleto}
                onChange={(evento) => atualizar("nomeCompleto", evento.target.value)}
                placeholder="Ex.: Maria Silva Santos"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Matrícula (não obrigatório)
              <input
                value={form.matricula}
                onChange={(evento) => atualizar("matricula", evento.target.value)}
                placeholder="Ex.: 12345"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              E-mail
              <Obrigatorio />
              <input
                type="email"
                value={form.email}
                onChange={(evento) => atualizar("email", evento.target.value)}
                placeholder="Ex.: maria.silva@empresa.com"
                className={CAMPO}
                required
              />
            </label>
            <label className={ROTULO}>
              CPF
              <input
                value={form.cpf}
                onChange={(evento) => atualizar("cpf", evento.target.value)}
                placeholder="000.000.000-00"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Cargo
              <input
                value={form.cargo}
                onChange={(evento) => atualizar("cargo", evento.target.value)}
                placeholder="Ex.: Analista de Operações"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Cargo visível
              <input
                value={form.cargoVisivel}
                onChange={(evento) => atualizar("cargoVisivel", evento.target.value)}
                placeholder="Ex.: Analista de Operações"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Unidade
              <input
                value={form.unidade}
                onChange={(evento) => atualizar("unidade", evento.target.value)}
                placeholder="Ex.: Matriz"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Departamento
              <select
                value={form.departamento}
                onChange={(evento) => atualizar("departamento", evento.target.value)}
                className={CAMPO}
              >
                <option value="">Selecione um setor</option>
                {setoresLista.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>
            </label>
            <label className={ROTULO}>
              Grupos
              <input
                value={form.grupos}
                onChange={(evento) => atualizar("grupos", evento.target.value)}
                placeholder="Ex.: Grupo A"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Papel
              <input
                value={form.papel}
                onChange={(evento) => atualizar("papel", evento.target.value)}
                placeholder="Ex.: Colaborador"
                className={CAMPO}
              />
            </label>
            <label className={cn(ROTULO, "sm:col-span-2")}>
              Gestor Direto (define o time no organograma)
              <select
                value={form.gestorEmail}
                onChange={(evento) => atualizar("gestorEmail", evento.target.value)}
                className={CAMPO}
              >
                <option value="">Sem gestor direto</option>
                {gestores.map((pessoa) => (
                  <option key={pessoa.email} value={pessoa.email}>
                    {pessoa.nome} ({pessoa.email})
                  </option>
                ))}
              </select>
            </label>
            <label className={ROTULO}>
              Etnia
              <input
                value={form.etnia}
                onChange={(evento) => atualizar("etnia", evento.target.value)}
                placeholder="Ex.: Branca"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Sexo
              <input
                value={form.sexo}
                onChange={(evento) => atualizar("sexo", evento.target.value)}
                placeholder="Ex.: Feminino"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Gênero
              <input
                value={form.genero}
                onChange={(evento) => atualizar("genero", evento.target.value)}
                placeholder="Ex.: Mulher"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Data de Nascimento
              <input
                type="date"
                value={form.dataNascimento}
                onChange={(evento) => atualizar("dataNascimento", evento.target.value)}
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Data de Admissão
              <input
                type="date"
                value={form.dataAdmissao}
                onChange={(evento) => atualizar("dataAdmissao", evento.target.value)}
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Situação
              <input
                value={form.situacao}
                onChange={(evento) => atualizar("situacao", evento.target.value)}
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Origem
              <input
                value={form.origem}
                onChange={(evento) => atualizar("origem", evento.target.value)}
                className={CAMPO}
              />
            </label>

            <fieldset className="grid gap-2 sm:col-span-2">
              <legend className="text-sm font-semibold text-white">Participa da gamificação?</legend>
              <div className="flex gap-6 text-sm text-white">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gamificacao"
                    value="sim"
                    checked={form.gamificacao === "sim"}
                    onChange={() => atualizar("gamificacao", "sim")}
                    className="accent-[oklch(0.82_0.16_80)]"
                  />
                  Sim
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gamificacao"
                    value="nao"
                    checked={form.gamificacao === "nao"}
                    onChange={() => atualizar("gamificacao", "nao")}
                    className="accent-[oklch(0.82_0.16_80)]"
                  />
                  Não
                </label>
              </div>
            </fieldset>

            <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
              <button
                type="button"
                onClick={fechar}
                className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {salvando ? "Salvando..." : "Cadastrar colaborador"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
