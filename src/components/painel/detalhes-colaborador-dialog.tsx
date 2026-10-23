import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, Mail, PauseCircle, UserMinus, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { enviarPrimeiroAcesso } from "@/lib/emails.functions";

import {
  atualizarColaborador,
  atualizarNivelAcesso,
  buscarColaborador,
  transferirOuvidor,
  desligarColaborador,
  desativarColaborador,
  LIMITE_MOTIVO_OUTROS,
  MOTIVOS_DESATIVACAO,
  MOTIVOS_DESLIGAMENTO,
  TIPOS_DESLIGAMENTO,
  type CamposEditaveis,
  type MotivoDesativacao,
  type MotivoDesligamento,
  type NivelAcesso,
  type RegistroColaborador,
  type TipoDesligamento,
} from "@/lib/colaborador-detalhe";
import { SeletorPapeis } from "@/components/painel/seletor-papeis";
import { podeAlterarPapeis, podeTransferirOuvidor, useUsuarioLogado } from "@/hooks/use-usuario-logado";
import { getIniciais } from "@/lib/iniciais";
import { listarSetores } from "@/lib/cargos";
import { listarPessoasParaGestor } from "@/lib/organograma-dados";
import { cn } from "@/lib/utils";

export type IdentificadorColaborador = { id: string } | { email: string };

type AbaDetalhes = "informacoes" | "permissoes";

