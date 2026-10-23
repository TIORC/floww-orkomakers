import { useNavigate } from "@tanstack/react-router";

import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUsuarioLogado } from "@/hooks/use-usuario-logado";
import { motion } from "framer-motion";
import { ChevronDown, CircleHelp, EyeOff, Megaphone, User, type LucideIcon } from "lucide-react";

import { NotificacoesPainel } from "@/components/painel/notificacoes-painel";

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

// Atalhos à esquerda do perfil. Ainda sem ação: cada um será definido depois.
const ACOES_RAPIDAS: { rotulo: string; icone: LucideIcon; to?: string }[] = [
  { rotulo: "Ajuda", icone: CircleHelp },
  { rotulo: "Comunicados", icone: Megaphone, to: "/comunicados" },
  { rotulo: "Ocultar", icone: EyeOff },
];

const ITEM = "cursor-pointer rounded-md text-sm text-white focus:bg-panel-active focus:text-white";

// Perfil fixo no topo direito de todas as páginas. Nome e setor são placeholders até a integração.
export function PerfilFlutuante() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: usuario, isPending } = useUsuarioLogado();

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  function irPara(to?: string) {
    if (to) navigate({ to });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="fixed left-64 right-0 top-0 z-40 flex h-16 items-center justify-end gap-5 bg-background/70 px-6 backdrop-blur-md"
    >
      <div className="flex items-center gap-4">
        {ACOES_RAPIDAS.map(({ rotulo, icone: Icone, to }) => (
          <motion.button
            key={rotulo}
            type="button"
            aria-label={rotulo}
            title={rotulo}
            onClick={() => irPara(to)}
            whileHover={{ y: -2, scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="rounded-full p-1.5 text-panel-label transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Icone className="size-5" aria-hidden />
          </motion.button>
        ))}
        <NotificacoesPainel />
      </div>
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
            onSelect={sair}
            className="cursor-pointer rounded-md text-sm font-semibold text-destructive focus:bg-panel-active focus:text-destructive"
          >
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
