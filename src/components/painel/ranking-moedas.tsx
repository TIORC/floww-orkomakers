import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";

import {
  listarRankingColaboradores,
  listarRankingGestores,
  posicaoNoRanking,
  type EntradaRanking,
} from "@/lib/importacao-colaboradores";
import { cn } from "@/lib/utils";
import { useUsuarioLogado } from "@/hooks/use-usuario-logado";

const TITULO_RANKING = "ranking-moedas-titulo";

type Aba = "colaboradores" | "gestores";

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "colaboradores", rotulo: "Colaboradores" },
  { id: "gestores", rotulo: "Gestores" },
];

// Saldo de Orcoins ainda não existe no banco: todos aparecem com 0.
const SALDO_PADRAO = 0;

// Cores de cada metal: frente, topo (mais claro), lateral (mais escuro) e o brilho interno.
const METAIS = {
  ouro: { frente: ["#fde68a", "#d4a017"], topo: "#fef3c7", lateral: "#9a6b07", brilho: "#fffbeb" },
  prata: { frente: ["#f1f5f9", "#94a3b8"], topo: "#ffffff", lateral: "#64748b", brilho: "#ffffff" },
  bronze: { frente: ["#fdba74", "#9a4a12"], topo: "#fed7aa", lateral: "#6b2f0a", brilho: "#fff7ed" },
} as const;

// Um degrau do pódio: avatar, nome e o bloco 3D em SVG com a posição.
const DEGRAUS = {
  1: { altura: 110, metal: METAIS.ouro, cor: "text-brand", avatar: "size-16" },
  2: { altura: 84, metal: METAIS.prata, cor: "text-slate-300", avatar: "size-14" },
  3: { altura: 66, metal: METAIS.bronze, cor: "text-amber-600", avatar: "size-14" },
} as const;

function DegrauPodio({ posicao, entrada }: { posicao: 1 | 2 | 3; entrada: EntradaRanking | undefined }) {
  const { altura, metal, cor, avatar } = DEGRAUS[posicao];
  const id = `podio-${posicao}`;
  const profundidade = 10;
  const topoY = 120 - altura;
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 18, delay: posicao === 3 ? 0 : posicao === 2 ? 0.25 : 0.5 }}
      className="flex w-1/3 max-w-[150px] flex-col items-center"
    >
      {entrada ? (
        <>
          <span className={cn("flex items-center justify-center overflow-hidden rounded-full bg-panel-active text-sm font-bold text-panel-text ring-2 ring-current", cor, avatar)}>
            {entrada.fotoUrl ? (
              <img src={entrada.fotoUrl} alt="" className="size-full object-cover" />
            ) : (
              entrada.nome
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((parte) => parte[0])
                .join("")
                .toUpperCase()
            )}
          </span>
          <p className="mt-2 w-full truncate text-center text-sm font-bold text-foreground">{entrada.nome}</p>
          <p className="w-full truncate text-center text-xs text-panel-label">{entrada.subtitulo || "—"}</p>
        </>
      ) : (
        <p className="mb-2 text-xs text-panel-label">Vago</p>
      )}
      <motion.svg
        viewBox="0 0 120 120"
        className="mt-3 h-[120px] w-full overflow-visible"
        role="img"
        aria-label={`${posicao}º lugar`}
              >
        <defs>
          <clipPath id={`${id}-face`}>
            <rect x="10" y={topoY} width="100" height={altura} />
          </clipPath>
          <linearGradient id={`${id}-frente`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={metal.frente[0]} />
            <stop offset="1" stopColor={metal.frente[1]} />
          </linearGradient>
          {/* Brilho interno: faixa clara que some para as bordas, dando aspecto metálico. */}
          <linearGradient id={`${id}-brilho`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={metal.brilho} stopOpacity="0" />
            <stop offset="0.3" stopColor={metal.brilho} stopOpacity="0.55" />
            <stop offset="0.5" stopColor={metal.brilho} stopOpacity="0.1" />
            <stop offset="0.8" stopColor={metal.brilho} stopOpacity="0.4" />
            <stop offset="1" stopColor={metal.brilho} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lateral direita (profundidade) */}
        <path
          d={`M110 ${topoY} L${110 + profundidade} ${topoY - profundidade} V${120 - profundidade} L110 120 Z`}
          fill={metal.lateral}
        />
        {/* Topo em perspectiva */}
        <path
          d={`M10 ${topoY} L${10 + profundidade} ${topoY - profundidade} H${110 + profundidade} L110 ${topoY} Z`}
          fill={metal.topo}
        />
        {/* Face frontal com gradiente metálico */}
        <rect x="10" y={topoY} width="100" height={altura} fill={`url(#${id}-frente)`} />
        {/* Brilho interno sobre a face */}
        <rect x="10" y={topoY} width="100" height={altura} fill={`url(#${id}-brilho)`} />
        {/* Reflexo leve que percorre a face, sem sair dela */}
        <rect
          className={posicao === 1 ? "podio-reflexo podio-reflexo-rapido" : "podio-reflexo"}
          x="-30"
          y={topoY}
          width="40"
          height={altura}
          fill={`url(#${id}-brilho)`}
          clipPath={`url(#${id}-face)`}
        />
        {/* Filete de luz na aresta do topo */}
        <rect x="10" y={topoY} width="100" height="2" fill={metal.brilho} opacity="0.8" />

        <text
          x="60"
          y={topoY + altura / 2 + 12}
          textAnchor="middle"
          className="fill-slate-900 font-display text-4xl font-extrabold"
        >
          {posicao}
        </text>
      </motion.svg>
    </motion.div>
  );
}

