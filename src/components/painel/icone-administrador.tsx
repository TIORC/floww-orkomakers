import { motion } from "framer-motion";

// Ícone do papel Administrador: pessoa de terno com engrenagem no lugar da cabeça.
// A engrenagem gira enquanto `ativo` estiver ligado (mouse sobre o card).
export function IconeAdministrador({ className, ativo }: { className?: string; ativo: boolean }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 480 490"
      className={className}
      aria-hidden
      initial="parado"
      animate={ativo ? "girando" : "parado"}
    >
      {/* Corpo do terno */}
      <path fill="#3a3b3a" d="M62 410 L62 335 Q70 325 130 305 L175 275 L243 300 L311 275 L356 305 Q416 325 428 335 L428 410 Z" />
      {/* Lapelas */}
      <path fill="#6b6c6b" d="M130 305 L172 332 L206 372 L186 410 L140 410 Z" />
      <path fill="#6b6c6b" d="M356 305 L314 332 L280 372 L300 410 L346 410 Z" />
      {/* Colarinho */}
      <path fill="#a3aee0" d="M168 272 L206 300 L232 340 L200 372 L164 330 Z" />
      <path fill="#a3aee0" d="M318 272 L280 300 L254 340 L286 372 L322 330 Z" />
      {/* Gravata */}
      <path fill="#e8e8e8" d="M232 332 L254 332 L260 410 L243 430 L226 410 Z" />

      {/* Engrenagem: o centro do bounding box é o centro da engrenagem, então gira no próprio eixo */}
      <motion.g
        style={{ originX: 0.5, originY: 0.5 }}
        variants={{
          parado: { rotate: 0 },
          girando: {
            rotate: 360,
            transition: { duration: 2, repeat: Infinity, ease: "linear" },
          },
        }}
      >
        <g fill="#d32f2f" transform="translate(243 180)">
          <rect x="-18" y="-100" width="36" height="44" />
          <rect x="-18" y="-100" width="36" height="44" transform="rotate(45)" />
          <rect x="-18" y="-100" width="36" height="44" transform="rotate(90)" />
          <rect x="-18" y="-100" width="36" height="44" transform="rotate(135)" />
          <rect x="-18" y="-100" width="36" height="44" transform="rotate(180)" />
          <rect x="-18" y="-100" width="36" height="44" transform="rotate(225)" />
          <rect x="-18" y="-100" width="36" height="44" transform="rotate(270)" />
          <rect x="-18" y="-100" width="36" height="44" transform="rotate(315)" />
        </g>
        <path
          fill="#d32f2f"
          fillRule="evenodd"
          d="M313 180 A70 70 0 1 0 173 180 A70 70 0 1 0 313 180 Z M275 180 A32 32 0 1 0 211 180 A32 32 0 1 0 275 180 Z"
        />
      </motion.g>
    </motion.svg>
  );
}
