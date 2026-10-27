import { Crown, Users } from "lucide-react";

import { getIniciais } from "@/lib/iniciais";
import { cn } from "@/lib/utils";

type Props = {
  nome: string;
  cargo: string;
  fotoUrl: string;
  // Data de admissão como vem da planilha (DD/MM/AAAA ou ISO).
  dataAdmissao?: string;
  // Área do sub-líder (ex.: "Célula de Serviço"). Vazio quando a pessoa não é sub-líder.
  subLider?: string;
  // Períodos de férias programadas, já formatados (ex.: "04/01/2027 a 08/01/2027").
  feriasProgramadas?: { id: string; texto: string }[];
  // Com este handler, cada período ganha o botão para remover a programação.
  aoRemoverFerias?: ((id: string) => void) | undefined;
  // Mostra o selo "Programado!" quando a pessoa já tem férias programadas.
  programado?: boolean;
  // O líder do setor aparece maior, com borda e selo em amarelo.
  lider?: boolean;
};

// Tempo de casa desde a admissão, ex.: "2 anos e 3 meses de casa".
function calcularTempoDeCasa(dataAdmissao: string): string {
  const texto = dataAdmissao.trim();
  if (!texto) return "";
  const brasil = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  const admissao = brasil
    ? new Date(Number(brasil[3]), Number(brasil[2]) - 1, Number(brasil[1]))
    : new Date(texto);
  if (Number.isNaN(admissao.getTime())) return "";

  const agora = new Date();
  let meses =
    (agora.getFullYear() - admissao.getFullYear()) * 12 + (agora.getMonth() - admissao.getMonth());
  if (agora.getDate() < admissao.getDate()) meses -= 1;
  if (meses < 1) return "Menos de 1 mês de casa";

  const anos = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  const partes: string[] = [];
  if (anos) partes.push(`${anos} ${anos === 1 ? "ano" : "anos"}`);
  if (mesesRestantes) partes.push(`${mesesRestantes} ${mesesRestantes === 1 ? "mês" : "meses"}`);
  return `${partes.join(" e ")} de casa`;
}

// Cartão de uma pessoa: foto (ou iniciais), nome, cargo e tempo de casa.
export function CartaoColaborador({
  nome,
  cargo,
  fotoUrl,
  dataAdmissao = "",
  subLider = "",
  feriasProgramadas = [],
  aoRemoverFerias,
  programado = false,
  lider = false,
}: Props) {
  const tempoDeCasa = calcularTempoDeCasa(dataAdmissao);
  return (
    <div
      className={cn(
        "relative flex items-center gap-4 rounded-2xl border bg-panel",
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
      {programado && (
        <span className="absolute right-2 top-2 rounded-full bg-brand px-2 py-px text-[10px] font-bold uppercase tracking-wide text-slate-900">
          Programado!
        </span>
      )}
      <div className="min-w-0">
        {lider && (
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-900">
            <Crown className="size-3" aria-hidden />
            Líder
          </span>
        )}
        {subLider.trim() && (
          <span className="mb-1 inline-flex max-w-full items-center gap-1 rounded-full bg-sky-400 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-900">
            <Users className="size-3 shrink-0" aria-hidden />
            <span className="truncate">Líder de Sub-Célula</span>
          </span>
        )}
        <p className={cn("truncate font-semibold text-white", lider && "text-lg")}>{nome}</p>
        <p className="truncate text-sm text-white/70">{cargo || "—"}</p>
        {tempoDeCasa && <p className="truncate text-xs text-white/50">{tempoDeCasa}</p>}
        {feriasProgramadas.length > 0 && (
          <div className="mt-2 border-t border-panel-active pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Férias programadas</p>
            <ul className="mt-1 grid gap-0.5">
              {feriasProgramadas.map((periodo) => (
                <li key={periodo.id} className="flex items-center justify-between gap-2 text-xs text-white">
                  <span>{periodo.texto}</span>
                  {aoRemoverFerias && (
                    <button
                      type="button"
                      onClick={() => aoRemoverFerias(periodo.id)}
                      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-400 transition hover:bg-red-500/10"
                    >
                      Remover
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
