import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Award,
  Building2,
  Cake,
  Coins,
  Crown,
  Heart,
  HeartHandshake,
  Megaphone,
  MessageCircle,
  PartyPopper,
  Sparkles,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { podeAnunciarPromocao, useUsuarioLogado } from "@/hooks/use-usuario-logado";
import { supabase } from "@/integrations/supabase/client";
import { listarCargos } from "@/lib/cargos";
import { aplicarSomenteAtivos } from "@/lib/desligamento";
import { ehParaMim, normalizar, type Mencao, type TipoMencao } from "@/lib/reconhecimentos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reconhecimentos")({
  head: () => ({
    meta: [{ title: "Reconhecimentos — Orcoma Orkomakers" }],
  }),
  component: ReconhecimentosPage,
});

// A tipagem gerada não inclui colaboradores_importados (mesmo critério de use-usuario-logado).
const db = supabase as unknown as SupabaseClient<any>;


type Comentario = { id: string; autorNome: string; texto: string };

type Reconhecimento = {
  id: string;
  autorEmail: string;
  autorNome: string;
  fotoUrl: string | null;
  mensagem: string;
  tipo: TipoPost;
  cargoPromovido: string | null;
  criadoEm: Date;
  dia: string; // YYYY-MM-DD no fuso local, usado pelo filtro de datas
  mencoes: Mencao[];
  curtidoresEmails: string[];
  comentarios: Comentario[];
};

type Busca = { inicio: number; termo: string } | null;

// Cada tipo de publicação tem cor, texto e efeito próprios no feed.
type TipoPost = "celebracao" | "reconhecimento" | "promocao";
type ConfigTipo = {
  rotulo: string;
  descricao: string;
  verbo: string;
  icone: LucideIcon;
  texto: string;
  borda: string;
  fundoLeve: string;
};
const TIPOS_POST: Record<TipoPost, ConfigTipo> = {
  celebracao: {
    rotulo: "Celebração",
    descricao: "Aniversários e momentos para comemorar com a equipe.",
    verbo: "celebrou com",
    icone: PartyPopper,
    texto: "text-white",
    borda: "border-pink-400/40",
    fundoLeve: "bg-pink-500",
  },
  reconhecimento: {
    rotulo: "Reconhecimento",
    descricao: "Destaque por algo bem feito, como uma boa fala em reunião.",
    verbo: "reconheceu",
    icone: Award,
    texto: "text-white",
    borda: "border-sky-400/50",
    fundoLeve: "bg-sky-500",
  },
  promocao: {
    rotulo: "Promoção",
    descricao: "Anúncio oficial de promoção. Marque a pessoa promovida com @.",
    verbo: "anunciou a promoção de",
    icone: TrendingUp,
    texto: "text-white",
    borda: "border-emerald-400/60",
    fundoLeve: "bg-emerald-500",
  },
};

type Visualizacao = "todas" | "recebidas" | "enviadas";
const VISUALIZACOES: { value: Visualizacao; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "recebidas", label: "Recebidas" },
  { value: "enviadas", label: "Enviadas" },
];

type Filtro = { visualizacao: Visualizacao; de: string; ate: string };
const FILTRO_VAZIO: Filtro = { visualizacao: "todas", de: "", ate: "" };

// Saldo de Orcoins ainda não existe no banco (mesmo critério da tela de Gamificação).
const SALDO_PADRAO = 0;

const LIMITE_FEED = 200;

