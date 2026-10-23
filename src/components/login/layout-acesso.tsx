import type { ReactNode } from "react";
import { motion } from "framer-motion";

// Fundo e marca das telas de acesso (entrar e definir senha). O conteúdo entra no card.
export function LayoutAcesso({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen w-full justify-center overflow-hidden bg-background p-6">
      {/* Fundo animado: bolhas de luz suaves que flutuam devagar atrás do card. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-[30rem] rounded-full bg-amber-400/40 blur-3xl"
        animate={{ x: [0, 120, -60, 0], y: [0, 90, 30, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-0 size-[34rem] rounded-full bg-blue-500/45 blur-3xl"
        animate={{ x: [0, -120, 40, 0], y: [0, -70, 20, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/3 top-1/4 size-96 rounded-full bg-emerald-400/30 blur-3xl"
        animate={{ x: [0, 90, -70, 0], y: [0, -60, 50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Marca no espaço da direita: mascote flutuando e logo do grupo logo abaixo. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 flex-col items-center justify-center gap-2 lg:flex">
        <motion.img
          src="/images/mascote-leao.png"
          alt=""
          aria-hidden
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: [0, -12, 0] }}
          transition={{ opacity: { duration: 0.8 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 } }}
          className="w-96 object-contain drop-shadow-2xl"
          style={{ maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)" }}
        />
        <motion.img
          src="/images/logo-grupo-orcoma-branca.png"
          alt="Grupo Orcoma"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
          className="-mt-14 w-80 object-contain"
        />
      </div>
      <div className="relative z-10 flex min-h-screen w-full max-w-[1400px] items-center justify-start pl-10">{children}</div>
    </main>
  );
}
