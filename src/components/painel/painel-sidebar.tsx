import { Link, useLocation } from "@tanstack/react-router";

import { podeVerMenuRH, useUsuarioLogado } from "@/hooks/use-usuario-logado";
import {
  BadgeDollarSign,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Clock,
  CalendarOff,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  Home,
  History,
  Hourglass,
  Megaphone,
  MessageSquareText,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Smile,
  Sparkles,
  TrendingUp,
  UserMinus,
  UserSearch,
  UsersRound,
  Zap,
  SearchCheck,
  type LucideIcon,
} from "lucide-react";

// `to` ausente = funcionalidade ainda não desenvolvida (aparece desabilitada).
// `filhos` = submenu que abre ao lado do item.
type ItemMenu = { label: string; icon: LucideIcon; to?: string; filhos?: ItemMenu[] };
type Secao = { titulo: string; icone: LucideIcon; itens: ItemMenu[] };

const SECOES_PRINCIPAIS: Secao[] = [
  {
    titulo: "Desempenho & Evolução",
    icone: TrendingUp,
    itens: [
      { label: "Avaliações", icon: ClipboardCheck, to: "/avaliacoes" },
      { label: "Feedback's", icon: MessageSquareText, to: "/feedbacks" },
      {
        label: "Planos de Desenvolvimento",
        icon: CalendarClock,
        to: "/planos-desenvolvimento",
        filhos: [
          { label: "Meus Planos de Desenvolvimento", icon: CalendarClock, to: "/planos-desenvolvimento" },
        ],
      },
      { label: "Reuniões 1:1", icon: UsersRound, to: "/reunioes-1-1" },
    ],
  },
  {
    titulo: "Clima e Engajamento",
    icone: Sparkles,
    itens: [
      { label: "Comunicados", icon: Megaphone, to: "/comunicados" },
      {
        label: "Gamificação",
        icon: Sparkles,
        to: "/gamificacao",
        filhos: [{ label: "Histórico", icon: History, to: "/gamificacao/historico" }],
      },
    ],
  },
  {
    titulo: "Shop",
    icone: ShoppingBag,
    itens: [
      { label: "Catálogo", icon: ShoppingBag, to: "/catalogo" },
      { label: "Histórico", icon: History, to: "/shop/historico" },
    ],
  },
];

const SECOES_DEPARTAMENTO_PESSOAL: Secao[] = [
  {
    titulo: "Horas extras e horas faltas",
    icone: Clock,
    itens: [{ label: "Horas extras e horas faltas", icon: Clock, to: "/horas-extras-faltas" }],
  },
  {
    titulo: "Banco de Horas",
    icone: Hourglass,
    itens: [{ label: "Banco de Horas", icon: Hourglass }],
  },
];

const SECOES_RH: Secao[] = [
  {
    titulo: "Relatórios e Pesquisas",
    icone: FileSearch,
    itens: [
      { label: "Relatórios Gerais", icon: BarChart3, to: "/relatorios-gerais" },
      { label: "Pesquisa de Satisfação", icon: Smile, to: "/pesquisa-satisfacao" },
      { label: "Pesquisa Rápida", icon: Zap, to: "/pesquisa-rapida" },
      { label: "Super Pesquisa", icon: ClipboardList, to: "/super-pesquisa" },
      { label: "Pesquisa de Engajamento", icon: UsersRound, to: "/pesquisa-engajamento" },
      { label: "Pesquisa de Desligamento", icon: UserMinus, to: "/pesquisa-desligamento" },
      { label: "Mapeamento de Riscos Psicossociais", icon: ShieldAlert, to: "/mapeamento-riscos-psicossociais" },
    ],
  },
  {
    titulo: "Recrutamento & Seleção",
    icone: BriefcaseBusiness,
    itens: [
      { label: "Vagas", icon: BriefcaseBusiness, to: "/vagas" },
      { label: "Processos Seletivos", icon: UserSearch, to: "/processos-seletivos" },
      { label: "DISC", icon: SearchCheck },
    ],
  },
  {
    titulo: "Gestão dos Feedbacks",
    icone: MessageSquareText,
    itens: [{ label: "Gestão dos Feedbacks", icon: Settings }],
  },
  {
    titulo: "Gestão dos Planos de Desenvolvimento",
    icone: CalendarClock,
    itens: [{ label: "Gestão dos Planos de Desenvolvimento", icon: Settings, to: "/planos-desenvolvimento/gestao" }],
  },
  {
    titulo: "Configurações",
    icone: Settings,
    itens: [
      { label: "Setores", icon: Building2, to: "/setores" },
      { label: "Cargos & Salários", icon: BadgeDollarSign, to: "/cargos-salarios" },
      { label: "Cadastros e Desligamentos", icon: UsersRound, to: "/cadastro-desligamento" },
    ],
  },
];

