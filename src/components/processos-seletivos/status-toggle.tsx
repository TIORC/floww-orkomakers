import { motion } from "framer-motion";

// Toggle de status da vaga: "Ativo" (escuro) e "Fechado" (vermelho), com a bolinha deslizando em mola.
export function StatusToggle({
  ativo,
  rotulo,
  onAlternar,
}: {
  ativo: boolean;
  rotulo: string;
  onAlternar: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      aria-label={`Status da vaga ${rotulo}`}
      onClick={(evento) => {
        evento.stopPropagation();
        onAlternar();
      }}
      className="group inline-flex w-36 items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <motion.span
        animate={{ backgroundColor: ativo ? "#334155" : "#ef4444" }}
        transition={{ duration: 0.25 }}
        className={`relative flex h-7 w-14 items-center rounded-full p-1 shadow-inner ${ativo ? "justify-end" : "justify-start"}`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          className="size-5 rounded-full bg-white shadow-md"
        />
      </motion.span>
      <motion.span
        key={ativo ? "ativo" : "fechado"}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className={`w-16 text-left text-sm font-semibold ${ativo ? "text-slate-900" : "text-red-500"}`}
      >
        {ativo ? "Ativo" : "Fechado"}
      </motion.span>
    </button>
  );
}
