import { motion } from "framer-motion";

type Props = {
  variante: "minhas" | "aguardando";
  titulo: string;
  texto: string;
};

// Ilustração colorida e animada para as listas de avisos sem nenhum item.
function Ilustracao({ variante }: { variante: Props["variante"] }) {
  const flutua = {
    animate: { y: [0, -6, 0] },
    transition: { duration: 3, ease: "easeInOut" as const, repeat: Infinity },
  };
  const brilha = {
    animate: { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] },
    transition: { duration: 2.4, ease: "easeInOut" as const, repeat: Infinity },
  };

  if (variante === "minhas") {
    return (
      <svg viewBox="0 0 200 200" className="size-48" aria-hidden>
        <circle cx="100" cy="104" r="84" fill="#facc15" fillOpacity="0.15" />
        <motion.g {...flutua}>
          {/* prancheta */}
          <rect x="58" y="46" width="84" height="108" rx="14" fill="#ffffff" />
          <rect x="82" y="36" width="36" height="20" rx="6" fill="#facc15" />
          <rect x="74" y="78" width="52" height="8" rx="4" fill="#38bdf8" />
          <rect x="74" y="96" width="40" height="8" rx="4" fill="#a78bfa" />
          <rect x="74" y="114" width="46" height="8" rx="4" fill="#34d399" />
          <rect x="74" y="132" width="26" height="8" rx="4" fill="#fb923c" />
        </motion.g>
        <motion.path
          d="M156 40 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4 l12 -4 z"
          fill="#facc15"
          {...brilha}
        />
        <motion.path
          d="M32 150 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z"
          fill="#a78bfa"
          {...brilha}
        />
        <motion.circle cx="168" cy="150" r="5" fill="#38bdf8" {...brilha} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 200" className="size-48" aria-hidden>
      <circle cx="100" cy="104" r="84" fill="#34d399" fillOpacity="0.15" />
      <motion.g {...flutua}>
        {/* relógio */}
        <circle cx="100" cy="100" r="54" fill="#ffffff" stroke="#facc15" strokeWidth="8" />
        <line x1="100" y1="100" x2="100" y2="70" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        <line x1="100" y1="100" x2="124" y2="112" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        <circle cx="100" cy="100" r="6" fill="#fb923c" />
        {/* selo de verificação */}
        <circle cx="146" cy="142" r="20" fill="#059669" />
        <path d="M136 142 l7 7 l14 -14" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
      <motion.path
        d="M36 52 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4 l12 -4 z"
        fill="#38bdf8"
        {...brilha}
      />
      <motion.path
        d="M164 44 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z"
        fill="#a78bfa"
        {...brilha}
      />
      <motion.circle cx="40" cy="150" r="5" fill="#facc15" {...brilha} />
    </svg>
  );
}

// Mensagem de lista vazia, centralizada, com ilustração colorida.
export function EstadoVazioAvisos({ variante, titulo, texto }: Props) {
  return (
    <div className="mx-auto mt-10 flex w-full max-w-lg flex-col items-center gap-3 text-center">
      <Ilustracao variante={variante} />
      <p className="font-display text-xl font-semibold text-white">{titulo}</p>
      <p className="text-sm text-white/75">{texto}</p>
    </div>
  );
}
