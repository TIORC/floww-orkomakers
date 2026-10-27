import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { CartaoColaborador } from "@/components/ferias/cartao-colaborador";
import { CalendarioAnual, type SelecaoPeriodo } from "@/components/ferias/calendario-anual";
import { CartaoProgramacao } from "@/components/ferias/cartao-programacao";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { listarEquipeDireta } from "@/lib/colaboradores-diretorio";
import {
  listarEmailsComFeriasProgramadas,
  listarFeriasProgramadas,
  removerFeriasProgramadas,
  salvarFeriasProgramadas,
} from "@/lib/ferias-programadas";
import {
  podeProgramarFerias,
  podeVerProgramacaoFerias,
  podeVerTodosOsSetores,
  useUsuarioLogado,
} from "@/hooks/use-usuario-logado";
import { buscarPessoasOrganograma } from "@/lib/organograma-dados";
import { motivoDeBloqueioDoInicio } from "@/lib/ferias-regras";
import { ordenarPeriodo } from "@/lib/calendario";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/programacao-ferias")({
  head: () => ({
    meta: [{ title: "Programação de Férias — Orcoma Orkomakers" }],
  }),
  component: ProgramacaoFeriasPage,
});

const CAMPO =
  "h-10 min-w-[16rem] rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand";

type PessoaDaEquipe = { email: string; nome: string };

// Cartão de um membro da equipe. Quem programa pode clicar para escolher a pessoa; os demais só veem.
function CartaoDaEquipe({
  pessoa,
  podeEscolher,
  selecionado,
  aoEscolher,
  children,
}: {
  pessoa: PessoaDaEquipe;
  podeEscolher: boolean;
  selecionado: boolean;
  aoEscolher: (pessoa: PessoaDaEquipe) => void;
  children: ReactNode;
}) {
  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      aoEscolher(pessoa);
    }
  }

  return (
    <div
      role={podeEscolher ? "button" : undefined}
      tabIndex={podeEscolher ? 0 : undefined}
      aria-pressed={podeEscolher ? selecionado : undefined}
      onClick={podeEscolher ? () => aoEscolher(pessoa) : undefined}
      onKeyDown={podeEscolher ? aoTeclar : undefined}
      className={cn(
        "rounded-2xl transition",
        podeEscolher &&
          "cursor-pointer hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        selecionado && "ring-2 ring-brand",
      )}
    >
      {children}
    </div>
  );
}