// Mesmo estilo para todos os links do menu, com ou sem submenu.
const LINK_BASE = "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors";
const ITEM_BASE = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium";

// Todos os links da seção, incluindo os de submenus, para destacar a seção certa.
function linksDaSecao(itens: ItemMenu[]): string[] {
  return itens.flatMap((item) => [item.to, ...linksDaSecao(item.filhos ?? [])]).filter((to): to is string => Boolean(to));
}

function ItemMenuView({ item }: { item: ItemMenu }) {
  const Icon = item.icon;
  const caminho = useLocation({ select: (local) => local.pathname });
  const temFilhos = (item.filhos?.length ?? 0) > 0;
  const ativo = item.to === caminho;

  const conteudo = item.to ? (
    <Link
      to={item.to}
      className={`${ITEM_BASE} text-panel-text hover:bg-panel-active/50 hover:text-foreground`}
      activeProps={{ className: "bg-panel-active font-semibold text-brand" }}
    >
      <Icon className="size-4 shrink-0 text-panel-label" aria-hidden />
      <span className="flex-1">{item.label}</span>
      {temFilhos ? <ChevronRight className="size-4 shrink-0 text-panel-label" aria-hidden /> : null}
    </Link>
  ) : (
    <span aria-disabled="true" className={`${ITEM_BASE} cursor-not-allowed text-panel-text/50`}>
      <Icon className="size-4 shrink-0 text-panel-label/50" aria-hidden />
      {item.label}
    </span>
  );

  if (!temFilhos) return conteudo;

  return (
    <div className="group/sub relative">
      {conteudo}
      <div className="absolute left-full top-0 z-30 hidden pl-2 group-hover/sub:block group-focus-within/sub:block">
        <ul className="relative grid w-64 rounded-xl border border-panel-active bg-panel p-1.5 shadow-xl before:absolute before:-left-2 before:top-0 before:h-full before:w-2 before:content-['']">
          {item.filhos?.map((filho) => (
            <li key={filho.label}>
              <ItemMenuView item={filho} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MenuSecao({ secao }: { secao: Secao }) {
  const Icone = secao.icone;
  const caminho = useLocation({ select: (local) => local.pathname });
  // A seção fica destacada quando a página atual é um dos seus itens
  const ativa = linksDaSecao(secao.itens).includes(caminho);
  return (
    <li className="group relative">
      <button
        type="button"
        aria-haspopup="true"
        className={`${LINK_BASE} w-full text-left hover:bg-panel-active/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${ativa ? "bg-panel-active text-brand" : "text-panel-text"}`}
      >
        <Icone className="size-4 shrink-0" aria-hidden />
        <span className="flex-1">{secao.titulo}</span>
        <ChevronRight className="size-4 shrink-0" aria-hidden />
      </button>
      <div className="absolute left-full top-0 z-20 hidden pl-2 group-hover:block group-focus-within:block">
        <ul className="relative grid w-64 rounded-xl border border-panel-active bg-panel p-1.5 shadow-xl before:absolute before:-left-2 before:top-0 before:h-full before:w-2 before:content-['']">
          {secao.itens.map((item) => (
            <li key={item.label}>
              <ItemMenuView item={item} />
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function PainelSidebar() {
  const caminho = useLocation({ select: (local) => local.pathname });
  const inicioAtivo = caminho === "/";
  const { data: usuario } = useUsuarioLogado();
  const mostrarRH = podeVerMenuRH(usuario);

  return (
    <aside className="sticky top-0 relative z-30 flex h-screen w-64 shrink-0 flex-col self-start border-r border-panel-active bg-panel">

      <nav aria-label="Menu principal" className="flex-1 space-y-1 p-2">
        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-panel-label">
          Principal
        </p>
        <ul className="mt-3 grid gap-1.5">
          <li>
            <Link
              to="/"
              className={`${LINK_BASE} hover:bg-panel-active/50 ${inicioAtivo ? "bg-panel-active text-brand" : "text-panel-text"}`}
            >
              <Home className="size-4 shrink-0" aria-hidden />
              Início
            </Link>
          </li>
          {SECOES_PRINCIPAIS.map((secao) => (
            <MenuSecao key={secao.titulo} secao={secao} />
          ))}
        </ul>

        {mostrarRH && (
          <>
            <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-panel-label">
              RH
            </p>
            <ul className="mt-3 grid gap-1.5">
              {SECOES_RH.map((secao) => (
                <MenuSecao key={secao.titulo} secao={secao} />
              ))}
            </ul>
          </>
        )}

        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-panel-label">
          Departamento Pessoal
        </p>
        <ul className="mt-3 grid gap-1.5">
          {SECOES_DEPARTAMENTO_PESSOAL.map((secao) => (
            <MenuSecao key={secao.titulo} secao={secao} />
          ))}
        </ul>
      </nav>

    </aside>
  );
}
