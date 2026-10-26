import { Crown } from "lucide-react";

import { getIniciais } from "@/lib/iniciais";
import { cn } from "@/lib/utils";

type Props = {
  nome: string;
  cargo: string;
  fotoUrl: string;
  // O líder do setor aparece maior, com borda e selo em amarelo.
  lider?: boolean;
};

// Cartão de uma pessoa: foto (ou iniciais), nome e cargo.
export function CartaoColaborador({ nome, cargo, fotoUrl, lider = false }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border bg-panel",
        lider
          ? "border-brand p-5 shadow-lg shadow-brand/10 ring-1 ring-brand/40"
          : "border-panel-active p-4",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel-active font-bold text-panel-text",
          lider ? "size-20 text-2xl ring-2 ring-brand" : "size-14 text-lg",
        )}
      >
        {fotoUrl ? (
          <img src={fotoUrl} alt="" className="size-full object-cover" />
        ) : (
          getIniciais(nome) || "—"
        )}
      </span>
      <div className="min-w-0">
        {lider && (
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-900">
            <Crown className="size-3" aria-hidden />
            Líder
          </span>
        )}
        <p className={cn("truncate font-semibold text-white", lider && "text-lg")}>{nome}</p>
        <p className="truncate text-sm text-white/70">{cargo || "—"}</p>
      </div>
    </div>
  );
}