function ProgramacaoFeriasPage() {
  const { data: usuario, isPending: carregandoUsuario } = useUsuarioLogado();
  const queryClient = useQueryClient();
  const acesso = podeVerProgramacaoFerias(usuario);
  const veTodosOsSetores = podeVerTodosOsSetores(usuario);
  const podeProgramar = podeProgramarFerias(usuario);
  const [gestorEscolhido, setGestorEscolhido] = useState<string | null>(null);
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<PessoaDaEquipe | null>(null);
  const [selecao, setSelecao] = useState<SelecaoPeriodo>({ inicio: null, fim: null });
  const [salvando, setSalvando] = useState(false);
  const [remocaoPendente, setRemocaoPendente] = useState<string | null>(null);

  // A equipe segue a hierarquia do organograma (gestor direto), não o setor.
  // Quem vê todos os setores escolhe um gestor; os outros veem sempre a própria equipe.
  const emailDoUsuario = usuario?.email ?? "";
  // Por padrão, abre na linhagem do gestor direto de quem está logado.
  const gestorDoUsuario = usuario?.gestorDiretoEmail || emailDoUsuario;
  const emailGestor = veTodosOsSetores ? (gestorEscolhido ?? gestorDoUsuario) : emailDoUsuario;
  const { data: pessoasOrganograma = [] } = useQuery({
    queryKey: ["organograma"],
    queryFn: buscarPessoasOrganograma,
    enabled: acesso,
  });
  // Gestores são as pessoas que têm alguém respondendo a elas.
  const gestores = useMemo(() => {
    const comEquipe = new Set(
      pessoasOrganograma.map((pessoa) => pessoa.gestorEmail.trim().toLowerCase()).filter(Boolean),
    );
    return pessoasOrganograma
      .filter((pessoa) => comEquipe.has(pessoa.email.trim().toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [pessoasOrganograma]);
  const gestorAlvo = pessoasOrganograma.find(
    (pessoa) => pessoa.email.trim().toLowerCase() === emailGestor.trim().toLowerCase(),
  );
  const equipeDireta = useQuery({
    queryKey: ["equipe-direta", emailGestor],
    queryFn: () => listarEquipeDireta(emailGestor),
    enabled: acesso && Boolean(emailGestor),
  });
  const equipe = useMemo(() => equipeDireta.data ?? [], [equipeDireta.data]);
  // Líderes de sub-célula ficam logo abaixo do líder; o restante da equipe vem depois.
  const subLideres = useMemo(() => equipe.filter((pessoa) => pessoa.subliderArea.trim()), [equipe]);
  const demais = useMemo(() => equipe.filter((pessoa) => !pessoa.subliderArea.trim()), [equipe]);
  const lideres = gestorAlvo
    ? [
        {
          id: gestorAlvo.id,
          nome: gestorAlvo.nome,
          cargoVisivel: gestorAlvo.cargo,
          fotoUrl: gestorAlvo.fotoUrl ?? "",
          dataAdmissao: gestorAlvo.dataAdmissao,
        },
      ]
    : [];

  // Quem programa vê o calendário da pessoa escolhida; os demais veem só o próprio calendário.
  const emailDoCalendario = podeProgramar ? (colaboradorSelecionado?.email ?? "") : emailDoUsuario;
  const feriasProgramadas = useQuery({
    queryKey: ["ferias-programadas", emailDoCalendario],
    queryFn: () => listarFeriasProgramadas(emailDoCalendario),
    enabled: acesso && Boolean(emailDoCalendario),
  });
  const programados = useMemo(() => feriasProgramadas.data ?? [], [feriasProgramadas.data]);
  // Quem já tem férias programadas ganha o selo "Programado!" no card (quando não está selecionado).
  const emailsDaEquipe = useMemo(
    () => [...equipe.map((pessoa) => pessoa.email), ...(gestorAlvo ? [gestorAlvo.email] : [])],
    [equipe, gestorAlvo],
  );
  const comFeriasProgramadas = useQuery({
    queryKey: ["ferias-programadas-equipe", emailsDaEquipe.join("|")],
    queryFn: () => listarEmailsComFeriasProgramadas(emailsDaEquipe),
    enabled: acesso && emailsDaEquipe.length > 0,
  });
  const emailsProgramados = useMemo(
    () => new Set((comFeriasProgramadas.data ?? []).map((email) => email.toLowerCase())),
    [comFeriasProgramadas.data],
  );
  const estaProgramado = (email: string) =>
    emailsProgramados.has(email.toLowerCase()) && colaboradorSelecionado?.email !== email;

  // Datas em AAAA-MM-DD viram DD/MM/AAAA para aparecer no card.
  const periodosFormatados = useMemo(
    () =>
      programados.map((p) => ({
        id: p.id,
        texto: `${p.inicio.split("-").reverse().join("/")} a ${p.fim.split("-").reverse().join("/")}`,
      })),
    [programados],
  );

  // Pede confirmação no próprio app antes de remover a programação escolhida.
  function removerFerias(id: string) {
    if (!podeProgramar || !colaboradorSelecionado) return;
    setRemocaoPendente(id);
  }

  async function confirmarRemocao() {
    const id = remocaoPendente;
    setRemocaoPendente(null);
    if (!id || !colaboradorSelecionado) return;
    try {
      await removerFeriasProgramadas(id);
      await queryClient.invalidateQueries({ queryKey: ["ferias-programadas", colaboradorSelecionado.email] });
      await queryClient.invalidateQueries({ queryKey: ["ferias-programadas-equipe"] });
      toast.success("Programação removida.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível remover a programação.");
    }
  }

  function escolherColaborador(pessoa: PessoaDaEquipe) {
    if (!podeProgramar) return;
    setColaboradorSelecionado(pessoa);
    setSelecao({ inicio: null, fim: null });
  }

  function trocarGestor(email: string) {
    setGestorEscolhido(email);
    setColaboradorSelecionado(null);
    setSelecao({ inicio: null, fim: null });
  }

  // Primeiro clique escolhe o início, o segundo escolhe o fim; um terceiro recomeça a escolha.
  // O início não pode ser nos 2 dias antes de feriado ou do descanso semanal; o calendário já bloqueia esses dias.
  function escolherDia(iso: string) {
    setSelecao((atual) => {
      if (atual.inicio && !atual.fim) return { inicio: atual.inicio, fim: iso };
      return motivoDeBloqueioDoInicio(iso) ? atual : { inicio: iso, fim: null };
    });
  }

  // Programar só registra o período. Não efetiva as férias.
  async function programarFerias() {
    if (!podeProgramar || !colaboradorSelecionado || !selecao.inicio || !selecao.fim) return;
    const periodo = ordenarPeriodo(selecao.inicio, selecao.fim);
    const sobrepoe = programados.some((p) => periodo.inicio <= p.fim && periodo.fim >= p.inicio);
    if (sobrepoe) {
      toast.error("Já existem férias programadas em parte desse período.");
      return;
    }
    setSalvando(true);
    try {
      await salvarFeriasProgramadas({
        colaboradorEmail: colaboradorSelecionado.email,
        colaboradorNome: colaboradorSelecionado.nome,
        inicio: periodo.inicio,
        fim: periodo.fim,
        programadoPorEmail: emailDoUsuario,
      });
      await queryClient.invalidateQueries({ queryKey: ["ferias-programadas", colaboradorSelecionado.email] });
      await queryClient.invalidateQueries({ queryKey: ["ferias-programadas-equipe"] });
      toast.success(`Férias programadas para ${colaboradorSelecionado.nome}.`);
      setSelecao({ inicio: null, fim: null });
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível programar as férias.");
    } finally {
      setSalvando(false);
    }
  }

  // Visitantes não têm acesso a esta página.
  if (!carregandoUsuario && !acesso) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <PainelSidebar />
        <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
          <h1 className="font-display text-3xl font-semibold text-white">Programação de Férias</h1>
          <p className="mt-4 text-sm text-white/80">Você não tem acesso a esta página.</p>
        </main>
        <PerfilFlutuante />
      </div>
    );
  }

  const escolhendoColaborador = podeProgramar && colaboradorSelecionado !== null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white">
              Programação de Férias
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              {podeProgramar
                ? "Escolha um colaborador da equipe e programe o período de férias dele. Programar não efetiva as férias."
                : "Veja o calendário das suas férias programadas pelo seu gestor."}
            </p>
          </div>
          {veTodosOsSetores ? (
            <div className="grid gap-2">
              <label htmlFor="filtro-gestor" className="text-sm font-semibold text-white">
                Gestor
              </label>
              {/* A foto do gestor escolhido vira o fundo do seletor; o escurecimento deixa o nome legível. */}
              <div
                className="relative overflow-hidden rounded-lg border border-brand bg-cover bg-center"
                style={gestorAlvo?.fotoUrl ? { backgroundImage: `url(${gestorAlvo.fotoUrl})` } : undefined}
              >
                <div className="absolute inset-0 bg-slate-900/70" aria-hidden />
                <select
                  id="filtro-gestor"
                  value={emailGestor}
                  onChange={(evento) => trocarGestor(evento.target.value)}
                  className="relative h-14 min-w-[16rem] w-full bg-transparent px-3 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-brand [text-shadow:0_1px_3px_rgb(0_0_0/0.8)]"
                >
                  {emailGestor &&
                    !gestores.some((gestor) => gestor.email.toLowerCase() === emailGestor.toLowerCase()) && (
                      <option value={emailGestor} className="bg-panel text-white">
                        {gestorAlvo?.nome || emailGestor}
                      </option>
                    )}
                  {gestores.map((gestor) => (
                    <option key={gestor.email} value={gestor.email} className="bg-panel text-white">
                      {gestor.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/80">
              Equipe de: <span className="font-semibold text-white">{gestorAlvo?.nome || "—"}</span>
            </p>
          )}
        </header>

        <section aria-label="Equipe" className="mt-8">
          <h2 className="mb-4 flex items-baseline gap-2 font-display text-xl font-semibold text-white">
            Equipe
            {equipeDireta.isSuccess && (
              <span className="text-sm font-normal text-white/60">
                {equipe.length} {equipe.length === 1 ? "pessoa" : "pessoas"}
              </span>
            )}
          </h2>

          {equipeDireta.isError ? (
            <p className="text-sm text-red-400">Não consegui carregar a equipe.</p>
          ) : equipeDireta.isPending ? (
            <p className="text-sm text-white/70">Carregando…</p>
          ) : equipe.length === 0 ? (
            <p className="text-sm text-white/70">Nenhum colaborador ativo responde a este gestor.</p>
          ) : (
            <div className="grid gap-6">
              {lideres.length > 0 && (
                <ul aria-label="Liderança" className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {lideres.map((lider) => (
                    <li key={lider.id}>
                      <CartaoColaborador
                        lider
                        nome={lider.nome}
                        cargo={lider.cargoVisivel}
                        fotoUrl={lider.fotoUrl}
                        dataAdmissao={lider.dataAdmissao}
                        programado={gestorAlvo ? estaProgramado(gestorAlvo.email) : false}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {subLideres.length > 0 && (
                <ul
                  aria-label="Líderes de Sub-Célula"
                  className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                >
                  {subLideres.map((colaborador) => (
                    <li key={colaborador.id}>
                      <CartaoDaEquipe
                        pessoa={colaborador}
                        podeEscolher={podeProgramar}
                        selecionado={colaboradorSelecionado?.email === colaborador.email}
                        aoEscolher={escolherColaborador}
                      >
                        <CartaoColaborador
                          nome={colaborador.nome}
                          cargo={colaborador.cargoVisivel}
                          fotoUrl={colaborador.fotoUrl}
                          dataAdmissao={colaborador.dataAdmissao}
                          subLider={colaborador.subliderArea}
                          programado={estaProgramado(colaborador.email)}
                          feriasProgramadas={
                            colaboradorSelecionado?.email === colaborador.email ? periodosFormatados : []
                          }
                          aoRemoverFerias={podeProgramar ? removerFerias : undefined}
                        />
                      </CartaoDaEquipe>
                    </li>
                  ))}
                </ul>
              )}
              {demais.length > 0 && (
                <ul
                  aria-label="Equipe"
                  className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                >
                  {demais.map((colaborador) => (
                    <li key={colaborador.id}>
                      <CartaoDaEquipe
                        pessoa={colaborador}
                        podeEscolher={podeProgramar}
                        selecionado={colaboradorSelecionado?.email === colaborador.email}
                        aoEscolher={escolherColaborador}
                      >
                        <CartaoColaborador
                          nome={colaborador.nome}
                          cargo={colaborador.cargoVisivel}
                          fotoUrl={colaborador.fotoUrl}
                          dataAdmissao={colaborador.dataAdmissao}
                          subLider={colaborador.subliderArea}
                          programado={estaProgramado(colaborador.email)}
                          feriasProgramadas={
                            colaboradorSelecionado?.email === colaborador.email ? periodosFormatados : []
                          }
                          aoRemoverFerias={podeProgramar ? removerFerias : undefined}
                        />
                      </CartaoDaEquipe>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <section aria-label="Calendário do ano" className="mt-10">
          {escolhendoColaborador && (
            <CartaoProgramacao
              nome={colaboradorSelecionado.nome}
              selecao={selecao}
              salvando={salvando}
              aoProgramar={programarFerias}
              aoLimpar={() => setSelecao({ inicio: null, fim: null })}
            />
          )}
          {podeProgramar && !colaboradorSelecionado && (
            <p className="mb-4 text-sm text-white/80">
              Selecione um colaborador da equipe para programar as férias dele.
            </p>
          )}
          <CalendarioAnual
            ano={ano}
            aoMudarAno={setAno}
            selecao={selecao}
            programados={programados}
            {...(escolhendoColaborador ? { aoEscolherDia: escolherDia, motivoDeBloqueioDoInicio } : {})}
          />
        </section>
      </main>
      <PerfilFlutuante />

      {remocaoPendente && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remocao-ferias-titulo"
            aria-describedby="remocao-ferias-texto"
            className="w-full max-w-md rounded-2xl border border-brand bg-panel p-6 shadow-2xl shadow-brand/10"
          >
            <h3 id="remocao-ferias-titulo" className="font-display text-lg font-semibold text-brand">
              Remover programação de férias?
            </h3>
            <p id="remocao-ferias-texto" className="mt-3 text-sm text-white/85">
              A programação de férias de {colaboradorSelecionado?.nome} será removida. Essa ação não
              pode ser desfeita.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setRemocaoPendente(null)}
                className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRemocao}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
