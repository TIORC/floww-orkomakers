import { useState, type FormEvent } from "react";
import { motion, type TargetAndTransition } from "framer-motion";

import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { registrarCheckin } from "@/lib/checkin-sentimento";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const LIMITE_MOTIVO = 12000;

export const EMOCOES_SENTIMENTO = [
  { id: "muito_triste", rotulo: "Muito triste", imagem: "/images/sentimento/Very_Sad.png" },
  { id: "triste", rotulo: "Triste", imagem: "/images/sentimento/sad.png" },
  { id: "neutro", rotulo: "Neutro", imagem: "/images/sentimento/Neutral.png" },
  { id: "feliz", rotulo: "Feliz", imagem: "/images/sentimento/Happy.png" },
  { id: "muito_feliz", rotulo: "Muito feliz", imagem: "/images/sentimento/Very_Happy.png" },
] as const;

export type EmocaoSentimento = (typeof EMOCOES_SENTIMENTO)[number]["id"];

// Animação ao passar o mouse: a carinha triste treme e chora, a feliz pula e ri.
const ANIMACAO_HOVER: Record<EmocaoSentimento, TargetAndTransition> = {
  muito_triste: { rotate: [0, -8, 8, 0], y: [0, 2, 0], transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" } },
  triste: { rotate: [0, -5, 5, 0], y: [0, 3, 0], transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } },
  neutro: { rotate: [0, -4, 4, 0], transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } },
  feliz: { y: [0, -10, 0], transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" } },
  muito_feliz: { y: [0, -14, 0], rotate: [0, -6, 6, 0], transition: { duration: 1, repeat: Infinity, ease: "easeInOut" } },
};

const TITULO_CHECKIN = "checkin-sentimento-titulo";
const ID_MOTIVO = "checkin-sentimento-motivo";

export type CheckinEnviado = { emocao: EmocaoSentimento; motivo: string };

function CabecalhoCheckin() {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-3">
      <img
        src="/images/sentimento/Very_Happy.png"
        alt=""
        aria-hidden="true"
        className="size-12 shrink-0 object-contain sm:size-14"
      />
      <div>
        <h2 id={TITULO_CHECKIN} className="font-display text-xl font-semibold text-foreground">
          Como você está se sentindo hoje?
        </h2>
        <p className="mt-1 text-sm text-panel-text">
          Sua resposta vale por um dia inteiro e pode ser alterada até a meia-noite.
        </p>
      </div>
    </div>
  );
}

function SeletorEmocoes({
  valor,
  onChange,
  desabilitado,
}: {
  valor: EmocaoSentimento | null;
  onChange: (emocao: EmocaoSentimento) => void;
  desabilitado: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={TITULO_CHECKIN}
      className="mx-auto grid w-full max-w-[51.2rem] grid-cols-5 items-end gap-[0.6rem] sm:gap-4"
    >
      {EMOCOES_SENTIMENTO.map((emocao) => {
        const selecionado = valor === emocao.id;
        return (
          <motion.button
            key={emocao.id}
            type="button"
            role="radio"
            aria-checked={selecionado}
            aria-label={emocao.rotulo}
            title={emocao.rotulo}
            disabled={desabilitado}
            onClick={() => onChange(emocao.id)}
            animate={{ scale: selecionado ? 1.05 : 1 }}
            whileHover={{ y: -6, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className={cn(
              "group flex aspect-square w-full items-center justify-center rounded-2xl border-2 bg-card p-3 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
              selecionado ? "border-brand bg-brand/10 shadow-lg" : "border-border hover:border-brand/60 hover:bg-muted/50 hover:shadow-xl",
            )}
          >
            <motion.img
              src={emocao.imagem}
              alt=""
              aria-hidden="true"
              whileHover={ANIMACAO_HOVER[emocao.id]}
              className="h-auto w-full max-w-[4.8rem] object-contain sm:max-w-[5.6rem]"
            />
          </motion.button>
        );
      })}
    </div>
  );
}

// Check verde animado: o círculo e o traço se desenham, e a cada 5 segundos o ícone pulsa.
function CheckSucesso() {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      className="size-16 text-emerald-500"
      aria-hidden="true"
      animate={{ scale: [1, 1.12, 1] }}
      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 4.4, ease: "easeInOut" }}
    >
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.path
        d="M20 33 L28 41 L44 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

export function CheckinSentimento({ onEnviar }: { onEnviar?: (checkin: CheckinEnviado) => void }) {
  const [emocao, setEmocao] = useState<EmocaoSentimento | null>(null);
  const [motivo, setMotivo] = useState("");
  const [enviado, setEnviado] = useState(false);

  const restantes = LIMITE_MOTIVO - motivo.length;
  const temEmocaoSelecionada = emocao !== null;

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emocao) return;
    try {
      await registrarCheckin(emocao, motivo.trim());
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível registrar o sentimento.");
      return;
    }
    onEnviar?.({ emocao, motivo: motivo.trim() });
    setEnviado(true);
  }

  return (
    <section aria-label="Check-in de sentimento" className="mt-10 w-full">
      <div className="rounded-2xl bg-panel p-6">
        {enviado ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <CheckSucesso />
            <p className="text-center font-display text-2xl font-bold text-emerald-500">Nenhuma Pendência!!</p>
          </div>
        ) : (
          <>
          <CabecalhoCheckin />
          <form className="mt-10 flex flex-col gap-5" onSubmit={enviar}>
            <SeletorEmocoes valor={emocao} onChange={setEmocao} desabilitado={false} />

            {temEmocaoSelecionada ? (
              <div>
                <Label htmlFor={ID_MOTIVO} className="text-sm font-semibold text-foreground">
                  Por que você está se sentindo assim?
                  <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id={ID_MOTIVO}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value.slice(0, LIMITE_MOTIVO))}
                  maxLength={LIMITE_MOTIVO}
                  rows={4}
                  autoFocus
                  placeholder="Escreva o que estiver na sua mente. Esse texto é sigiloso."
                  className="mt-2 resize-y rounded-xl border-border bg-background"
                />
                <p
                  className={cn(
                    "mt-1.5 text-right text-xs font-semibold",
                    restantes <= 500 ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {motivo.length.toLocaleString("pt-BR")} / {LIMITE_MOTIVO.toLocaleString("pt-BR")} caracteres
                </p>
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!temEmocaoSelecionada}
                className="min-w-52 bg-brand text-slate-900 shadow hover:bg-brand/90 hover:text-slate-900"
              >
                Enviar como estou hoje
              </Button>
            </div>
          </form>
          </>
        )}
      </div>
    </section>
  );
}
