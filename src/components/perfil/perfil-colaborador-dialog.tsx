import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buscarColaborador } from "@/lib/colaborador-detalhe";
import { getIniciais } from "@/lib/iniciais";

type Props = {
  // E-mail da pessoa cujo perfil está aberto. Null quando o perfil está fechado.
  email: string | null;
  onFechar: () => void;
};

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-white/60">{rotulo}</p>
      <p className="break-words text-sm text-white">{valor.trim() || "Não cadastrado"}</p>
    </div>
  );
}

function Cartao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-panel-active bg-panel p-4 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-white sm:text-xl 2xl:text-2xl">{titulo}</h3>
      <div className="mt-4 border-t border-panel-active pt-4">{children}</div>
    </section>
  );
}

// Perfil de um colaborador em modal: foto, informações de contato e setor à esquerda; biografia, habilidades e
// educação à direita. Só leitura.
export function PerfilColaboradorDialog({ email, onFechar }: Props) {
  const consulta = useQuery({
    queryKey: ["perfil-colaborador", email],
    queryFn: () => buscarColaborador({ email: email ?? "" }),
    enabled: Boolean(email),
  });
  const registro = consulta.data;
  const campo = (coluna: string) => registro?.[coluna] ?? "";
  const nome = campo("nome_completo") || campo("nome");
  const cargo = campo("cargo_visivel") || campo("cargo");
  const fotoUrl = campo("foto_url");

  return (
    <Dialog open={Boolean(email)} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto border-panel-active bg-background p-4 sm:p-6 sm:min-h-[80dvh] sm:max-w-[min(95vw,1800px)] 2xl:min-h-[85dvh]">
        <DialogHeader>
          <DialogTitle className="sr-only">{nome || "Perfil do colaborador"}</DialogTitle>
          <DialogDescription className="sr-only">Perfil do colaborador</DialogDescription>
        </DialogHeader>

        {consulta.isPending ? (
          <p className="text-sm text-white/70">Carregando…</p>
        ) : consulta.isError || !registro ? (
          <p className="text-sm text-red-400">Não consegui carregar o perfil.</p>
        ) : (
          <div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-[minmax(16rem,1fr)_minmax(0,2fr)]">
            <aside className="min-w-0 rounded-2xl border border-panel-active bg-panel p-4 text-center sm:p-6">
              <span className="mx-auto flex size-32 items-center justify-center overflow-hidden rounded-full bg-panel-active text-3xl font-bold text-panel-text">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="" className="size-full object-cover" />
                ) : (
                  getIniciais(nome) || "—"
                )}
              </span>
              <p className="mt-4 font-display text-xl font-semibold text-white">{nome}</p>
              <p className="text-sm text-white/70">{cargo || "—"}</p>

              <div className="mt-6 grid gap-4 border-t border-panel-active pt-6 text-left">
                <h4 className="text-center font-display text-lg font-semibold text-white">Informações</h4>
                <Linha rotulo="Departamento" valor={campo("departamento")} />
                <Linha rotulo="Gestor direto" valor={campo("gestor_direto")} />
                <Linha rotulo="E-mail" valor={campo("email")} />
                {/* O cadastro ainda não guarda WhatsApp: a linha aparece como "Não cadastrado". */}
                <Linha rotulo="WhatsApp" valor="" />
              </div>
            </aside>

            <div className="grid min-w-0 content-start gap-4 sm:gap-6">
              <Cartao titulo="Biografia">
                {campo("biografia").trim() ? (
                  <p className="whitespace-pre-line break-words text-sm leading-relaxed text-white/85 2xl:text-base">{campo("biografia")}</p>
                ) : (
                  <p className="text-sm text-white/70">Nenhuma biografia cadastrada.</p>
                )}
              </Cartao>
              <Cartao titulo="Habilidades">
                <p className="text-sm text-white/70">Nenhuma habilidade cadastrada ainda.</p>
              </Cartao>
              <Cartao titulo="Educação">
                <p className="text-sm text-white/70">Nenhuma formação cadastrada ainda.</p>
              </Cartao>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