function escaparRegex(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rotuloDestinatario(mencao: Mencao) {
  return mencao.tipo === "todos" ? "Todos" : mencao.rotulo;
}

function diaLocal(data: Date) {
  const deslocamento = data.getTimezoneOffset() * 60000;
  return new Date(data.getTime() - deslocamento).toISOString().slice(0, 10);
}

async function listarReconhecimentos(): Promise<Reconhecimento[]> {
  const { data, error } = await supabase
    .from("reconhecimentos")
    .select(
      "id, autor_email, autor_nome, autor_foto, mensagem, tipo, cargo_promovido, criado_em, reconhecimento_mencoes(tipo, valor, rotulo, foto_url), reconhecimento_curtidas(colaborador_email), reconhecimento_comentarios(id, autor_nome, texto, criado_em)",
    )
    .order("criado_em", { ascending: false })
    .limit(LIMITE_FEED);
  if (error) throw error;

  return (data ?? []).map((linha) => {
    const criadoEm = new Date(linha.criado_em);
    return {
      id: linha.id,
      autorEmail: linha.autor_email,
      autorNome: linha.autor_nome,
      fotoUrl: linha.autor_foto || null,
      mensagem: linha.mensagem,
      tipo: (linha.tipo as TipoPost) in TIPOS_POST ? (linha.tipo as TipoPost) : "celebracao",
      cargoPromovido: linha.cargo_promovido || null,
      criadoEm,
      dia: diaLocal(criadoEm),
      mencoes: (linha.reconhecimento_mencoes ?? []).map((mencao) => ({
        tipo: mencao.tipo as TipoMencao,
        valor: mencao.valor,
        rotulo: mencao.rotulo,
        fotoUrl: mencao.foto_url || null,
      })),
      curtidoresEmails: (linha.reconhecimento_curtidas ?? []).map((curtida) => curtida.colaborador_email),
      comentarios: (linha.reconhecimento_comentarios ?? [])
        .sort((a, b) => a.criado_em.localeCompare(b.criado_em))
        .map((comentario) => ({ id: comentario.id, autorNome: comentario.autor_nome, texto: comentario.texto })),
    };
  });
}

// Sugestões do @: todos, setores (tabela setores) e pessoas ativas (colaboradores_importados).
async function buscarSugestoes(termo: string): Promise<Mencao[]> {
  // Remove caracteres que quebrariam o filtro .or() do PostgREST.
  const texto = termo.replace(/[^\p{L}\p{N} ._-]/gu, "").trim();
  const sugestoes: Mencao[] = [];
  if (!texto || "todos".startsWith(texto.toLowerCase())) {
    sugestoes.push({ tipo: "todos", valor: "todos", rotulo: "todos" });
  }

  const [setoresConsulta, pessoasConsulta] = await Promise.all([
    db.from("setores").select("nome").ilike("nome", `%${texto}%`).order("nome").limit(5),
    aplicarSomenteAtivos(
      db
        .from("colaboradores_importados")
        .select("email, nome, nome_completo, foto_url")
        .or(`nome.ilike.%${texto}%,nome_completo.ilike.%${texto}%`)
        .order("nome_completo")
        .limit(6),
    ),
  ]);
  if (setoresConsulta.error) throw setoresConsulta.error;
  if (pessoasConsulta.error) throw pessoasConsulta.error;

  for (const setor of setoresConsulta.data ?? []) {
    sugestoes.push({ tipo: "setor", valor: setor.nome, rotulo: setor.nome });
  }
  for (const pessoa of pessoasConsulta.data ?? []) {
    sugestoes.push({
      tipo: "pessoa",
      valor: pessoa.email,
      rotulo: pessoa.nome_completo || pessoa.nome,
      fotoUrl: pessoa.foto_url || null,
    });
  }
  return sugestoes;
}

function iniciais(nome: string) {
  return (
    nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "—"
  );
}

function Avatar({ nome, fotoUrl, className }: { nome: string; fotoUrl: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-panel-active font-bold text-panel-text",
        className,
      )}
    >
      {fotoUrl ? <img src={fotoUrl} alt="" className="size-full object-cover" /> : iniciais(nome)}
    </span>
  );
}

// Destaca as menções (@pessoa, @setor, @todos) do próprio reconhecimento.
function Mensagem({ texto, mencoes }: { texto: string; mencoes: Mencao[] }) {
  const marcas = mencoes.map((mencao) => `@${mencao.rotulo}`).sort((a, b) => b.length - a.length);
  const partes = marcas.length > 0 ? texto.split(new RegExp(`(${marcas.map(escaparRegex).join("|")})`)) : [texto];
  return (
    <p className="mt-2 whitespace-pre-line text-sm text-panel-text">
      {partes.map((parte, indice) =>
        marcas.includes(parte) ? (
          <span key={indice} className="font-semibold text-brand underline underline-offset-2">
            {parte}
          </span>
        ) : (
          <span key={indice}>{parte}</span>
        ),
      )}
    </p>
  );
}

// Foto de quem publicou, seguida de uma linha tracejada animada até cada pessoa, setor ou "todos" marcado.
function ConectorTracejado() {
  return (
    <svg className="h-2 w-10 shrink-0 overflow-visible text-brand" aria-hidden>
      <motion.line
        x1="0"
        y1="4"
        x2="100%"
        y2="4"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="5 5"
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: -20 }}
        transition={{ duration: 1, ease: "linear", repeat: Infinity }}
      />
    </svg>
  );
}

