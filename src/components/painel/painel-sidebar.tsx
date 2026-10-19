import { Link, useLocation } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  Home,
  History,
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
  Rocket,
  Zap,
  SearchCheck,
  type LucideIcon,
} from "lucide-react";

type ItemMenu = { label: string; icon: LucideIcon; to?: string };
type Secao = { titulo: string; icone: LucideIcon; itens: ItemMenu[]; largura: string };

const SECOES_PRINCIPAIS: Secao[] = [
  {
    titulo: "Desempenho & Evolução",
    icone: TrendingUp,
    largura: "w-56",
    itens: [
      { label: "Avaliações", icon: ClipboardCheck, to: "/avaliacoes" },
      { label: "Feedback's", icon: MessageSquareText, to: "/feedbacks" },
      { label: "Planos de Desenvolvimento", icon: CalendarClock, to: "/planos-desenvolvimento" },
      { label: "Reuniões 1:1", icon: UsersRound, to: "/reunioes-1-1" },
    ],
  },
  {
    titulo: "Clima e Engajamento",
    icone: Sparkles,
    largura: "w-56",
    itens: [
      { label: "Comunicados", icon: Megaphone, to: "/comunicados" },
      { label: "Gamificação", icon: Sparkles, to: "/gamificacao" },
    ],
  },
  {
    titulo: "Shop",
    icone: ShoppingBag,
    largura: "w-56",
    itens: [
      { label: "Catálogo", icon: ShoppingBag, to: "/catalogo" },
      { label: "Histórico", icon: History, to: "/shop/historico" },
    ],
  },
];

const SECOES_RH: Secao[] = [
  {
    titulo: "Relatórios e Pesquisas",
    icone: FileSearch,
    largura: "w-64",
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
    largura: "w-56",
    itens: [
      { label: "Vagas", icon: BriefcaseBusiness, to: "/vagas" },
      { label: "Processos Seletivos", icon: UserSearch, to: "/processos-seletivos" },
      { label: "DISC", icon: SearchCheck },
    ],
  },
  {
    titulo: "Configurações",
    icone: Settings,
    largura: "w-72",
    itens: [
      { label: "Setores", icon: Building2 },
      { label: "Cargos & Salários", icon: BadgeDollarSign },
      { label: "Cadastros e Desligamentos", icon: UsersRound, to: "/cadastro-desligamento" },
    ],
  },
];

function MenuSecao({ secao }: { secao: Secao }) {
  const Icone = secao.icone;
  const caminho = useLocation({ select: (local) => local.pathname });
  // A seção fica destacada quando a página atual é um dos seus itens
  const ativa = secao.itens.some((item) => item.to === caminho);
  return (
    <li className="group relative">
      <button
        type="button"
        aria-haspopup="true"
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-panel-active/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${ativa ? "bg-panel-active text-brand" : "text-panel-text"}`}
      >
        <Icone className="size-4 shrink-0" aria-hidden />
        <span className="flex-1">{secao.titulo}</span>
        <ChevronRight className="size-4 shrink-0" aria-hidden />
      </button>
      <div className="absolute left-full top-0 z-20 hidden pl-2 group-hover:block group-focus-within:block">
        <ul className={`relative grid rounded-xl border border-panel-active bg-panel p-1.5 shadow-xl before:absolute before:-left-2 before:top-0 before:h-full before:w-2 before:content-[''] ${secao.largura}`}>
          {secao.itens.map(({ label, icon: Icon, to }) => (
            <li key={label}>
              {to ? (
                <Link
                  to={to}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-panel-text hover:bg-panel-active/50 hover:text-foreground"
                  activeProps={{ className: "bg-panel-active font-semibold text-brand" }}
                >
                  <Icon className="size-4 shrink-0 text-panel-label" aria-hidden />
                  {label}
                </Link>
              ) : (
              <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-panel-text">
                <Icon className="size-4 shrink-0 text-panel-label" aria-hidden />
                {label}
              </span>
              )}
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

  return (
    <aside className="sticky top-0 relative z-30 flex h-screen w-64 shrink-0 flex-col self-start border-r border-panel-active bg-panel">
      <div className="flex h-44 flex-col items-center justify-center border-b border-panel-active">
        <span className="text-3xl font-extrabold tracking-tight text-foreground">Orcoma</span>
        <span className="flex items-center gap-1 text-2xl font-extrabold text-brand">
          <Rocket className="h-6 w-6" /> Orkomakers
        </span>
        <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-panel-label">Painel</span>
      </div>

      <nav aria-label="Menu principal" className="flex-1 space-y-1 p-2">
        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-panel-label">
          Principal
        </p>
        <ul className="mt-3 grid gap-1.5">
          <li>
            <Link
              to="/"
              className={`flex items-center gap-4 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-panel-active/50 ${inicioAtivo ? "bg-panel-active text-brand" : "text-panel-text"}`}
            >
              <Home className="h-4 w-4 shrink-0" aria-hidden />
              Início
            </Link>
          </li>
          {SECOES_PRINCIPAIS.map((secao) => (
            <MenuSecao key={secao.titulo} secao={secao} />
          ))}
        </ul>

        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-panel-label">
          RH
        </p>
        <ul className="mt-3 grid gap-1.5">
          {SECOES_RH.map((secao) => (
            <MenuSecao key={secao.titulo} secao={secao} />
          ))}
        </ul>
      </nav>

    </aside>
  );
}
