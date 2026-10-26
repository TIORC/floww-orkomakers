import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { CartaoColaborador } from "@/components/ferias/cartao-colaborador";
import { CalendarioAnual, type SelecaoPeriodo } from "@/components/ferias/calendario-anual";
import { CartaoSolicitacao, ResumoSelecao } from "@/components/ferias/solicitacao-ferias";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import {
  listarColaboradoresDoSetor,
  listarOpcoesDiretorio,
  separarLideres,
} from "@/lib/colaboradores-diretorio";
import {
  podeSolicitarFeriasDemo,
  podeVerProgramacaoFerias,
  podeVerTodosOsSetores,
  useUsuarioLogado,
} from "@/hooks/use-usuario-logado";
import { buscarColaborador } from "@/lib/colaborador-detalhe";
import {
  carregarSolicitacao,
  criarSolicitacao,
  salvarSolicitacao,
  type SolicitacaoFerias,
} from "@/lib/ferias-solicitacao";
import { motivoDeBloqueioDoInicio } from "@/lib/ferias-regras";
import { agruparSetores, chaveDoSetor } from "@/lib/setores-agrupados";

export const Route = createFileRoute("/programacao-ferias")({
  head: () => ({
    meta: [{ title: "Programação de Férias — Orcoma Orkomakers" }],
  }),
  component: ProgramacaoFeriasPage,
});

const CAMPO =
  "h-10 min-w-[16rem] rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand";