function IconeMencao({ mencao, tipo, distancia }: { mencao: Mencao; tipo: TipoPost; distancia: number }) {
  const titulo = rotuloDestinatario(mencao);
  if (mencao.tipo === "pessoa") {
    return (
      <span title={titulo} className="relative shrink-0">
        <Avatar nome={mencao.rotulo} fotoUrl={mencao.fotoUrl ?? null} className="size-9 text-xs ring-2 ring-panel" />
        <EfeitoMencao tipo={tipo} distancia={distancia} />
      </span>
    );
  }
  return (
    <span
      title={titulo}
      className="relative grid size-9 shrink-0 place-items-center rounded-full bg-brand/15 text-brand ring-2 ring-panel"
    >
      {mencao.tipo === "todos" ? <Megaphone className="size-4" aria-hidden /> : <Building2 className="size-4" aria-hidden />}
      <EfeitoMencao tipo={tipo} distancia={distancia} />
    </span>
  );
}

function CadeiaMencoes({
  autorNome,
  autorFoto,
  mencoes,
  tipo,
}: {
  autorNome: string;
  autorFoto: string | null;
  mencoes: Mencao[];
  tipo: TipoPost;
}) {
  // Folga vertical para o bolo, a estrela e a coroa voarem sem cortar; o negativo mantém o espaçamento do texto.
  return (
    <div className="-mt-9 -mb-6 flex items-center overflow-x-auto py-9">
      <Avatar nome={autorNome} fotoUrl={autorFoto} className="size-11 text-sm ring-2 ring-panel" />
      {mencoes.map((mencao, indice) => (
        <Fragment key={`${mencao.tipo}:${mencao.valor}:${indice}`}>
          <ConectorTracejado />
          <IconeMencao mencao={mencao} tipo={tipo} distancia={DISTANCIA_INICIAL + PASSO_MENCAO * indice} />
        </Fragment>
      ))}
    </div>
  );
}

// Efeitos acontecem só nas fotos (nunca no card). Tempo: 0–0.3 voo, 0.3–0.6 chegada, 0.6–1 impacto, depois pausa.
const TEMPO_EFEITO = {
  duration: 1.8,
  times: [0, 0.3, 0.6, 1],
  repeat: Infinity,
  repeatDelay: 1.2,
  ease: "easeOut" as const,
};
const PASSO_MENCAO = 76; // conector (40px) + foto da menção (36px)
const DISTANCIA_INICIAL = 80; // do centro da foto de quem publica até o centro da primeira menção

// Bolo arremessado da foto de quem publica na foto marcada; ao acertar, explode em confetes.
function EfeitoBolo({ distancia }: { distancia: number }) {
  const direcoes = [0, 60, 120, 180, 240, 300];
  return (
    <>
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-1/2 -ml-2.5 -mt-2.5 text-pink-400 drop-shadow-[0_0_4px_rgba(244,114,182,0.8)]"
        animate={{
          x: [-distancia, -distancia / 2, 0, 0],
          y: [0, -44, 0, 0],
          rotate: [0, 180, 360, 360],
          opacity: [0, 1, 0, 0],
        }}
        transition={TEMPO_EFEITO}
      >
        <Cake className="size-5" />
      </motion.span>
      {direcoes.map((angulo) => {
        const radianos = (angulo * Math.PI) / 180;
        const dx = Math.cos(radianos) * 28;
        const dy = Math.sin(radianos) * 28;
        return (
          <motion.span
            key={angulo}
            aria-hidden
            className="absolute left-1/2 top-1/2 -ml-1 -mt-1 size-2 rounded-full bg-pink-400"
            animate={{ x: [0, 0, 0, dx], y: [0, 0, 0, dy], opacity: [0, 0, 1, 0] }}
            transition={TEMPO_EFEITO}
          />
        );
      })}
    </>
  );
}

// Estrela que voa em linha reta até a foto marcada; ao chegar, um anel de brilho se expande (reconhecimento).
function EfeitoEstrela({ distancia }: { distancia: number }) {
  return (
    <>
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-1/2 -ml-2.5 -mt-2.5 text-sky-300 drop-shadow-[0_0_4px_rgba(56,189,248,0.9)]"
        animate={{
          x: [-distancia, -distancia / 2, 0, 0],
          rotate: [0, 360, 720, 720],
          scale: [0.6, 1, 0.8, 0.8],
          opacity: [0, 1, 0, 0],
        }}
        transition={TEMPO_EFEITO}
      >
        <Star className="size-5 fill-sky-300" />
      </motion.span>
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-1/2 -ml-6 -mt-6 size-12 rounded-full border-[3px] border-sky-300"
        animate={{ scale: [0, 0, 0.6, 1.5], opacity: [0, 0, 1, 0] }}
        transition={TEMPO_EFEITO}
      />
    </>
  );
}

