import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { LayoutAcesso } from "@/components/login/layout-acesso";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/definir-senha")({
  head: () => ({
    meta: [{ title: "Redefinir senha — Orcoma Orkomakers" }],
  }),
  component: DefinirSenhaPage,
});

const CAMPO =
  "w-full rounded-xl border border-panel-active bg-background px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 transition focus:border-brand focus:ring-2 focus:ring-brand/30";

// Regras de senha forte: mínimo de 8 caracteres, uma letra e um caractere especial.
const REGRAS_SENHA = [
  { rotulo: "Mínimo de 8 caracteres", valida: (s: string) => s.length >= 8 },
  { rotulo: "Pelo menos uma letra", valida: (s: string) => /[A-Za-z]/.test(s) },
  { rotulo: "Pelo menos um caractere especial (ex.: @ # ! %)", valida: (s: string) => /[^A-Za-z0-9]/.test(s) },
];

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
    if (!REGRAS_SENHA.every((regra) => regra.valida(senha))) {
      setMensagem("A senha ainda não atende a todas as regras.");
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
      setMensagem("Não foi possível redefinir a senha. Peça um novo link de acesso.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["usuario-logado"] });
    toast.success("Senha redefinida. Bem-vindo(a)!");
    navigate({ to: "/" });
  }

  return (
    <LayoutAcesso>
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
            <h1 className="font-display text-2xl font-semibold text-white">Redefina sua senha</h1>
            <p className="mt-2 text-sm text-white/80">Crie uma senha forte para acessar o painel.</p>

            <label htmlFor="senha-nova" className="mt-8 block text-sm font-medium text-white">
              Senha Nova
            </label>
            <div className="relative mt-2">
              <input
                id="senha-nova"
                type={mostrarSenha ? "text" : "password"}
                required
                autoComplete="new-password"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                placeholder="••••••••"
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

            <ul className="mt-3 grid gap-1.5 text-xs" aria-label="Regras da senha">
              {REGRAS_SENHA.map((regra) => {
                const ok = regra.valida(senha);
                return (
                  <li key={regra.rotulo} className={`flex items-center gap-2 ${ok ? "text-emerald-400" : "text-white/60"}`}>
                    <Check className={`size-3.5 ${ok ? "opacity-100" : "opacity-30"}`} aria-hidden />
                    {regra.rotulo}
                  </li>
                );
              })}
            </ul>

            <label htmlFor="senha-confirmar" className="mt-6 block text-sm font-medium text-white">
              Confirme a Senha Nova
            </label>
            <input
              id="senha-confirmar"
              type={mostrarSenha ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirmacao}
              onChange={(evento) => setConfirmacao(evento.target.value)}
              placeholder="••••••••"
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
              {salvando ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        )}
      </section>
    </LayoutAcesso>
  );
}