function ProgramacaoFeriasPage() {
  const { data: usuario, isPending: carregandoUsuario } = useUsuarioLogado();
  const acesso = podeVerProgramacaoFerias(usuario);
  const veTodosOsSetores = podeVerTodosOsSetores(usuario);
  const [setorEscolhido, setSetorEscolhido] = useState<string | null>(null);
  const [ano, setAno] = useState(() => new Date().getFullYear());

  // Os setores vêm do cadastro, com as grafias parecidas agrupadas ("TI", "Departamento TI/Desenvolvimento"...).
  const opcoes = useQuery({
    queryKey: ["opcoes-diretorio"],
    queryFn: listarOpcoesDiretorio,
    enabled: acesso,
  });
  const setores = useMemo(() => agruparSetores(opcoes.data?.departamentos ?? []), [opcoes.data]);

  // O padrão é o setor de quem está logado; o seletor permite olhar os outros setores.
  // Gestores e Colaboradores ficam sempre no próprio setor, mesmo que o seletor fosse forçado.
  const chaveDoMeuSetor = chaveDoSetor(usuario?.setor ?? "");
  const chaveEscolhida = veTodosOsSetores ? (setorEscolhido ?? chaveDoMeuSetor) : chaveDoMeuSetor;
  const grupo = setores.find((s) => s.chave === chaveEscolhida);
  // Enquanto a lista de setores carrega, busca ao menos pela grafia do próprio usuário.
  const variantes =
    grupo?.variantes ??
    (chaveEscolhida === chaveDoMeuSetor && usuario?.setor ? [usuario.setor] : []);
  const nomeDoSetor = grupo?.rotulo ?? usuario?.setor ?? "";

  const colaboradores = useQuery({
    queryKey: ["colaboradores-do-setor", variantes.join("|")],
    queryFn: () => listarColaboradoresDoSetor(variantes),
    enabled: acesso && variantes.length > 0,
  });
  const lista = useMemo(() => colaboradores.data ?? [], [colaboradores.data]);
  const { lideres, equipe } = useMemo(() => separarLideres(lista), [lista]);

  // Solicitação de férias (demonstração, só para o Desenvolvedor do Sistema): clica no primeiro e no último dia.
  const podeSolicitar = podeSolicitarFeriasDemo(usuario);
  const [selecao, setSelecao] = useState<SelecaoPeriodo>({ inicio: null, fim: null });
  const [solicitacao, setSolicitacao] = useState<SolicitacaoFerias | null>(null);
  const email = usuario?.email ?? "";

  useEffect(() => {
    if (podeSolicitar && email) setSolicitacao(carregarSolicitacao(email));
  }, [podeSolicitar, email]);

  // Quem aprova é o gestor direto de quem pede; se não houver, o líder do próprio setor.
  const meuGrupo = setores.find((s) => s.chave === chaveDoMeuSetor);
  const variantesDoMeuSetor = meuGrupo?.variantes ?? (usuario?.setor ? [usuario.setor] : []);
  const meuSetor = useQuery({
    queryKey: ["colaboradores-do-setor", variantesDoMeuSetor.join("|")],
    queryFn: () => listarColaboradoresDoSetor(variantesDoMeuSetor),
    enabled: podeSolicitar && variantesDoMeuSetor.length > 0,
  });
  const gestorDireto = useQuery({
    queryKey: ["gestor-direto", usuario?.gestorDiretoEmail],
    queryFn: () => buscarColaborador({ email: usuario?.gestorDiretoEmail ?? "" }),
    enabled: podeSolicitar && !!usuario?.gestorDiretoEmail,
  });
  const liderNome =
    gestorDireto.data?.["nome"] ||
    separarLideres(meuSetor.data ?? []).lideres.find(
      (l) => l.email.toLowerCase() !== email.toLowerCase(),
    )?.nome ||
    "seu líder";

  // Primeiro clique escolhe o início, o segundo escolhe o fim; um terceiro recomeça a escolha.
  // O início não pode ser nos 2 dias antes de feriado ou do descanso semanal; o calendário já bloqueia esses dias.
  function escolherDia(iso: string) {
    setSelecao((atual) => {
      if (atual.inicio && !atual.fim) return { inicio: atual.inicio, fim: iso };
      return motivoDeBloqueioDoInicio(iso) ? atual : { inicio: iso, fim: null };
    });
  }

  function solicitarFerias() {
    if (!selecao.inicio || !selecao.fim) return;
    const nova = criarSolicitacao(selecao.inicio, selecao.fim, liderNome);
    setSolicitacao(nova);
    salvarSolicitacao(email, nova);
    setSelecao({ inicio: null, fim: null });
  }

  function cancelarSolicitacao() {
    setSolicitacao(null);
    salvarSolicitacao(email, null);
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
              Veja quem faz parte do setor e o calendário do ano para planejar as férias.
            </p>
          </div>
          {veTodosOsSetores ? (
            <div className="grid gap-2">
              <label htmlFor="filtro-setor" className="text-sm font-semibold text-white">
                Setor
              </label>
              <select
                id="filtro-setor"
                value={chaveEscolhida}
                onChange={(evento) => setSetorEscolhido(evento.target.value)}
                className={CAMPO}
              >
                {setores.length === 0 && chaveEscolhida !== "" && (
                  <option value={chaveEscolhida}>{nomeDoSetor}</option>
                )}
                {setores.map((setor) => (
                  <option key={setor.chave} value={setor.chave}>
                    {setor.rotulo}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-white/80">
              Setor: <span className="font-semibold text-white">{nomeDoSetor || "—"}</span>
            </p>
          )}
        </header>

        <section aria-label="Colaboradores do setor" className="mt-8">
          <h2 className="mb-4 flex items-baseline gap-2 font-display text-xl font-semibold text-white">
            Colaboradores
            {colaboradores.isSuccess && (
              <span className="text-sm font-normal text-white/60">
                {lista.length} {lista.length === 1 ? "pessoa" : "pessoas"}
              </span>
            )}
          </h2>

          {colaboradores.isError ? (
            <p className="text-sm text-red-400">Não consegui carregar os colaboradores do setor.</p>
          ) : chaveEscolhida === "" ? (
            <p className="text-sm text-white/70">Escolha um setor para ver os colaboradores.</p>
          ) : colaboradores.isPending ? (
            <p className="text-sm text-white/70">Carregando…</p>
          ) : lista.length === 0 ? (
            <p className="text-sm text-white/70">Nenhum colaborador ativo neste setor.</p>
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
                      />
                    </li>
                  ))}
                </ul>
              )}
              {equipe.length > 0 && (
                <ul
                  aria-label="Equipe"
                  className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                >
                  {equipe.map((colaborador) => (
                    <li key={colaborador.id}>
                      <CartaoColaborador
                        nome={colaborador.nome}
                        cargo={colaborador.cargoVisivel}
                        fotoUrl={colaborador.fotoUrl}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <section aria-label="Calendário do ano" className="mt-10">
          {podeSolicitar && solicitacao && (
            <CartaoSolicitacao solicitacao={solicitacao} aoCancelar={cancelarSolicitacao} />
          )}
          {podeSolicitar && !solicitacao && (
            <ResumoSelecao
              selecao={selecao}
              aoSolicitar={solicitarFerias}
              aoLimpar={() => setSelecao({ inicio: null, fim: null })}
            />
          )}
          <CalendarioAnual
            ano={ano}
            aoMudarAno={setAno}
            {...(podeSolicitar && !solicitacao
              ? { selecao, aoEscolherDia: escolherDia, motivoDeBloqueioDoInicio }
              : {})}
          />
        </section>
      </main>
      <PerfilFlutuante />
    </div>
  );
}