// Coroa que cai sobre a foto marcada e quica ao pousar; um anel dourado marca a chegada (promoção).
function EfeitoCoroa() {
  return (
    <>
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-1/2 -ml-2.5 -mt-2.5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
        animate={{ y: [-44, 0, -6, 0], opacity: [0, 1, 1, 0] }}
        transition={TEMPO_EFEITO}
      >
        <Crown className="size-5 fill-amber-300" />
      </motion.span>
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-1/2 -ml-6 -mt-6 size-12 rounded-full border-[3px] border-amber-300"
        animate={{ scale: [0, 1, 1.5, 1.5], opacity: [0, 1, 0, 0] }}
        transition={TEMPO_EFEITO}
      />
    </>
  );
}

function EfeitoMencao({ tipo, distancia }: { tipo: TipoPost; distancia: number }) {
  if (tipo === "celebracao") return <EfeitoBolo distancia={distancia} />;
  if (tipo === "reconhecimento") return <EfeitoEstrela distancia={distancia} />;
  return <EfeitoCoroa />;
}

const CAMPO =
  "h-10 rounded-lg border border-panel-active bg-background px-3 text-sm text-foreground placeholder:text-panel-label focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand [color-scheme:dark]";
const BOTAO_SECUNDARIO =
  "rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-panel-text transition hover:bg-panel-active/50";
const BOTAO_PRIMARIO =
  "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

const ROTULO_TIPO: Record<TipoMencao, string> = { todos: "Todos", setor: "Setor", pessoa: "Pessoa" };

