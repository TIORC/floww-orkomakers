import { motion } from "framer-motion";

// Ícone do papel Gestor: homem de terno de braços cruzados.
// O busto dá uma leve respirada enquanto `ativo` estiver ligado (mouse sobre o card).
export function IconeGestor({ className, ativo }: { className?: string; ativo: boolean }) {
  return (
    <motion.img
      src="/images/icone-gestor.png"
      alt=""
      className={className}
      style={{ originX: 0.5, originY: 1 }}
      variants={{
        parado: { scale: 1 },
        ativo: {
          scale: [1, 1.08, 1],
          transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
        },
      }}
      animate={ativo ? "ativo" : "parado"}
    />
  );
}
