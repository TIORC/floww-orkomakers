import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  PERFIS_DISC,
  TONS_DISC,
  type PerfilDisc,
  type PercentuaisDisc,
} from "@/components/processos-seletivos/perfis-disc";
import { cn } from "@/lib/utils";

export const PASSO = 5;
const TOTAL = 100;
const TOTAL_PASSOS = TOTAL / PASSO;

/**
 * Trava um perfil no valor arrastado e reescala os outros para a soma fechar em
 * 100% exatos, sempre em multiplos do passo e nunca negativos.
 *
 * A redistribuicao usa o metodo do maior resto: os demais perfis mantem a
 * proporcao que ja tinham entre si, e a sobra das casas decimais vai para
 * quem mais tem a perder. Isso evita os desvios de arredondamento que faziam a
 * soma escapar de 100%.
 */
export function redistribuir(
  atual: PercentuaisDisc,
  alvo: PerfilDisc,
  valorBruto: number,
): PercentuaisDisc {
  const outros = PERFIS_DISC.map((perfil) => perfil.valor).filter(
    (perfil) => perfil !== alvo,
  );

  const passosAlvo = Math.min(
    TOTAL_PASSOS,
    Math.max(0, Math.round(valorBruto / PASSO)),
  );
  const passosRestantes = TOTAL_PASSOS - passosAlvo;

  const somaPeso = outros.reduce((total, perfil) => total + atual[perfil], 0);
  const pesos = outros.map((perfil) =>
    somaPeso > 0 ? atual[perfil] / somaPeso : 1 / outros.length,
  );

  const parcelas = pesos.map((peso, indice) => ({
    perfil: outros[indice] as PerfilDisc,
    bruto: peso * passosRestantes,
    inteiro: Math.floor(peso * passosRestantes),
  }));

  let sobra = passosRestantes - parcelas.reduce((t, p) => t + p.inteiro, 0);

  const ordem = [...parcelas]
    .map((parcela) => ({
      perfil: parcela.perfil,
      fracao: parcela.bruto - parcela.inteiro,
      inteiro: parcela.inteiro,
    }))
    .sort(
      (a, b) =>
        b.fracao - a.fracao ||
        atual[b.perfil] - atual[a.perfil] ||
        a.perfil.localeCompare(b.perfil),
    );

  for (const parcela of ordem) {
    if (sobra <= 0) break;
    parcelas.find((p) => p.perfil === parcela.perfil)!.inteiro += 1;
    sobra -= 1;
  }

  const proximo = {} as PercentuaisDisc;
  proximo[alvo] = passosAlvo * PASSO;
  for (const parcela of parcelas) {
    proximo[parcela.perfil] = parcela.inteiro * PASSO;
  }
  return proximo;
}

/**
 * Uma faixa do perfil DISC: slider + digitacao manual do percentual.
 *
 * O input usa um rascunho local porque a redistribuicao reescreve os outros
 * perfis a cada tecla. O rascunho so vira valor ao confirmar (blur ou Enter),
 * para o campo nao "brigar" com quem esta digitando.
 */
export function BarraPercentualDisc({
  perfil,
  valor,
  predominante,
  aoAplicar,
}: {
  perfil: PerfilDisc;
  valor: number;
  predominante: boolean;
  aoAplicar: (valor: number) => void;
}) {
  const [rascunho, setRascunho] = useState<string | null>(null);
  const atalho = PERFIS_DISC.find((item) => item.valor === perfil)?.atalho;
  const tom = TONS_DISC[perfil];

  function confirmar() {
    if (rascunho === null) return;
    const digitado = Number(rascunho.replace(",", "."));
    setRascunho(null);
    if (!Number.isFinite(digitado)) return;
    aoAplicar(digitado);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor={`disc-${atalho}`}
          className="flex items-center gap-1.5 text-sm font-medium"
        >
          {perfil}
          {predominante ? (
            <span
              aria-label="Perfil predominante"
              className={cn("size-2 rounded-full", tom.ponto)}
            />
          ) : null}
        </Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={PASSO}
            aria-label={`Percentual de ${perfil}`}
            value={rascunho ?? String(valor)}
            onChange={(event) => setRascunho(event.target.value)}
            onBlur={confirmar}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setRascunho(null);
              }
            }}
            className={cn(
              "h-8 w-16 px-2 text-right font-display text-sm font-semibold tabular-nums",
              predominante ? tom.texto : "text-slate-500",
            )}
          />
          <span aria-hidden className="text-xs text-slate-500">
            %
          </span>
        </div>
      </div>
      <Slider
        id={`disc-${atalho}`}
        aria-label={`Ajustar percentual de ${perfil}`}
        min={0}
        max={100}
        step={PASSO}
        value={[valor]}
        onValueChange={(proximo) => aoAplicar(proximo[0] ?? 0)}
        onDoubleClick={() => aoAplicar(0)}
        trackClassName="bg-panel-active"
        rangeClassName={tom.barra}
        thumbClassName={tom.thumb}
      />
    </div>
  );
}
