import { useState, type FormEvent } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
          <button
            key={emocao.id}
            type="button"
            role="radio"
            aria-checked={selecionado}
            aria-label={emocao.rotulo}
            title={emocao.rotulo}
            disabled={desabilitado}
            onClick={() => onChange(emocao.id)}
            className={cn(
              "group flex aspect-square w-full items-center justify-center rounded-2xl border-2 bg-card p-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
              selecionado
                ? "scale-105 border-brand bg-brand/10 shadow-lg"
                : "border-border hover:-translate-y-1.5 hover:scale-110 hover:border-brand/60 hover:bg-muted/50 hover:shadow-xl active:scale-95",
            )}
          >
            <img
              src={emocao.imagem}
              alt=""
              aria-hidden="true"
              className="h-auto w-full max-w-[4.8rem] object-contain transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3 sm:max-w-[5.6rem]"
            />
          </button>
        );
      })}
    </div>
  );
}

export function CheckinSentimento({ onEnviar }: { onEnviar?: (checkin: CheckinEnviado) => void }) {
  const [emocao, setEmocao] = useState<EmocaoSentimento | null>(null);
  const [motivo, setMotivo] = useState("");
  const [enviado, setEnviado] = useState(false);

  const restantes = LIMITE_MOTIVO - motivo.length;
  const temEmocaoSelecionada = emocao !== null;

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emocao) return;
    onEnviar?.({ emocao, motivo: motivo.trim() });
    setEnviado(true);
  }

  return (
    <section aria-label="Check-in de sentimento" className="mt-10 w-full">
      <div className="rounded-2xl bg-panel p-6">
        <CabecalhoCheckin />

        {enviado ? (
          <p className="mt-8 text-center text-sm font-medium text-foreground">
            Sentimento registrado. Obrigado por compartilhar!
          </p>
        ) : (
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
        )}
      </div>
    </section>
  );
}
