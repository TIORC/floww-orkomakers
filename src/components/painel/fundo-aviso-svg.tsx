import { motion } from "framer-motion";

// Desenho animado que cobre o card inteiro, por trás do conteúdo. Não captura cliques.
export function FundoAvisoSvg({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-slate-900 opacity-[0.16]"
      fill="none"
      stroke="currentColor"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {id === "horas-extra" && (
        <>
          {/* anel que pulsa e se desenha */}
          <motion.circle
            cx={150}
            cy={100}
            r={90}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, scale: [1, 1.04, 1] }}
            transition={{
              pathLength: { duration: 2.2, ease: "easeOut" },
              scale: { duration: 4, ease: "easeInOut", repeat: Infinity },
            }}
            style={{ originX: "150px", originY: "100px" }}
          />
          {/* ponteiro das horas, gira devagar */}
          <motion.line
            x1={150}
            y1={100}
            x2={150}
            y2={40}
            style={{ originX: "150px", originY: "100px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 16, ease: "linear", repeat: Infinity }}
          />
          {/* ponteiro dos minutos, gira mais rápido */}
          <motion.line
            x1={150}
            y1={100}
            x2={196}
            y2={100}
            style={{ originX: "150px", originY: "100px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          />
          {/* marcas dos minutos orbitando */}
          {[0, 1, 2, 3].map((indice) => (
            <motion.circle
              key={indice}
              cx={150}
              cy={24}
              r={5}
              fill="currentColor"
              stroke="none"
              style={{ originX: "150px", originY: "100px" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 10, ease: "linear", repeat: Infinity, delay: -indice * 2.5 }}
            />
          ))}
          {/* pontos do relógio, cada um piscando */}
          {[0, 1, 2].map((indice) => (
            <motion.circle
              key={`ponto-${indice}`}
              cx={30 + indice * 26}
              cy={170}
              r={4}
              fill="currentColor"
              stroke="none"
              animate={{ opacity: [0.2, 1, 0.2], y: [0, -8, 0] }}
              transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity, delay: indice * 0.4 }}
            />
          ))}
        </>
      )}

      {id === "ausencia" && (
        <>
          {/* calendário que sobe e desce */}
          <motion.rect
            x={80}
            y={50}
            width={110}
            height={120}
            rx={18}
            animate={{ y: [50, 36, 50], rotate: [0, 3, 0] }}
            transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
            style={{ originX: "135px", originY: "110px" }}
          />
          <motion.line
            x1={80}
            y1={92}
            x2={190}
            y2={92}
            animate={{ y: [42, 28, 42] }}
            transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
          />
          {/* argolas que balançam */}
          <motion.line
            x1={108}
            y1={24}
            x2={108}
            y2={56}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
          />
          <motion.line
            x1={162}
            y1={24}
            x2={162}
            y2={56}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, delay: 0.6 }}
          />
          {/* risco que varre o desenho */}
          <motion.line
            x1={20}
            y1={180}
            x2={180}
            y2={20}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
          />
        </>
      )}

      {id === "retrabalho" && (
        <>
          {/* seta circular que gira e respira */}
          <motion.path
            d="M150 40 A60 60 0 1 1 90 100"
            style={{ originX: "150px", originY: "100px" }}
            animate={{ rotate: 360, scale: [1, 1.06, 1] }}
            transition={{
              rotate: { duration: 9, ease: "linear", repeat: Infinity },
              scale: { duration: 3, ease: "easeInOut", repeat: Infinity },
            }}
          />
          <motion.path
            d="M90 100 L76 86 M90 100 L104 86"
            style={{ originX: "150px", originY: "100px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 9, ease: "linear", repeat: Infinity }}
          />
          {/* núcleo que pulsa */}
          <motion.circle
            cx={150}
            cy={100}
            r={26}
            fill="currentColor"
            stroke="none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
            style={{ originX: "150px", originY: "100px" }}
          />
          {/* anéis que se expandem */}
          <motion.circle
            cx={150}
            cy={100}
            r={40}
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 2.5, ease: "easeOut", repeat: Infinity }}
            style={{ originX: "150px", originY: "100px" }}
          />
        </>
      )}
    </svg>
  );
}
