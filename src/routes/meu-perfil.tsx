import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/meu-perfil")({
  head: () => ({
    meta: [{ title: "Meu Perfil — Orcoma Orkomakers" }],
  }),
  component: MeuPerfilPage,
});

const ABAS = ["Perfil", "Informações", "Educação", "Notificações", "Senha e Segurança"] as const;
type Aba = (typeof ABAS)[number];

const IDIOMAS = ["Português - Brasil", "English", "Español"] as const;

const CAMPO =
  "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand";

function CampoSomenteLeitura({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-semibold text-white">{rotulo}</label>
      <input value={valor} readOnly disabled className={cn(CAMPO, "opacity-70")} />
    </div>
  );
}

function AbaPerfil() {
  const [idioma, setIdioma] = useState<(typeof IDIOMAS)[number]>(IDIOMAS[0]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSomenteLeitura rotulo="Nome" valor="Seu Nome" />
        <CampoSomenteLeitura rotulo="Cargo visível" valor="Seu Cargo" />
        <CampoSomenteLeitura rotulo="Setor" valor="Seu Setor" />
        <div className="grid gap-1.5">
          <label htmlFor="idioma" className="text-sm font-semibold text-white">
            Idioma
          </label>
          <select
            id="idioma"
            value={idioma}
            onChange={(event) => setIdioma(event.target.value as (typeof IDIOMAS)[number])}
            className={CAMPO}
          >
            {IDIOMAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr className="border-panel-active" />

      <section aria-labelledby="contatos-titulo" className="grid gap-3">
        <h3 id="contatos-titulo" className="font-display text-xl font-semibold text-white">
          Contatos
        </h3>
        <p className="text-sm text-white/80">Nenhum contato cadastrado.</p>
      </section>
    </div>
  );
}

function AbaEmBreve() {
  return <p className="py-8 text-center text-sm text-white/80">Esta seção ainda não está disponível.</p>;
}

function MeuPerfilPage() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>("Perfil");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
          <aside className="rounded-2xl border border-panel-active bg-panel p-6 text-center">
            <span className="mx-auto flex size-32 items-center justify-center rounded-full bg-panel-active text-panel-text">
              <User className="size-14" aria-hidden />
            </span>
            <p className="mt-4 font-display text-base font-bold text-white">Seu Nome</p>
            <p className="text-sm font-semibold text-brand">Seu Setor</p>
          </aside>

          <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
            <nav aria-label="Seções do perfil" className="flex flex-wrap gap-1 border-b border-panel-active">
              {ABAS.map((aba) => (
                <button
                  key={aba}
                  type="button"
                  onClick={() => setAbaAtiva(aba)}
                  aria-current={abaAtiva === aba ? "page" : undefined}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    abaAtiva === aba ? "border-brand text-brand" : "border-transparent text-white/80 hover:text-white",
                  )}
                >
                  {aba}
                </button>
              ))}
            </nav>

            <div className="mt-6">{abaAtiva === "Perfil" ? <AbaPerfil /> : <AbaEmBreve />}</div>
          </section>
        </div>
      </main>
    </div>
  );
}
