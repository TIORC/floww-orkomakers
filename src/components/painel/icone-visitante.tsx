import { motion } from "framer-motion";

// Ícone do papel Visitante: crachá preso ao peito, sem fundo.
// O crachá balança para os lados, preso pelo topo, enquanto `ativo` estiver ligado (mouse sobre o card).
export function IconeVisitante({ className, ativo }: { className?: string; ativo: boolean }) {
  return (
    <motion.img
      src="/images/icone-visitante.png"
      alt=""
      className={className}
      style={{ originX: 0.5, originY: 0 }}
      variants={{
        parado: { rotate: 0 },
        ativo: {
          rotate: [0, 6, -6, 4, -4, 0],
          transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
        },
      }}
      animate={ativo ? "ativo" : "parado"}
    />
  );
}
