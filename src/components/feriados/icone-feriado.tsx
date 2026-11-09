import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Cada feriado conhecido ganha um desenho próprio (traço, cor da marca). Os demais usam o ícone de calendário.
type Desenho = "ano-novo" | "carnaval" | "cruz" | "bandeira" | "engrenagem" | "sol" | "estrela" | "vela" | "punho" | "arvore" | "calendario";

const TRACOS: { nome: RegExp; desenho: Desenho }[] = [
  { nome: /confraterniza/i, desenho: "ano-novo" },
  { nome: /carnaval/i, desenho: "carnaval" },
  { nome: /sexta-feira santa/i, desenho: "cruz" },
  { nome: /tiradentes/i, desenho: "bandeira" },
  { nome: /trabalho/i, desenho: "engrenagem" },
  { nome: /bahia/i, desenho: "sol" },
  { nome: /independ/i, desenho: "bandeira" },
  { nome: /corpus christi/i, desenho: "cruz" },
  { nome: /aparecida/i, desenho: "estrela" },
  { nome: /finados/i, desenho: "vela" },
  { nome: /rep[uú]blica/i, desenho: "bandeira" },
  { nome: /consci[eê]ncia negra/i, desenho: "punho" },
  { nome: /natal/i, desenho: "arvore" },
];

export function desenhoDoFeriado(nome: string): Desenho {
  return TRACOS.find((item) => item.nome.test(nome))?.desenho ?? "calendario";
}

// Um traço por desenho, todos em 24x24 com stroke, para ficarem com o mesmo peso visual.
const CONTEUDO: Record<Desenho, ReactNode> = {
  "ano-novo": (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  carnaval: (
    <>
      <path d="M4 10c0-4 3.6-6 8-6s8 2 8 6c0 4-3.6 6-8 6-.8 0-1.6-.1-2.3-.3L6 20l.8-4.1C4.9 14.7 4 12.9 4 10z" />
      <circle cx="9" cy="10" r="1" />
      <circle cx="15" cy="10" r="1" />
    </>
  ),
  cruz: (
    <>
      <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" />
    </>
  ),
  bandeira: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4c3-2 5 2 8 0s5 2 6 0v10c-1 2-3-2-6 0s-5-2-8 0" />
    </>
  ),
  engrenagem: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5" />
    </>
  ),
  estrela: <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z" />,
  vela: (
    <>
      <path d="M9 21h6M10 21V10h4v11" />
      <path d="M12 10V7M12 7c0-1.5 1.5-2 1.5-3.5S12 2 12 2s-1.5 1-1.5 1.5S12 5.5 12 7" />
    </>
  ),
  punho: (
    <>
      <path d="M7 11V8a2 2 0 014 0v3M11 11V7a2 2 0 014 0v4M15 11V8.5a2 2 0 014 0V14c0 4-2.5 7-6.5 7H12c-2.5 0-4-1.5-5-4l-2-5a1.6 1.6 0 012.5-1.8L7 11" />
    </>
  ),
  arvore: (
    <>
      <path d="M12 2l4 5h-2.5l3.5 4.5H15l4 5H5l4-5H6.5L10 7H8z" />
      <path d="M12 16.5V22" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
};

type Props = { nome: string; indice?: number; className?: string };

// Ícone animado do feriado: balança sem parar (flutua e gira de leve), com cada card começando num tempo diferente.
// Quem pediu "reduzir movimento" no sistema vê o ícone parado.
export function IconeFeriado({ nome, indice = 0, className }: Props) {
  const desenho = desenhoDoFeriado(nome);
  const reduzirMovimento = useReducedMotion();
  const atraso = (indice % 7) * 0.3;
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("size-9 shrink-0 text-brand", className)}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={
        reduzirMovimento
          ? { opacity: 1, scale: 1 }
          : {
              opacity: 1,
              scale: [1, 1.08, 1],
              y: [0, -3, 0],
              rotate: [0, 6, 0, -6, 0],
            }
      }
      whileHover={{ scale: 1.2 }}
      transition={
        reduzirMovimento
          ? { duration: 0.2 }
          : {
              opacity: { duration: 0.3, delay: atraso },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: atraso },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: atraso },
              rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: atraso },
            }
      }
    >
      {CONTEUDO[desenho]}
    </motion.svg>
  );
}
