import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ChangeEvent } from "react";
import { Camera, User } from "lucide-react";
import { toast } from "sonner";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { useUsuarioLogado } from "@/hooks/use-usuario-logado";
import { enviarFotoPerfil } from "@/lib/foto-perfil.functions";
import { atualizarCargoVisivel } from "@/lib/perfil.functions";
import { cn } from "@/lib/utils";

const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"] as const;
const LIMITE_FOTO_BYTES = 2 * 1024 * 1024;

// Lê o arquivo e devolve só o conteúdo em base64 (sem o prefixo data:).
function lerComoBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result).split(",")[1] ?? "");
    leitor.onerror = () => reject(new Error("Não foi possível ler a foto."));
    leitor.readAsDataURL(arquivo);
  });
}

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
  const { data: usuario, isPending } = useUsuarioLogado();
  const queryClient = useQueryClient();
  const [cargoVisivel, setCargoVisivel] = useState("");
  const [salvandoCargo, setSalvandoCargo] = useState(false);

  // Preenche o campo com o cargo visível salvo assim que o usuário carrega.
  useEffect(() => {
    if (usuario) setCargoVisivel(usuario.cargoVisivel);
  }, [usuario?.cargoVisivel]);

  // Cargo visível: a pessoa escolhe como quer aparecer para os outros. O cargo real é alterado só pelo RH.
  async function salvarCargoVisivel() {
    const novo = cargoVisivel.trim();
    if (!novo) {
      toast.error("Informe o cargo visível.");
      return;
    }
    setSalvandoCargo(true);
    try {
      await atualizarCargoVisivel({ data: { cargoVisivel: novo } });
      for (const chave of ["usuario-logado", "colaboradores-importados", "colaboradores-diretorio", "colaborador-detalhe", "organograma"]) {
        await queryClient.invalidateQueries({ queryKey: [chave] });
      }
      toast.success("Cargo visível atualizado.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar o cargo visível.");
    } finally {
      setSalvandoCargo(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSomenteLeitura rotulo="Nome" valor={isPending ? "" : usuario?.nome ?? ""} />
        <div className="grid gap-1.5">
          <label htmlFor="cargo-visivel" className="text-sm font-semibold text-white">
            Cargo visível
          </label>
          <div className="flex gap-2">
            <input
              id="cargo-visivel"
              value={cargoVisivel}
              onChange={(evento) => setCargoVisivel(evento.target.value)}
              disabled={isPending}
              placeholder="Como você quer ser visto pelos outros"
              className={cn(CAMPO, "min-w-0 flex-1")}
            />
            <button
              type="button"
              onClick={salvarCargoVisivel}
              disabled={salvandoCargo || isPending || cargoVisivel.trim() === (usuario?.cargoVisivel ?? "")}
              className="shrink-0 rounded-lg bg-brand px-4 text-sm font-semibold text-slate-900 transition hover:brightness-110 disabled:opacity-50"
            >
              {salvandoCargo ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
        <CampoSomenteLeitura rotulo="Setor" valor={isPending ? "" : usuario?.setor ?? ""} />
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
  const { data: usuario, isPending } = useUsuarioLogado();
  const queryClient = useQueryClient();
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  // Salva a foto no servidor e atualiza as telas que mostram a foto (perfil, organograma, diretório, ranking).
  async function trocarFoto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    const tipo = TIPOS_FOTO.find((item) => item === arquivo.type);
    if (!tipo) {
      toast.error("Use uma foto em JPG, PNG ou WebP.");
      return;
    }
    if (arquivo.size > LIMITE_FOTO_BYTES) {
      toast.error("A foto deve ter no máximo 2 MB.");
      return;
    }
    setEnviandoFoto(true);
    try {
      const base64 = await lerComoBase64(arquivo);
      await enviarFotoPerfil({ data: { tipo, base64 } });
      for (const chave of ["usuario-logado", "colaboradores-importados", "colaboradores-diretorio", "colaborador-detalhe", "organograma", "ranking-moedas"]) {
        await queryClient.invalidateQueries({ queryKey: [chave] });
      }
      toast.success("Foto atualizada.");
    } catch (erro) {
      console.error("Falha ao enviar a foto de perfil:", erro);
      // Erro fica na tela por mais tempo, para dar para ler a mensagem.
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar a foto.", { duration: 15000 });
    } finally {
      setEnviandoFoto(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
          <aside className="rounded-2xl border border-panel-active bg-panel p-6 text-center">
            <label className="group relative mx-auto block size-32 cursor-pointer rounded-full">
              <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-panel-active text-panel-text">
                {usuario?.fotoUrl ? (
                  <img src={usuario.fotoUrl} alt="" className="size-full object-cover" />
                ) : (
                  <User className="size-14" aria-hidden />
                )}
              </span>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                {enviandoFoto ? <span className="text-xs font-semibold">Enviando...</span> : <Camera className="size-6" aria-hidden />}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={trocarFoto}
                disabled={enviandoFoto || isPending}
                aria-label="Alterar foto de perfil"
                className="sr-only"
              />
            </label>
            <p className="mt-2 text-xs text-white/60">JPG, PNG ou WebP, até 2 MB</p>
            <p className="mt-4 font-display text-base font-bold text-white">{isPending ? "" : usuario?.nome ?? ""}</p>
            <p className="text-sm font-semibold text-brand">{isPending ? "" : usuario?.setor ?? ""}</p>
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
