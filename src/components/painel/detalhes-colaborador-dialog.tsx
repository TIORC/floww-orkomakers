import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserMinus, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import {
  atualizarColaborador,
  buscarColaborador,
  desligarColaborador,
  type CamposEditaveis,
  type RegistroColaborador,
} from "@/lib/colaborador-detalhe";
import { getIniciais } from "@/lib/iniciais";
import { listarSetores } from "@/lib/cargos";
import { listarPessoasParaGestor } from "@/lib/organograma-dados";
import { cn } from "@/lib/utils";

export type IdentificadorColaborador = { id: string } | { email: string };

const CAMPO =
  "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand";
const ROTULO = "grid gap-1.5 text-sm font-semibold text-white";

// Campos somente leitura, na ordem em que aparecem na tela.
const CAMPOS_LEITURA: { coluna: string; rotulo: string }[] = [
  { coluna: "nome_completo", rotulo: "Nome completo" },
  { coluna: "email", rotulo: "E-mail" },
  { coluna: "matricula", rotulo: "Matrícula" },
  { coluna: "cpf", rotulo: "CPF" },
  { coluna: "cargo", rotulo: "Cargo" },
  { coluna: "cargo_visivel", rotulo: "Cargo visível" },
  { coluna: "departamento", rotulo: "Departamento" },
  { coluna: "unidade", rotulo: "Unidade" },
  { coluna: "papel", rotulo: "Papel" },
  { coluna: "grupos", rotulo: "Grupos" },
  { coluna: "gestor_direto", rotulo: "Gestor direto" },
  { coluna: "gestor_direto_email", rotulo: "E-mail do gestor" },
  { coluna: "situacao", rotulo: "Situação" },
  { coluna: "data_admissao", rotulo: "Data de admissão" },
  { coluna: "data_nascimento", rotulo: "Data de nascimento" },
  { coluna: "etnia", rotulo: "Etnia" },
  { coluna: "sexo", rotulo: "Sexo" },
  { coluna: "genero", rotulo: "Gênero" },
  { coluna: "origem_cadastro", rotulo: "Origem do cadastro" },
  { coluna: "participa_gamificacao", rotulo: "Participa da gamificação" },
  { coluna: "desligamento", rotulo: "Desligamento" },
  { coluna: "ultimo_dia_trabalhado", rotulo: "Último dia trabalhado" },
];