const ABAS_DETALHES: { valor: AbaDetalhes; rotulo: string }[] = [
  { valor: "informacoes", rotulo: "Informações Gerais" },
  { valor: "permissoes", rotulo: "Permissões" },
];

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
  const [aba, setAba] = useState<AbaDetalhes>("informacoes");
  const [confirmandoDesligamento, setConfirmandoDesligamento] = useState(false);
  const [confirmandoDesativacao, setConfirmandoDesativacao] = useState(false);
  const [motivoDesativacao, setMotivoDesativacao] = useState<MotivoDesativacao | "">("");
  const [motivoDesativacaoOutros, setMotivoDesativacaoOutros] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [enviandoAcesso, setEnviandoAcesso] = useState(false);
  const [acessoEnviado, setAcessoEnviado] = useState(false);

  // Mostra a confirmação verde por 4 segundos e volta ao botão normal.
  useEffect(() => {
    if (!acessoEnviado) return;
    const prazo = setTimeout(() => setAcessoEnviado(false), 4000);
    return () => clearTimeout(prazo);
  }, [acessoEnviado]);
  const [salvandoNivel, setSalvandoNivel] = useState(false);
  const [form, setForm] = useState<CamposEditaveis | null>(null);
  const [tipoDesligamento, setTipoDesligamento] = useState<TipoDesligamento | "">("");
  const [motivoDesligamento, setMotivoDesligamento] = useState<MotivoDesligamento | "">("");
  const [motivoOutros, setMotivoOutros] = useState("");

  const chave = identificador
    ? "id" in identificador
      ? `id:${identificador.id}`
      : `email:${identificador.email}`
    : "";

  const {
    data: registro,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["colaborador-detalhe", chave],
    queryFn: () => buscarColaborador(identificador as IdentificadorColaborador),
    enabled: Boolean(identificador),
  });

  const { data: setoresLista = [] } = useQuery({ queryKey: ["setores"], queryFn: listarSetores });
  const { data: usuarioLogado } = useUsuarioLogado();
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

  function limparDesligamento() {
    setConfirmandoDesligamento(false);
    setTipoDesligamento("");
    setMotivoDesligamento("");
    setMotivoOutros("");
  }

  function limparDesativacao() {
    setConfirmandoDesativacao(false);
    setMotivoDesativacao("");
    setMotivoDesativacaoOutros("");
  }

  function fechar() {
    setModo("ver");
    setAba("informacoes");
    limparDesligamento();
    limparDesativacao();
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
    // Perfil flutuante lê o setor do usuário logado: sem isso, mostra o departamento antigo.
    await queryClient.invalidateQueries({ queryKey: ["usuario-logado"] });
  }

  // Papéis funcionam como escolha única: marcar um desmarca o anterior. Desmarcar sozinho não faz nada.
  async function alterarNivel(nivel: NivelAcesso) {
    // O papel Desenvolvedor do Sistema é fixo da conta TI Maracas: não é atribuído nem removido por aqui.
    if (!registro || nivel === nivelAtual || nivel === "desenvolvedor") return;
    setSalvandoNivel(true);
    try {
      await atualizarNivelAcesso(registro["id"] as string, nivel);
      await atualizarListas();
      toast.success("Papel atualizado.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível alterar o papel.");
    } finally {
      setSalvandoNivel(false);
    }
  }

  // Transfere o cargo de Ouvidor para a pessoa aberta no modal (só Administradores podem receber).
  async function transferirCargoOuvidor() {
    if (!registro) return;
    setSalvandoNivel(true);
    try {
      await transferirOuvidor(registro["id"] as string);
      await queryClient.invalidateQueries({ queryKey: ["usuario-logado"] });
      await atualizarListas();
      toast.success(`Cargo de Ouvidor transferido para ${registro["nome"]}.`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível transferir o cargo.");
    } finally {
      setSalvandoNivel(false);
    }
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

  const desligamentoValido = Boolean(
    tipoDesligamento &&
    motivoDesligamento &&
    (motivoDesligamento !== "Outros" || motivoOutros.trim()),
  );

  async function confirmarDesligamento() {
    if (!registro || !tipoDesligamento || !motivoDesligamento) return;
    setSalvando(true);
    try {
      await desligarColaborador(registro["id"] as string, {
        dataDesligamento: hojeFormatado(),
        tipo: tipoDesligamento,
        motivo: motivoDesligamento,
        motivoOutros,
      });
      await atualizarListas();
      toast.success(`${registro["nome"]} foi desligado(a).`);
      fechar();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível desligar.");
    } finally {
      setSalvando(false);
    }
  }

  // Desativação: afastamento temporário. Pede o motivo e grava a situação como Desativado.
  const desativacaoValida = Boolean(
    motivoDesativacao && (motivoDesativacao !== "Outros" || motivoDesativacaoOutros.trim()),
  );

  async function confirmarDesativacao() {
    if (!registro || !motivoDesativacao) return;
    setSalvando(true);
    try {
      await desativarColaborador(registro["id"] as string, {
        motivo: motivoDesativacao,
        motivoOutros: motivoDesativacaoOutros,
      });
      await atualizarListas();
      toast.success(`${registro["nome"]} foi desativado(a).`);
      fechar();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível desativar.");
    } finally {
      setSalvando(false);
    }
  }

  // Envia o link para criar a senha (conta já existente) ou o convite (conta ainda não criada).
  async function enviarInstrucoesAcesso() {
    if (!registro?.["email"]) return;
    setEnviandoAcesso(true);
    try {
      const resultado = await enviarPrimeiroAcesso({
        data: { email: registro["email"], origem: window.location.origin },
      });
      if (resultado.status === "enviado") setAcessoEnviado(true);
      else toast.warning("Não foi possível enviar as instruções de primeiro acesso.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar as instruções.");
    } finally {
      setEnviandoAcesso(false);
    }
  }

  const desligado = Boolean(
    registro?.["desligamento"]?.trim() || registro?.["ultimo_dia_trabalhado"]?.trim(),
  );
  const desativado = registro?.["situacao"]?.trim().toLowerCase() === "desativado";
  const editando = modo === "editar";
  const nivelAtual = (registro?.["nivel_acesso"] ?? "colaborador") as NivelAcesso;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalhes-colaborador-titulo"
        className="relative max-h-[92vh] w-[95vw] max-w-[96rem] overflow-y-auto rounded-2xl border border-panel-active bg-panel p-6 shadow-2xl sm:p-8"
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
            <h2
              id="detalhes-colaborador-titulo"
              className="font-display text-xl font-semibold text-white"
            >
              {registro["nome"]}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {desligado
                ? "Desligado(a)"
                : desativado
                  ? "Desativado(a)"
                  : registro["situacao"] || "Situação não informada"}
            </p>

            <div role="tablist" aria-label="Seções" className="mt-5 flex justify-center gap-2">
              {ABAS_DETALHES.map(({ valor, rotulo }) => (
                <button
                  key={valor}
                  type="button"
                  role="tab"
                  aria-selected={aba === valor}
                  onClick={() => setAba(valor)}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-semibold transition",
                    aba === valor
                      ? "bg-brand text-slate-900 shadow"
                      : "border border-panel-active text-white hover:bg-panel-active",
                  )}
                >
                  {rotulo}
                </button>
              ))}
            </div>

            {/* Informações Gerais: foto, dados e papéis. Permissões: foto, gestor e papéis. */}
            <div
              className={cn(
                "mt-6 grid gap-6 md:grid-cols-[16rem_1fr]",
                aba === "informacoes" && "xl:grid-cols-[16rem_1fr_26rem]",
              )}
            >
              <div className="grid content-start gap-4">
                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-panel-active bg-background">
                  {registro["foto_url"] ? (
                    <img
                      src={registro["foto_url"]}
                      alt={`Foto de ${registro["nome"]}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-5xl font-bold text-panel-text">
                      {getIniciais(registro["nome"] ?? "") || "—"}
                    </span>
                  )}
                </div>

                {emailGestor && (
                  <div className="px-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                      Responde a:
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel-active text-sm font-bold text-panel-text">
                        {gestorRegistro?.["foto_url"] ? (
                          <img
                            src={gestorRegistro["foto_url"]}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          getIniciais(
                            gestorRegistro?.["nome"] || registro["gestor_direto"] || "",
                          ) || "—"
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-white">
                          {gestorRegistro?.["nome"] || registro["gestor_direto"] || "—"}
                        </p>
                        <p className="break-words text-xs text-panel-label">
                          {gestorRegistro?.["cargo_visivel"] ||
                            gestorRegistro?.["cargo"] ||
                            "Cargo não informado"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {aba === "informacoes" && (!editando ? (
                <dl className="grid content-start gap-4 sm:grid-cols-2">
                  {CAMPOS_LEITURA.map(({ coluna, rotulo }) => (
                    <div key={coluna} className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-panel-label">
                        {rotulo}
                      </dt>
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
                        onChange={(evento) =>
                          setForm({ ...form, nome_completo: evento.target.value })
                        }
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
                        onChange={(evento) =>
                          setForm({ ...form, cargo_visivel: evento.target.value })
                        }
                        className={CAMPO}
                      />
                    </label>
                    <label className={ROTULO}>
                      Departamento
                      <select
                        value={form.departamento}
                        onChange={(evento) =>
                          setForm({ ...form, departamento: evento.target.value })
                        }
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
                        onChange={(evento) =>
                          setForm({ ...form, gestor_direto_email: evento.target.value })
                        }
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
              ))}

              <SeletorPapeis
                nivelAtual={nivelAtual}
                desabilitado={!podeAlterarPapeis(usuarioLogado) || salvandoNivel}
                onAlterar={alterarNivel}
                ouvidor={Boolean(registro["ouvidor"])}
                podeTransferirOuvidor={podeTransferirOuvidor(usuarioLogado)}
                onTransferirOuvidor={transferirCargoOuvidor}
                mostrarNiveis={aba === "informacoes"}
                mostrarOuvidor={aba === "permissoes"}
              />
            </div>

            {!editando && podeGerenciar && confirmandoDesativacao && (
              <div className="mt-8 grid gap-5 border-t border-panel-active pt-5 sm:grid-cols-2">
                <h3 className="text-base font-semibold text-white sm:col-span-2">
                  Motivo da desativação
                </h3>
                <label className={ROTULO}>
                  Motivo da desativação
                  <select
                    value={motivoDesativacao}
                    onChange={(evento) =>
                      setMotivoDesativacao(evento.target.value as MotivoDesativacao | "")
                    }
                    className={CAMPO}
                  >
                    <option value="">Selecione o motivo</option>
                    {MOTIVOS_DESATIVACAO.map((motivo) => (
                      <option key={motivo} value={motivo}>
                        {motivo}
                      </option>
                    ))}
                  </select>
                </label>
                {motivoDesativacao === "Outros" && (
                  <label className={cn(ROTULO, "sm:col-span-2")}>
                    Descreva o motivo da desativação
                    <textarea
                      value={motivoDesativacaoOutros}
                      maxLength={LIMITE_MOTIVO_OUTROS}
                      onChange={(evento) => setMotivoDesativacaoOutros(evento.target.value)}
                      rows={3}
                      className={cn(CAMPO, "h-auto py-2")}
                    />
                    <span className="text-right text-xs font-normal text-white/70">
                      {motivoDesativacaoOutros.length.toLocaleString("pt-BR")} /{" "}
                      {LIMITE_MOTIVO_OUTROS.toLocaleString("pt-BR")} caracteres
                    </span>
                  </label>
                )}
              </div>
            )}

            {!editando && podeGerenciar && confirmandoDesligamento && (
              <div className="mt-8 grid gap-5 border-t border-panel-active pt-5 sm:grid-cols-2">
                <h3 className="text-base font-semibold text-white sm:col-span-2">
                  Motivo do desligamento
                </h3>
                <label className={ROTULO}>
                  Motivo do desligamento
                  <select
                    value={motivoDesligamento}
                    onChange={(evento) =>
                      setMotivoDesligamento(evento.target.value as MotivoDesligamento | "")
                    }
                    className={CAMPO}
                  >
                    <option value="">Selecione o motivo</option>
                    {MOTIVOS_DESLIGAMENTO.map((motivo) => (
                      <option key={motivo} value={motivo}>
                        {motivo}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={ROTULO}>
                  Tipo
                  <select
                    value={tipoDesligamento}
                    onChange={(evento) =>
                      setTipoDesligamento(evento.target.value as TipoDesligamento | "")
                    }
                    className={CAMPO}
                  >
                    <option value="">Selecione o tipo</option>
                    {TIPOS_DESLIGAMENTO.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </label>
                {motivoDesligamento === "Outros" && (
                  <label className={cn(ROTULO, "sm:col-span-2")}>
                    Descreva os motivos que levaram ao desligamento
                    <textarea
                      value={motivoOutros}
                      maxLength={LIMITE_MOTIVO_OUTROS}
                      onChange={(evento) => setMotivoOutros(evento.target.value)}
                      rows={5}
                      className={cn(CAMPO, "h-auto py-2")}
                    />
                    <span className="text-right text-xs font-normal text-white/70">
                      {motivoOutros.length.toLocaleString("pt-BR")} /{" "}
                      {LIMITE_MOTIVO_OUTROS.toLocaleString("pt-BR")} caracteres
                    </span>
                  </label>
                )}
              </div>
            )}

            {!editando && podeGerenciar && (
              <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-panel-active pt-5">
                {confirmandoDesativacao ? (
                  <>
                    <span className="self-center text-sm text-white/80">
                      Confirmar a desativação de {registro["nome"]}?
                    </span>
                    <button
                      type="button"
                      onClick={limparDesativacao}
                      className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmarDesativacao}
                      disabled={salvando || !desativacaoValida}
                      className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-60"
                    >
                      {salvando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                      Confirmar desativação
                    </button>
                  </>
                ) : confirmandoDesligamento ? (
                  <>
                    <span className="self-center text-sm text-white/80">
                      Confirmar desligamento em {hojeFormatado()}?
                    </span>
                    <button
                      type="button"
                      onClick={limparDesligamento}
                      className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmarDesligamento}
                      disabled={salvando || !desligamentoValido}
                      className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                    >
                      {salvando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                      Confirmar desligamento
                    </button>
                  </>
                ) : (
                  <>
                    {registro?.["email"] && (
                      <motion.button
                        type="button"
                        onClick={enviarInstrucoesAcesso}
                        disabled={enviandoAcesso || acessoEnviado}
                        animate={
                          acessoEnviado
                            ? { backgroundColor: "#16a34a", borderColor: "#16a34a", color: "#ffffff" }
                            : { backgroundColor: "rgba(250,204,21,0)", borderColor: "#facc15", color: "#facc15" }
                        }
                        transition={{ duration: 0.3 }}
                        className="inline-flex min-w-[17rem] items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-brand/10 disabled:cursor-default disabled:hover:bg-transparent disabled:opacity-90"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {acessoEnviado ? (
                            <motion.span
                              key="enviado"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.25 }}
                              className="inline-flex items-center gap-2"
                            >
                              <CheckCircle2 className="size-4" aria-hidden />
                              E-mail enviado com sucesso!
                            </motion.span>
                          ) : (
                            <motion.span
                              key="enviar"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="inline-flex items-center gap-2"
                            >
                              {enviandoAcesso ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                              ) : (
                                <Mail className="size-4" aria-hidden />
                              )}
                              Enviar instruções de primeiro acesso (e-mail)
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    )}
                    {!desligado && !desativado && (
                      <button
                        type="button"
                        onClick={() => setConfirmandoDesativacao(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/10"
                      >
                        <PauseCircle className="size-4" aria-hidden />
                        Desativar
                      </button>
                    )}
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
