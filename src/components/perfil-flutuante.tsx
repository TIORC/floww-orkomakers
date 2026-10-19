import { useNavigate } from "@tanstack/react-router";

import { useUsuarioLogado } from "@/hooks/use-usuario-logado";
import { ChevronDown, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Itens com `to` já têm página. Os demais ainda não foram desenvolvidos.
const ITENS_PRINCIPAIS: { label: string; to?: string }[] = [
  { label: "Meu Perfil", to: "/meu-perfil" },
  { label: "Organograma", to: "/organograma" },
  { label: "Colaboradores", to: "/colaboradores" },
  { label: "Comunicados", to: "/comunicados" },
  { label: "Ouvidoria" },
  { label: "Novidades do produto" },
  { label: "Política de Privacidade" },
];

const ITEM = "cursor-pointer rounded-md text-sm text-white focus:bg-panel-active focus:text-white";

// Perfil fixo no topo direito de todas as páginas. Nome e setor são placeholders até a integração.
export function PerfilFlutuante() {
  const navigate = useNavigate();
  const { data: usuario, isPending } = useUsuarioLogado();

  function irPara(to?: string) {
    if (to) navigate({ to });
  }

  return (
    <div className="fixed right-6 top-3 z-40">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-panel-active text-panel-text">
            <User className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 text-left leading-tight">
            <p className="truncate text-sm font-semibold text-white">{isPending ? "" : usuario?.nomeCompleto ?? "Sem usuário"}</p>
            <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-brand">{isPending ? "" : usuario?.setor ?? ""}</p>
          </div>
          <ChevronDown className="size-4 shrink-0 text-panel-label" aria-hidden />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 border-panel-active bg-panel p-1 text-white">
          {ITENS_PRINCIPAIS.map((item) => (
            <DropdownMenuItem key={item.label} className={ITEM} onSelect={() => irPara(item.to)}>
              {item.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator className="bg-panel-active" />
          <DropdownMenuLabel className="text-xs font-semibold text-panel-label">Minha Área</DropdownMenuLabel>
          <DropdownMenuItem className={ITEM}>Minha carreira</DropdownMenuItem>

          <DropdownMenuSeparator className="bg-panel-active" />
          <DropdownMenuItem
            onSelect={() => navigate({ to: "/login" })}
            className="cursor-pointer rounded-md text-sm font-semibold text-destructive focus:bg-panel-active focus:text-destructive"
          >
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