// Pódio do TOP 3: 2º à esquerda, 1º no centro (mais alto) e 3º à direita.
function Podio({ entradas }: { entradas: EntradaRanking[] }) {
  return (
    <div className="flex items-end justify-center gap-3 rounded-xl border border-panel-active bg-background px-4 pb-0 pt-6">
      <DegrauPodio posicao={2} entrada={entradas[1]} />
      <DegrauPodio posicao={1} entrada={entradas[0]} />
      <DegrauPodio posicao={3} entrada={entradas[2]} />
    </div>
  );
}

// Números que sobem até o valor final ao aparecer (ex.: pontos do ranking).
function ContadorAnimado({ valor, className }: { valor: number; className?: string }) {
  const [exibido, setExibido] = useState(0);
  useEffect(() => {
    const controle = animate(0, valor, { duration: 1.2, ease: "easeOut", onUpdate: (atual) => setExibido(Math.round(atual)) });
    return () => controle.stop();
  }, [valor]);
  return <span className={className}>{exibido.toLocaleString("pt-BR")}</span>;
}

function Avatar({ nome, fotoUrl }: { nome: string; fotoUrl: string }) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel-active text-sm font-bold text-panel-text">
      {fotoUrl ? <img src={fotoUrl} alt="" className="size-full object-cover" /> : iniciais || "—"}
    </span>
  );
}

export function RankingMoedas() {
  const [aba, setAba] = useState<Aba>("colaboradores");
  const { data: usuario } = useUsuarioLogado();
  const saldo = SALDO_PADRAO;

  const { data: entradas = [], isPending, isError } = useQuery<EntradaRanking[]>({
    queryKey: ["ranking-moedas", aba],
    queryFn: aba === "colaboradores" ? listarRankingColaboradores : listarRankingGestores,
  });

  // Posição do usuário logado no ranking completo, mesmo fora do TOP 10.
  const { data: minhaPosicao } = useQuery({
    queryKey: ["ranking-posicao", usuario?.nome ?? ""],
    queryFn: () => posicaoNoRanking(usuario?.nome ?? ""),
    enabled: Boolean(usuario?.nome),
  });

  return (
    <section aria-labelledby={TITULO_RANKING} className="w-full max-w-[800px]">
      <h2 id={TITULO_RANKING} className="ml-8 font-display text-xl font-semibold text-muted-foreground">
        Ranking de Gameficação! - Acompanhe seus Orcoins!!
      </h2>

      <div className="mt-4 rounded-2xl bg-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-panel-active bg-background p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-10 shrink-0 text-center text-sm font-bold text-brand">
              {minhaPosicao ? `${minhaPosicao}º` : "—"}
            </span>
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel-active text-sm font-bold text-panel-text">
              {usuario?.fotoUrl ? (
                <img src={usuario.fotoUrl} alt="" className="size-full object-cover" />
              ) : (
                (usuario?.nomeCompleto ?? "C").slice(0, 2).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-foreground">{usuario?.nomeCompleto ?? "Colaborador"}</p>
              <p className="truncate text-xs font-semibold text-brand">{usuario?.setor || "Setor não informado"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-panel-active px-4 py-2">
            <Coins className="size-4 shrink-0 text-brand" aria-hidden />
            <span className="font-display text-base font-bold text-foreground">{saldo}</span>
            <span className="text-xs font-semibold text-panel-text">Orcoins</span>
          </div>
        </div>

        <div role="tablist" className="mt-5 grid w-full grid-cols-2 rounded-lg bg-background p-1 sm:w-96">
          {ABAS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={aba === item.id}
              onClick={() => setAba(item.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                aba === item.id ? "bg-panel-active text-brand" : "text-panel-text hover:text-foreground",
              )}
            >
              {item.rotulo}
            </button>
          ))}
        </div>

        {isPending ? (
          <p className="mt-4 py-8 text-center text-sm text-panel-text">Carregando...</p>
        ) : isError ? (
          <p className="mt-4 py-8 text-center text-sm text-panel-text">Não foi possível carregar o ranking.</p>
        ) : entradas.length === 0 ? (
          <p className="mt-4 py-8 text-center text-sm text-panel-text">
            {aba === "colaboradores" ? "Nenhum colaborador cadastrado." : "Nenhum gestor cadastrado."}
          </p>
        ) : (
          <>
            <div className="mt-4">
              <Podio entradas={entradas.slice(0, 3)} />
            </div>
            <ul className="mt-4 space-y-2">
            {entradas.slice(3).map((entrada, indice) => (
              <li
                key={`${aba}-${entrada.nome}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-panel-active bg-background p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-10 shrink-0 text-center text-sm font-bold text-brand">{indice + 4}º</span>
                  <Avatar nome={entrada.nome} fotoUrl={entrada.fotoUrl} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold text-foreground">{entrada.nome}</p>
                    <p className="truncate text-xs font-semibold text-brand">{entrada.subtitulo || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-panel-active px-4 py-2">
                  <Coins className="size-4 shrink-0 text-brand" aria-hidden />
                  <ContadorAnimado valor={SALDO_PADRAO} className="font-display text-base font-bold text-foreground" />
                  <span className="text-xs font-semibold text-panel-text">Orcoins</span>
                </div>
              </li>
            ))}
          </ul>
          </>
        )}
      </div>
    </section>
  );
}