function ReconhecimentosPage() {
  const queryClient = useQueryClient();
  const { data: usuario } = useUsuarioLogado();
  const meuEmail = (usuario?.email ?? "").toLowerCase();
  const meuSetor = usuario?.setor ?? "";
  const meuNome = usuario?.nomeCompleto || usuario?.nome || "";

  const { data: posts = [], isPending, isError, error: erroFeed } = useQuery({
    queryKey: ["reconhecimentos"],
    queryFn: listarReconhecimentos,
    placeholderData: keepPreviousData,
  });

  const [rascunho, setRascunho] = useState("");
  const [tipoRascunho, setTipoRascunho] = useState<TipoPost>("celebracao");
  const podePromover = podeAnunciarPromocao(usuario);
  const [cargoRascunho, setCargoRascunho] = useState("");
  const [cargoAberto, setCargoAberto] = useState(false);
  const { data: cargos = [] } = useQuery({
    queryKey: ["cargos-lista"],
    queryFn: async () => (await listarCargos()).map((cargo) => cargo.nome),
    enabled: podePromover,
  });
  const [mencoesRascunho, setMencoesRascunho] = useState<Mencao[]>([]);
  const [busca, setBusca] = useState<Busca>(null);
  const [destaque, setDestaque] = useState(0);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const [filtroRascunho, setFiltroRascunho] = useState<Filtro>(FILTRO_VAZIO);
  const [filtro, setFiltro] = useState<Filtro>(FILTRO_VAZIO);
  const [comentandoEm, setComentandoEm] = useState<string | null>(null);
  const [textoComentario, setTextoComentario] = useState("");
  const [erroAcao, setErroAcao] = useState("");

  const sugestoesConsulta = useQuery({
    queryKey: ["reconhecimentos-sugestoes", busca?.termo ?? ""],
    queryFn: () => buscarSugestoes(busca?.termo ?? ""),
    enabled: busca !== null,
  });
  const sugestoes = busca ? (sugestoesConsulta.data ?? []) : [];
  const cargosSugeridos = cargos
    .filter((cargo) => normalizar(cargo).includes(normalizar(cargoRascunho)))
    .slice(0, 8);

  const recebidas = posts.filter((post) => ehParaMim(post.mencoes, meuEmail, meuSetor));
  const enviadas = posts.filter((post) => post.autorEmail.toLowerCase() === meuEmail);

  const lista = posts.filter((post) => {
    if (filtro.visualizacao === "recebidas" && !ehParaMim(post.mencoes, meuEmail, meuSetor)) return false;
    if (filtro.visualizacao === "enviadas" && post.autorEmail.toLowerCase() !== meuEmail) return false;
    if (filtro.de && post.dia < filtro.de) return false;
    if (filtro.ate && post.dia > filtro.ate) return false;
    return true;
  });

  function aplicarFiltro(novo: Filtro) {
    setFiltroRascunho(novo);
    setFiltro(novo);
  }

  function atualizarFeed() {
    return queryClient.invalidateQueries({ queryKey: ["reconhecimentos"] });
  }

  // Detecta o @ logo antes do cursor para abrir as sugestões.
  function aoEditarRascunho(evento: ChangeEvent<HTMLTextAreaElement>) {
    const texto = evento.target.value;
    const cursor = evento.target.selectionStart ?? texto.length;
    setRascunho(texto);
    const encontrado = texto.slice(0, cursor).match(/(^|\s)@([^\s@]*)$/);
    if (encontrado) {
      const termo = encontrado[2] ?? "";
      setBusca({ inicio: cursor - termo.length - 1, termo });
      setDestaque(0);
    } else {
      setBusca(null);
    }
  }

  function escolherSugestao(sugestao: Mencao) {
    if (!busca) return;
    const antes = rascunho.slice(0, busca.inicio);
    const depois = rascunho.slice(busca.inicio + 1 + busca.termo.length);
    const inserido = `@${sugestao.rotulo} `;
    setRascunho(antes + inserido + depois);
    setMencoesRascunho((atual) =>
      atual.some((mencao) => mencao.tipo === sugestao.tipo && mencao.valor === sugestao.valor)
        ? atual
        : [...atual, sugestao],
    );
    setBusca(null);
    const cursor = antes.length + inserido.length;
    requestAnimationFrame(() => {
      areaRef.current?.focus();
      areaRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  function aoTeclarRascunho(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (!busca || sugestoes.length === 0) return;
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setDestaque((atual) => (atual + 1) % sugestoes.length);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setDestaque((atual) => (atual - 1 + sugestoes.length) % sugestoes.length);
    } else if (evento.key === "Enter" || evento.key === "Tab") {
      evento.preventDefault();
      const escolhida = sugestoes[destaque] ?? sugestoes[0];
      if (escolhida) escolherSugestao(escolhida);
    } else if (evento.key === "Escape") {
      setBusca(null);
    }
  }

  const publicar = useMutation({
    mutationFn: async ({
      mensagem,
      mencoes,
      tipo,
      cargo,
    }: {
      mensagem: string;
      mencoes: Mencao[];
      tipo: TipoPost;
      cargo: string | null;
    }) => {
      const { data, error } = await supabase
        .from("reconhecimentos")
        .insert({
          autor_email: usuario?.email ?? "",
          autor_nome: meuNome,
          autor_foto: usuario?.fotoUrl ?? null,
          mensagem,
          tipo,
          cargo_promovido: cargo,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (mencoes.length > 0) {
        const { error: erroMencoes } = await supabase.from("reconhecimento_mencoes").insert(
          mencoes.map((mencao) => ({
            reconhecimento_id: data.id,
            tipo: mencao.tipo,
            valor: mencao.valor,
            rotulo: mencao.rotulo,
            foto_url: mencao.fotoUrl ?? null,
          })),
        );
        if (erroMencoes) throw erroMencoes;
      }
    },
    onSuccess: () => {
      setRascunho("");
      setMencoesRascunho([]);
      setCargoRascunho("");
      setBusca(null);
      setErroAcao("");
      void atualizarFeed();
    },
    onError: () => setErroAcao("Não foi possível publicar o reconhecimento. Tente novamente."),
  });

  const curtir = useMutation({
    mutationFn: async ({ id, curtidoPorMim }: { id: string; curtidoPorMim: boolean }) => {
      const consulta = curtidoPorMim
        ? supabase
            .from("reconhecimento_curtidas")
            .delete()
            .eq("reconhecimento_id", id)
            .eq("colaborador_email", usuario?.email ?? "")
        : supabase
            .from("reconhecimento_curtidas")
            .insert({ reconhecimento_id: id, colaborador_email: usuario?.email ?? "" });
      const { error } = await consulta;
      if (error) throw error;
    },
    onSuccess: () => {
      setErroAcao("");
      void atualizarFeed();
    },
    onError: () => setErroAcao("Não foi possível registrar a curtida. Tente novamente."),
  });

  const comentar = useMutation({
    mutationFn: async ({ id, texto }: { id: string; texto: string }) => {
      const { error } = await supabase.from("reconhecimento_comentarios").insert({
        reconhecimento_id: id,
        autor_email: usuario?.email ?? "",
        autor_nome: meuNome,
        texto,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTextoComentario("");
      setErroAcao("");
      void atualizarFeed();
    },
    onError: () => setErroAcao("Não foi possível enviar o comentário. Tente novamente."),
  });

  function enviar() {
    const texto = rascunho.trim();
    if (!texto || !usuario?.email) return;
    // Só vale a menção que ainda está no texto (quem apagou o @ não marca ninguém).
    const mencoes = mencoesRascunho.filter((mencao) => texto.includes(`@${mencao.rotulo}`));
    if (tipoRascunho === "promocao" && !mencoes.some((mencao) => mencao.tipo === "pessoa")) {
      setErroAcao("Para anunciar uma promoção, marque a pessoa promovida com @.");
      return;
    }
    if (tipoRascunho === "promocao" && !cargoRascunho) {
      setErroAcao("Escolha o cargo para o qual a pessoa foi promovida.");
      return;
    }
    publicar.mutate({
      mensagem: texto,
      mencoes,
      tipo: tipoRascunho,
      cargo: tipoRascunho === "promocao" ? cargoRascunho : null,
    });
  }

  function limparRascunho() {
    setRascunho("");
    setMencoesRascunho([]);
    setBusca(null);
  }

  function enviarComentario(id: string) {
    const texto = textoComentario.trim();
    if (!texto || !usuario?.email) return;
    comentar.mutate({ id, texto });
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-4 pb-10 pt-24 sm:px-6 lg:px-10">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-white">Reconhecimentos</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Celebre as conquistas dos colegas, reconheça quem faz a diferença e compartilhe com a equipe.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid min-w-0 gap-6">
            <section className="rounded-2xl border border-panel-active bg-panel p-6">
              <h2 className="font-display text-lg font-semibold text-white">Celebre com alguém!</h2>
              <p className="mt-1 text-sm text-panel-label">
                Quem fez algo super legal hoje? Reconheça e compartilhe com todo mundo!
              </p>

              <div role="radiogroup" aria-label="Tipo de publicação" className="mt-4 flex flex-wrap gap-2">
                {(Object.keys(TIPOS_POST) as TipoPost[])
                  .filter((tipo) => tipo !== "promocao" || podePromover)
                  .map((tipo) => {
                    const config = TIPOS_POST[tipo];
                    const Icone = config.icone;
                    const ativo = tipoRascunho === tipo;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        role="radio"
                        aria-checked={ativo}
                        onClick={() => setTipoRascunho(tipo)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                          ativo
                            ? cn(config.borda, config.fundoLeve, config.texto)
                            : "border-panel-active text-panel-label hover:text-panel-text",
                        )}
                      >
                        <Icone className="size-3.5" aria-hidden />
                        {config.rotulo}
                      </button>
                    );
                  })}
              </div>
              <p className="mt-2 text-xs text-panel-label">{TIPOS_POST[tipoRascunho].descricao}</p>

              {tipoRascunho === "promocao" && (
                <label className="mt-3 flex flex-col gap-1.5 text-xs font-semibold text-panel-label">
                  Cargo para o qual a pessoa foi promovida
                  <div className="relative">
                    <input
                      value={cargoRascunho}
                      onChange={(evento) => {
                        setCargoRascunho(evento.target.value);
                        setCargoAberto(true);
                      }}
                      onFocus={() => setCargoAberto(true)}
                      onBlur={() => setCargoAberto(false)}
                      autoComplete="off"
                      placeholder="Digite ou escolha o cargo"
                      className={cn(CAMPO, "w-full")}
                    />
                    {cargoAberto && cargosSugeridos.length > 0 && (
                      <ul
                        role="listbox"
                        className="absolute left-0 right-0 top-full z-20 mt-1 grid max-h-60 overflow-y-auto rounded-xl border border-panel-active bg-panel p-1.5 shadow-xl"
                      >
                        {cargosSugeridos.map((cargo) => (
                          <li key={cargo}>
                            <button
                              type="button"
                              onMouseDown={(evento) => {
                                evento.preventDefault();
                                setCargoRascunho(cargo);
                                setCargoAberto(false);
                              }}
                              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-panel-text hover:bg-panel-active/50 hover:text-brand"
                            >
                              {cargo}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </label>
              )}

              <div className="relative mt-3">
                <textarea
                  ref={areaRef}
                  value={rascunho}
                  onChange={aoEditarRascunho}
                  onKeyDown={aoTeclarRascunho}
                  placeholder="Digite @ para marcar uma pessoa, um setor (ex.: @Qualidade) ou @todos"
                  className="min-h-36 w-full resize-y rounded-lg border border-panel-active bg-background p-3 text-sm text-foreground placeholder:text-panel-label focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />

                {busca && sugestoes.length > 0 && (
                  <ul
                    role="listbox"
                    className="absolute left-3 top-full z-20 mt-1 grid max-h-72 w-80 overflow-y-auto rounded-xl border border-panel-active bg-panel p-1.5 shadow-xl"
                  >
                    {sugestoes.map((sugestao, indice) => (
                      <li key={`${sugestao.tipo}:${sugestao.valor}`} role="option" aria-selected={indice === destaque}>
                        <button
                          type="button"
                          onMouseDown={(evento) => {
                            evento.preventDefault();
                            escolherSugestao(sugestao);
                          }}
                          onMouseEnter={() => setDestaque(indice)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm",
                            indice === destaque ? "bg-panel-active text-brand" : "text-panel-text",
                          )}
                        >
                          <span className="truncate font-semibold">
                            @{sugestao.tipo === "todos" ? "todos" : sugestao.rotulo}
                          </span>
                          <span className="shrink-0 text-xs text-panel-label">
                            {ROTULO_TIPO[sugestao.tipo]}
                            {sugestao.tipo === "pessoa" ? ` · ${sugestao.valor}` : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {erroAcao && <p className="mt-3 text-sm text-red-400">{erroAcao}</p>}
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={limparRascunho} className={BOTAO_SECUNDARIO}>
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={enviar}
                  disabled={!rascunho.trim() || !usuario?.email || publicar.isPending}
                  className={BOTAO_PRIMARIO}
                >
                  {publicar.isPending ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-panel-active bg-panel p-6">
              <div className="flex flex-wrap items-end gap-4">
                <label className="flex min-w-48 flex-col gap-1.5 text-xs font-semibold text-panel-label">
                  Visualizar
                  <select
                    value={filtroRascunho.visualizacao}
                    onChange={(evento) =>
                      setFiltroRascunho({ ...filtroRascunho, visualizacao: evento.target.value as Visualizacao })
                    }
                    className={CAMPO}
                  >
                    {VISUALIZACOES.map((opcao) => (
                      <option key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-panel-label">
                  Data de início
                  <input
                    type="date"
                    value={filtroRascunho.de}
                    onChange={(evento) => setFiltroRascunho({ ...filtroRascunho, de: evento.target.value })}
                    className={CAMPO}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-panel-label">
                  Data de fim
                  <input
                    type="date"
                    value={filtroRascunho.ate}
                    onChange={(evento) => setFiltroRascunho({ ...filtroRascunho, ate: evento.target.value })}
                    className={CAMPO}
                  />
                </label>
                <div className="ml-auto flex gap-3">
                  <button type="button" onClick={() => aplicarFiltro(FILTRO_VAZIO)} className={BOTAO_SECUNDARIO}>
                    Limpar
                  </button>
                  <button type="button" onClick={() => aplicarFiltro(filtroRascunho)} className={BOTAO_PRIMARIO}>
                    Filtrar
                  </button>
                </div>
              </div>

              {isError ? (
                <div className="mt-6 text-sm text-red-400">
                  <p>Não foi possível carregar os reconhecimentos.</p>
                  {erroFeed instanceof Error && <p className="mt-1 text-xs text-red-400/80">{erroFeed.message}</p>}
                </div>
              ) : isPending ? (
                <p className="mt-6 text-sm text-panel-label">Carregando reconhecimentos...</p>
              ) : lista.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="relative mb-6 grid size-28 place-items-center rounded-[2rem] bg-brand/10 text-brand">
                    <HeartHandshake className="size-16" strokeWidth={1.2} aria-hidden />
                    <span className="absolute -right-1 top-2 grid size-8 place-items-center rounded-full bg-brand text-slate-900 shadow-sm">
                      <Sparkles className="size-4" aria-hidden />
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    {posts.length === 0 ? "Não há posts novos" : "Nenhum reconhecimento encontrado"}
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-white/80">
                    {posts.length === 0
                      ? "Quando alguém for celebrado, a publicação aparecerá aqui."
                      : "Ajuste os filtros para ver outros reconhecimentos."}
                  </p>
                </div>
              ) : (
                <ul className="mt-6 grid gap-6">
                  {lista.map((post) => {
                    const curtidoPorMim = post.curtidoresEmails.some((email) => email.toLowerCase() === meuEmail);
                    const configTipo = TIPOS_POST[post.tipo];
                    const IconeTipo = configTipo.icone;
                    return (
                      <li key={post.id} className="rounded-xl border border-panel-active bg-background/50 p-5">
                        <div className="flex gap-4">
                          <div className="min-w-0 flex-1">
                            <CadeiaMencoes
                              autorNome={post.autorNome}
                              autorFoto={post.fotoUrl}
                              mencoes={post.mencoes}
                              tipo={post.tipo}
                            />
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                              <p className="text-sm text-panel-text">
                                <span className="font-semibold text-foreground">{post.autorNome}</span>
                                {post.mencoes.length > 0 ? (
                                  <>
                                    {" "}
                                    {configTipo.verbo}{" "}
                                    <span className="font-semibold text-foreground">
                                      {post.mencoes.map(rotuloDestinatario).join(", ")}
                                    </span>
                                    {post.tipo === "promocao" && post.cargoPromovido && (
                                      <>
                                        {" "}para{" "}
                                        <span className="font-semibold text-emerald-300">{post.cargoPromovido}</span>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  ` publicou uma ${configTipo.rotulo.toLowerCase()}`
                                )}
                              </p>
                              <div className="flex items-center gap-3">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                                    configTipo.fundoLeve,
                                    configTipo.texto,
                                  )}
                                >
                                  <IconeTipo className="size-3.5" aria-hidden />
                                  {configTipo.rotulo}
                                </span>
                                <time className="text-xs text-panel-label">
                                  {post.criadoEm.toLocaleDateString("pt-BR")}
                                </time>
                              </div>
                            </div>

                            <Mensagem texto={post.mensagem} mencoes={post.mencoes} />

                            <div className="mt-3 flex items-center gap-5 text-sm">
                              <button
                                type="button"
                                onClick={() => curtir.mutate({ id: post.id, curtidoPorMim })}
                                disabled={!usuario?.email || curtir.isPending}
                                aria-pressed={curtidoPorMim}
                                className="flex items-center gap-1.5 font-semibold text-panel-text underline-offset-2 hover:underline disabled:opacity-60"
                              >
                                <Heart
                                  className={cn("size-4", curtidoPorMim ? "fill-brand text-brand" : "text-panel-label")}
                                  aria-hidden
                                />
                                {post.curtidoresEmails.length}{" "}
                                {post.curtidoresEmails.length === 1 ? "Curtida" : "Curtidas"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setComentandoEm(comentandoEm === post.id ? null : post.id);
                                  setTextoComentario("");
                                }}
                                className="flex items-center gap-1.5 font-semibold text-panel-text underline-offset-2 hover:underline"
                              >
                                <MessageCircle className="size-4 text-panel-label" aria-hidden />
                                {post.comentarios.length} {post.comentarios.length === 1 ? "Comentário" : "Comentários"}
                              </button>
                            </div>

                            {post.comentarios.length > 0 && (
                              <ul className="mt-3 grid gap-2">
                                {post.comentarios.map((comentario) => (
                                  <li
                                    key={comentario.id}
                                    className="rounded-lg bg-background px-3 py-2 text-sm text-panel-text"
                                  >
                                    <span className="font-semibold text-foreground">{comentario.autorNome}</span>{" "}
                                    {comentario.texto}
                                  </li>
                                ))}
                              </ul>
                            )}

                            {comentandoEm === post.id && (
                              <form
                                className="mt-3 flex gap-2"
                                onSubmit={(evento) => {
                                  evento.preventDefault();
                                  enviarComentario(post.id);
                                }}
                              >
                                <input
                                  value={textoComentario}
                                  onChange={(evento) => setTextoComentario(evento.target.value)}
                                  placeholder="Escreva um comentário"
                                  className={cn(CAMPO, "min-w-0 flex-1")}
                                  autoFocus
                                />
                                <button
                                  type="submit"
                                  disabled={!textoComentario.trim() || comentar.isPending}
                                  className={BOTAO_PRIMARIO}
                                >
                                  Comentar
                                </button>
                              </form>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <aside className="grid content-start gap-6 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-panel-active bg-panel p-6 text-center">
              <Avatar nome={meuNome} fotoUrl={usuario?.fotoUrl ?? null} className="mx-auto size-20 text-xl" />
              <p className="mt-3 font-display text-base font-bold text-foreground">{meuNome || "—"}</p>
              {usuario?.setor && <p className="mt-1 text-xs font-semibold text-brand">{usuario.setor}</p>}
              {(usuario?.cargoVisivel || usuario?.cargo) && (
                <p className="text-xs text-panel-label">{usuario.cargoVisivel || usuario.cargo}</p>
              )}
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Coins className="size-4 text-brand" aria-hidden />
                {SALDO_PADRAO.toLocaleString("pt-BR")} Orcoins
              </p>
            </section>

            <section className="rounded-2xl border border-panel-active bg-panel p-6">
              <h2 className="font-display text-sm font-semibold text-white">Celebrações</h2>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => aplicarFiltro({ ...FILTRO_VAZIO, visualizacao: "recebidas" })}
                  className="flex items-center justify-between rounded-lg border border-brand/60 px-4 py-2.5 text-sm font-semibold text-panel-text transition hover:bg-brand/10"
                >
                  <span>{recebidas.length} Recebidas</span>
                  <span aria-hidden>→</span>
                </button>
                <button
                  type="button"
                  onClick={() => aplicarFiltro({ ...FILTRO_VAZIO, visualizacao: "enviadas" })}
                  className="flex items-center justify-between rounded-lg border border-brand/60 px-4 py-2.5 text-sm font-semibold text-panel-text transition hover:bg-brand/10"
                >
                  <span>{enviadas.length} Enviadas</span>
                  <span aria-hidden>→</span>
                </button>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
