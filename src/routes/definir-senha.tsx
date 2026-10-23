import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/definir-senha")({
  head: () => ({
    meta: [{ title: "Criar senha — Orcoma Orkomakers" }],
  }),
  component: DefinirSenhaPage,
});

const CAMPO =
  "w-full rounded-xl border border-panel-active bg-background px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 transition focus:border-brand focus:ring-2 focus:ring-brand/30";

// Tela aberta pelo link do e-mail de convite ou de primeiro acesso. A sessão vem do próprio link.
function DefinirSenhaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [situacao, setSituacao] = useState<"carregando" | "pronto" | "invalido">("carregando");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  // O Supabase lê o link ao abrir a página e cria a sessão. Se nada chegar, o link é inválido ou expirou.
  useEffect(() => {
    const { data: assinatura } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (sessao) setSituacao("pronto");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSituacao("pronto");
    });
    const prazo = setTimeout(() => {
      setSituacao((atual) => (atual === "carregando" ? "invalido" : atual));
    }, 5000);
    return () => {
      assinatura.subscription.unsubscribe();
      clearTimeout(prazo);
    };
  }, []);

  async function salvarSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem(null);
    if (senha.length < 6) {
      setMensagem("Use uma senha com pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setMensagem("As senhas não coincidem.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      setMensagem("Não foi possível salvar a senha. Peça um novo link de acesso.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["usuario-logado"] });
    toast.success("Senha criada. Bem-vindo(a)!");
    navigate({ to: "/" });
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <section className="w-full max-w-md rounded-2xl border border-panel-active bg-panel p-8 shadow-2xl sm:p-10">
        <div className="text-center">
          <img src="/images/logo-academy.png" alt="Orcoma Orkomakers Academy" className="mx-auto h-16 w-auto object-contain" />
        </div>

        {situacao === "carregando" && (
          <p className="mt-8 text-center text-sm text-white/80">Validando seu link...</p>
        )}

        {situacao === "invalido" && (
          <div className="mt-8 text-center">
            <h1 className="font-display text-2xl font-semibold text-white">Link inválido ou expirado</h1>
            <p className="mt-2 text-sm text-white/80">
              Peça ao RH um novo e-mail de primeiro acesso ou use &quot;Esqueci a minha senha&quot; na tela de login.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/login" })}
              className="mt-7 w-full rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold tracking-wide text-slate-900 shadow transition hover:brightness-110"
            >
              Ir para o login
            </button>
          </div>
        )}

        {situacao === "pronto" && (
          <form onSubmit={salvarSenha} className="mt-8">
            <h1 className="font-display text-2xl font-semibold text-white">Crie sua senha</h1>
            <p className="mt-2 text-sm text-white/80">Escolha uma senha para acessar o painel.</p>

            <label htmlFor="nova-senha" className="mt-8 block text-sm font-medium text-white">
              Nova senha
            </label>
            <div className="relative mt-2">
              <input
                id="nova-senha"
                type={mostrarSenha ? "text" : "password"}
                required
                autoComplete="new-password"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className={`${CAMPO} pr-12`}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((atual) => !atual)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={mostrarSenha}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/70 transition hover:text-brand"
              >
                {mostrarSenha ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            </div>

            <label htmlFor="confirmar-senha" className="mt-6 block text-sm font-medium text-white">
              Confirmar senha
            </label>
            <input
              id="confirmar-senha"
              type={mostrarSenha ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirmacao}
              onChange={(evento) => setConfirmacao(evento.target.value)}
              placeholder="Repita a senha"
              className={`${CAMPO} mt-2`}
            />

            {mensagem ? (
              <p className="mt-5 rounded-xl bg-brand/10 px-4 py-3 text-sm font-medium text-brand">{mensagem}</p>
            ) : null}

            <button
              type="submit"
              disabled={salvando}
              className="mt-7 w-full rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold tracking-wide text-slate-900 shadow transition hover:brightness-110 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar senha e entrar"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