// Data de hoje no formato da planilha (DD/MM/AAAA).
function hojeFormatado() {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, "0");
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${agora.getFullYear()}`;
}

function formularioInicial(registro: RegistroColaborador): CamposEditaveis {
  return {
    nome: registro["nome"] ?? "",
    nome_completo: registro["nome_completo"] ?? "",
    email: registro["email"] ?? "",
    cargo: registro["cargo"] ?? "",
    cargo_visivel: registro["cargo_visivel"] ?? "",
    departamento: registro["departamento"] ?? "",
    unidade: registro["unidade"] ?? "",
    papel: registro["papel"] ?? "",
    situacao: registro["situacao"] ?? "",
    gestor_direto: registro["gestor_direto"] ?? "",
    gestor_direto_email: registro["gestor_direto_email"] ?? "",
  };
}

export function DetalhesColaboradorDialog({
  identificador,
  podeGerenciar,
  onFechar,
}: {
  identificador: IdentificadorColaborador | null;
  podeGerenciar: boolean;
  onFechar: () => void;
}) {
  const queryClient = useQueryClient();
  const [modo, setModo] = useState<"ver" | "editar">("ver");
  const [confirmandoDesligamento, setConfirmandoDesligamento] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<CamposEditaveis | null>(null);

  const chave = identificador ? ("id" in identificador ? `id:${identificador.id}` : `email:${identificador.email}`) : "";

  const { data: registro, isPending, isError } = useQuery({
    queryKey: ["colaborador-detalhe", chave],
    queryFn: () => buscarColaborador(identificador as IdentificadorColaborador),
    enabled: Boolean(identificador),
  });

  const { data: setoresLista = [] } = useQuery({ queryKey: ["setores"], queryFn: listarSetores });
  const { data: gestores = [] } = useQuery({
    queryKey: ["pessoas-gestor"],
    queryFn: listarPessoasParaGestor,
    enabled: modo === "editar",
  });

  // Gestor direto, para mostrar "Responde a:" com a foto, o nome e o cargo dele.
  const emailGestor = registro?.["gestor_direto_email"]?.trim() ?? "";
  const { data: gestorRegistro } = useQuery({
    queryKey: ["colaborador-detalhe", `email:${emailGestor}`],
    queryFn: () => buscarColaborador({ email: emailGestor }),
    enabled: Boolean(emailGestor),
  });

  if (!identificador) return null;

  function fechar() {
    setModo("ver");
    setConfirmandoDesligamento(false);
    setForm(null);
    onFechar();
  }

  function iniciarEdicao() {
    if (!registro) return;
    setForm(formularioInicial(registro));
    setModo("editar");
  }

  async function atualizarListas() {
    await queryClient.invalidateQueries({ queryKey: ["colaborador-detalhe"] });
    await queryClient.invalidateQueries({ queryKey: ["colaboradores-importados"] });
    await queryClient.invalidateQueries({ queryKey: ["organograma"] });
    await queryClient.invalidateQueries({ queryKey: ["colaboradores-diretorio"] });
    await queryClient.invalidateQueries({ queryKey: ["ranking-moedas"] });
  }

  async function salvarEdicao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!registro || !form) return;
    const gestor = gestores.find((pessoa) => pessoa.email === form.gestor_direto_email);
    setSalvando(true);
    try {
      await atualizarColaborador(registro["id"] as string, {
        ...form,
        nome: form.nome.trim(),
        nome_completo: form.nome_completo.trim() || form.nome.trim(),
        gestor_direto: gestor?.nome ?? form.gestor_direto,
      });
      await atualizarListas();
      toast.success("Colaborador atualizado.");
      setModo("ver");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarDesligamento() {
    if (!registro) return;
    setSalvando(true);
    try {
      await desligarColaborador(registro["id"] as string, hojeFormatado());
      await atualizarListas();
      toast.success(`${registro["nome"]} foi desligado(a).`);
      fechar();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível desligar.");
    } finally {
      setSalvando(false);
    }
  }

  const desligado = Boolean(registro?.["desligamento"]?.trim() || registro?.["ultimo_dia_trabalhado"]?.trim());
  const editando = modo === "editar";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalhes-colaborador-titulo"
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

        {isPending ? (
          <p className="py-12 text-center text-sm text-white/80">Carregando informações...</p>
        ) : isError || !registro ? (
          <p className="py-12 text-center text-sm text-white/80">Colaborador não encontrado.</p>
        ) : (
          <>
            <h2 id="detalhes-colaborador-titulo" className="font-display text-xl font-semibold text-white">
              {registro["nome"]}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {desligado ? "Desligado(a)" : registro["situacao"] || "Situação não informada"}
            </p>

            {/* Mesmo layout nos dois modos: foto e gestor à esquerda; informações ou formulário à direita. */}
            <div className="mt-6 grid gap-6 md:grid-cols-[16rem_1fr]">
              <div className="grid content-start gap-4">
                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-panel-active bg-background">
                  {registro["foto_url"] ? (
                    <img src={registro["foto_url"]} alt={`Foto de ${registro["nome"]}`} className="size-full object-cover" />
                  ) : (
                    <span className="font-display text-5xl font-bold text-panel-text">
                      {getIniciais(registro["nome"] ?? "") || "—"}
                    </span>
                  )}
                </div>

                {emailGestor && (
                  <div className="px-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">Responde a:</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel-active text-sm font-bold text-panel-text">
                        {gestorRegistro?.["foto_url"] ? (
                          <img src={gestorRegistro["foto_url"]} alt="" className="size-full object-cover" />
                        ) : (
                          getIniciais(gestorRegistro?.["nome"] || registro["gestor_direto"] || "") || "—"
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-white">
                          {gestorRegistro?.["nome"] || registro["gestor_direto"] || "—"}
                        </p>
                        <p className="break-words text-xs text-panel-label">
                          {gestorRegistro?.["cargo_visivel"] || gestorRegistro?.["cargo"] || "Cargo não informado"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!editando ? (
                <dl className="grid content-start gap-4 sm:grid-cols-2">
                  {CAMPOS_LEITURA.map(({ coluna, rotulo }) => (
                    <div key={coluna} className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-panel-label">{rotulo}</dt>
                      <dd className="break-words text-sm text-white">{registro[coluna] || "—"}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                form && (
                  <form className="grid content-start gap-4 sm:grid-cols-2" onSubmit={salvarEdicao}>
                    <label className={cn(ROTULO, "sm:col-span-2")}>
                      Nome (nome que será exibido)
                      <input
                        value={form.nome}
                        onChange={(evento) => setForm({ ...form, nome: evento.target.value })}
                        className={CAMPO}
                        required
                      />
                    </label>
                    <label className={cn(ROTULO, "sm:col-span-2")}>
                      Nome completo
                      <input
                        value={form.nome_completo}
                        onChange={(evento) => setForm({ ...form, nome_completo: evento.target.value })}
                        className={CAMPO}
                      />
                    </label>
                    <label className={ROTULO}>
                      E-mail
                      <input
                        type="email"
                        value={form.email}
                        onChange={(evento) => setForm({ ...form, email: evento.target.value })}
                        className={CAMPO}
                        required
                      />
                    </label>
                    <label className={ROTULO}>
                      Situação
                      <input
                        value={form.situacao}
                        onChange={(evento) => setForm({ ...form, situacao: evento.target.value })}
                        className={CAMPO}
                      />
                    </label>
                    <label className={ROTULO}>
                      Cargo
                      <input
                        value={form.cargo}
                        onChange={(evento) => setForm({ ...form, cargo: evento.target.value })}
                        className={CAMPO}
                      />
                    </label>
                    <label className={ROTULO}>
                      Cargo visível
                      <input
                        value={form.cargo_visivel}
                        onChange={(evento) => setForm({ ...form, cargo_visivel: evento.target.value })}
                        className={CAMPO}
                      />
                    </label>
                    <label className={ROTULO}>
                      Departamento
                      <select
                value={form.departamento}
                onChange={(evento) => setForm({ ...form, departamento: evento.target.value })}
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
                      Unidade
                      <input
                        value={form.unidade}
                        onChange={(evento) => setForm({ ...form, unidade: evento.target.value })}
                        className={CAMPO}
                      />
                    </label>
                    <label className={ROTULO}>
                      Papel
                      <input
                        value={form.papel}
                        onChange={(evento) => setForm({ ...form, papel: evento.target.value })}
                        className={CAMPO}
                      />
                    </label>
                    <label className={ROTULO}>
                      Gestor direto
                      <select
                        value={form.gestor_direto_email}
                        onChange={(evento) => setForm({ ...form, gestor_direto_email: evento.target.value })}
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

                    <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => setModo("ver")}
                        className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={salvando}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110 disabled:opacity-60"
                      >
                        {salvando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                        Salvar alterações
                      </button>
                    </div>
                  </form>
                )
              )}
            </div>

            {!editando && podeGerenciar && (
              <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-panel-active pt-5">
                {confirmandoDesligamento ? (
                  <>
                    <span className="self-center text-sm text-white/80">
                      Confirmar desligamento em {hojeFormatado()}?
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmandoDesligamento(false)}
                      className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmarDesligamento}
                      disabled={salvando}
                      className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                    >
                      {salvando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                      Confirmar desligamento
                    </button>
                  </>
                ) : (
                  <>
                    {!desligado && (
                      <button
                        type="button"
                        onClick={() => setConfirmandoDesligamento(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-destructive px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
                      >
                        <UserMinus className="size-4" aria-hidden />
                        Desligar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={iniciarEdicao}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
                    >
                      <Pencil className="size-4" aria-hidden />
                      Editar
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
