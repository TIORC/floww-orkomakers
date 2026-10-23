import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

// Entrada suave de cada card: sobe e aparece quando entra na tela, com atraso pelo índice.
// O wrapper é um grid de um item só, para o card ocupar a célula inteira (largura e altura).
export function AnimarEntrada({
  indice,
  className,
  children,
}: {
  indice: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: Math.min(indice, 6) * 0.06, ease: "easeOut" }}
      className={cn("grid min-w-0", className)}
    >
      {children}
    </motion.div>
  );
}
