import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

// Ícone do papel Desenvolvedor do Sistema: pessoa digitando no notebook, sem fundo.
// Enquanto `ativo` estiver ligado (mouse sobre o card), o corpo balança como quem digita
// e números verdes saem da tela, um após o outro.
const DIGITOS = ["0", "1", "1", "0", "1", "0"];

export function IconeDesenvolvedor({ className, ativo }: { className?: string; ativo: boolean }) {
  return (
    <div className={cn("relative", className)} aria-hidden>
      <motion.img
        src="/images/icone-desenvolvedor.png"
        alt=""
        className="size-full object-contain"
        variants={{
          parado: { y: 0 },
          ativo: {
            y: [0, 2, 0],
            transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
          },
        }}
        animate={ativo ? "ativo" : "parado"}
      />
      {DIGITOS.map((digito, indice) => (
        <motion.span
          key={indice}
          className="pointer-events-none absolute font-mono text-sm font-bold text-green-400"
          style={{ left: `${36 + (indice % 3) * 9}%`, top: "58%" }}
          variants={{
            parado: { opacity: 0, y: 0 },
            ativo: {
              opacity: [0, 1, 0],
              y: [0, -40],
              transition: {
                duration: 1.6,
                repeat: Infinity,
                delay: indice * 0.3,
                ease: "easeOut",
              },
            },
          }}
          animate={ativo ? "ativo" : "parado"}
        >
          {digito}
        </motion.span>
      ))}
    </div>
  );
}
