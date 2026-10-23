import { useState, type ReactNode } from "react";

import { IconeAdministrador } from "@/components/painel/icone-administrador";
import { IconeColaborador } from "@/components/painel/icone-colaborador";
import { IconeDesenvolvedor } from "@/components/painel/icone-desenvolvedor";
import { IconeGestor } from "@/components/painel/icone-gestor";
import { IconeOuvidor } from "@/components/painel/icone-ouvidor";
import { IconeVisitante } from "@/components/painel/icone-visitante";
import { NIVEIS_ACESSO, type NivelAcesso } from "@/lib/colaborador-detalhe";
import { cn } from "@/lib/utils";

function IconePapel({ valor, ativo }: { valor: NivelAcesso; ativo: boolean }) {
  if (valor === "desenvolvedor") {
    return <IconeDesenvolvedor className="h-[108px] w-[108px]" ativo={ativo} />;
  }
  if (valor === "administrador") {
    return <IconeAdministrador className="h-[108px] w-auto" ativo={ativo} />;
  }
  if (valor === "gestor") {
    return <IconeGestor className="h-[108px] w-auto" ativo={ativo} />;
  }
  if (valor === "colaborador") {
    return <IconeColaborador className="h-[108px] w-auto" ativo={ativo} />;
  }
  return <IconeVisitante className="h-[108px] w-auto" ativo={ativo} />;
}

// Um card de papel: checkbox, ícone animado no hover, nome e descrição.
function CartaoPapel({
  rotulo,
  descricao,
  checked,
  disabled,
  corRotulo = "text-white",
  onChange,
  onMouseEnter,
  onMouseLeave,
  icone,
  rodape,
}: {
  rotulo: string;
  descricao: string;
  checked: boolean;
  disabled: boolean;
  corRotulo?: string;
  onChange: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  icone: ReactNode;
  rodape?: string | undefined;
}) {
  return (
    <label
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="flex cursor-pointer items-center gap-4 rounded-xl px-4 py-4 transition hover:bg-panel-active has-[:disabled]:cursor-not-allowed"
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="size-5 shrink-0 accent-brand"
      />
      <span className="grid gap-1.5">
        <span className={cn("flex items-center gap-3 text-2xl font-bold", corRotulo)}>
          {icone}
          {rotulo}
        </span>
        <span className="text-sm leading-relaxed text-white/80">{descricao}</span>
        {rodape && <span className="text-xs text-panel-label">{rodape}</span>}
      </span>
    </label>
  );
}

// Coluna de papéis usada nos modais de detalhes e de cadastro, para ficarem padronizados.
// Os níveis são escolha única. O Ouvidor é uma permissão à parte: só uma pessoa por vez, e só
// a Ouvidora atual consegue transferi-lo, para um Administrador.
export function SeletorPapeis({
  nivelAtual,
  desabilitado = false,
  ocultarBloqueados = false,
  onAlterar,
  ouvidor = false,
  podeTransferirOuvidor = false,
  onTransferirOuvidor,
  className,
  mostrarNiveis = true,
  mostrarOuvidor = true,
}: {
  nivelAtual: NivelAcesso;
  desabilitado?: boolean;
  ocultarBloqueados?: boolean;
  onAlterar: (nivel: NivelAcesso) => void;
  ouvidor?: boolean;
  podeTransferirOuvidor?: boolean;
  onTransferirOuvidor?: () => void;
  className?: string;
  mostrarNiveis?: boolean;
  mostrarOuvidor?: boolean;
}) {
  const [cartaoEmHover, setCartaoEmHover] = useState<string | null>(null);
  const opcoes = ocultarBloqueados ? NIVEIS_ACESSO.filter((nivel) => !nivel.bloqueado) : NIVEIS_ACESSO;
  const ouvidorBloqueado = ouvidor || !podeTransferirOuvidor || nivelAtual !== "administrador";

  return (
    <fieldset
      className={cn(
        "grid content-start gap-3 border-t border-panel-active pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0",
        className,
      )}
      disabled={desabilitado}
    >
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-panel-label">
        Papéis
      </legend>
      {mostrarNiveis &&
        opcoes.map(({ valor, rotulo, descricao, bloqueado }) => (
          <CartaoPapel
            key={valor}
            rotulo={rotulo}
            descricao={descricao}
            checked={nivelAtual === valor}
            disabled={bloqueado}
            corRotulo={valor === "desenvolvedor" ? "text-red-500" : "text-white"}
            onChange={() => onAlterar(valor)}
            onMouseEnter={() => setCartaoEmHover(valor)}
            onMouseLeave={() => setCartaoEmHover(null)}
            icone={<IconePapel valor={valor} ativo={cartaoEmHover === valor} />}
          />
        ))}

      {mostrarOuvidor && (
      <div className={cn("mt-3", mostrarNiveis && "border-t border-panel-active pt-3")}>
        <CartaoPapel
          rotulo="Ouvidor"
          descricao="Recebe as denúncias e propõe planos de ação para sanar casos"
          checked={ouvidor}
          disabled={ouvidorBloqueado}
          onChange={() => {
            onTransferirOuvidor?.();
          }}
          onMouseEnter={() => setCartaoEmHover("ouvidor")}
          onMouseLeave={() => setCartaoEmHover(null)}
          icone={<IconeOuvidor className="h-[108px] w-auto" ativo={cartaoEmHover === "ouvidor"} />}
          rodape={
            nivelAtual !== "administrador"
              ? "Disponível apenas para Administradores."
              : ouvidor
                ? "Cargo atual. A Ouvidora transfere marcando outro Administrador."
                : undefined
          }
        />
      </div>
      )}
    </fieldset>
  );
}
