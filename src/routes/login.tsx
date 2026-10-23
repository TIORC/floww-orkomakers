import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { emailPermitido, MENSAGEM_DOMINIO_EMAIL } from "@/lib/dominios-email";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Entrar — Orcoma Orkomakers" }],
  }),
  component: LoginPage,
});

const CAMPO =
  "w-full rounded-xl border border-panel-active bg-background px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 transition focus:border-brand focus:ring-2 focus:ring-brand/30";

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [criarConta, setCriarConta] = useState(false);

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCarregando(true);
    setMensagem(null);
    if (criarConta) {
      if (!emailPermitido(email)) {
        setCarregando(false);
        setMensagem(MENSAGEM_DOMINIO_EMAIL);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: window.location.origin },
      });
      setCarregando(false);
      if (error) {
        setMensagem(error.message.includes("registered") ? "Este e-mail já tem conta." : "Não foi possível criar a conta. Use uma senha com pelo menos 6 caracteres.");
        return;
      }
      if (!data.session) {
        setMensagem("Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.");
        setCriarConta(false);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["usuario-logado"] });
      navigate({ to: "/" });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setMensagem("E-mail ou senha inválidos.");
      return;
    }
    // Descarta o usuário em cache (buscado antes do login), para o perfil mostrar quem entrou.
    await queryClient.invalidateQueries({ queryKey: ["usuario-logado"] });
    navigate({ to: "/" });
  }

  async function esqueciSenha() {
    if (!email) {
      setMensagem("Informe seu e-mail para redefinir a senha.");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/definir-senha`,
    });
    setCarregando(false);
    setMensagem(error ? "Não foi possível enviar o e-mail de redefinição." : "Enviamos um link de redefinição para o seu e-mail.");
  }

  return (
    <main className="relative flex min-h-screen w-full justify-center overflow-hidden bg-background p-6">
      {/* Fundo animado: bolhas de luz suaves que flutuam devagar atrás do card. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-[30rem] rounded-full bg-amber-400/40 blur-3xl"
        animate={{ x: [0, 120, -60, 0], y: [0, 90, 30, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-0 size-[34rem] rounded-full bg-blue-500/45 blur-3xl"
        animate={{ x: [0, -120, 40, 0], y: [0, -70, 20, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/3 top-1/4 size-96 rounded-full bg-emerald-400/30 blur-3xl"
        animate={{ x: [0, 90, -70, 0], y: [0, -60, 50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Marca no espaço da direita: mascote flutuando e logo do grupo logo abaixo. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 flex-col items-center justify-center gap-2 lg:flex">
        <motion.img
          src="/images/mascote-leao.png"
          alt=""
          aria-hidden
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: [0, -12, 0] }}
          transition={{ opacity: { duration: 0.8 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 } }}
          className="w-96 object-contain drop-shadow-2xl"
          style={{ maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)" }}
        />
        <motion.img
          src="/images/logo-grupo-orcoma-branca.png"
          alt="Grupo Orcoma"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
          className="-mt-14 w-80 object-contain"
        />
      </div>
      <div className="relative z-10 flex min-h-screen w-full max-w-[1400px] items-center justify-start pl-10">
      <section className="w-full max-w-md rounded-2xl border border-panel-active bg-panel p-8 shadow-2xl sm:p-10">
        <div className="text-center">
          <img src="/images/logo-academy.png" alt="Orcoma Orkomakers Academy" className="mx-auto h-16 w-auto object-contain" />
        </div>

        <form onSubmit={entrar} className="mt-8">
          <h1 className="font-display text-2xl font-semibold text-white">{criarConta ? "Criar sua conta" : "Entrar na sua conta"}</h1>
          <p className="mt-2 text-sm text-white/80">Use suas credenciais corporativas para acessar o painel.</p>

          <label htmlFor="email" className="mt-8 block text-sm font-medium text-white">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            placeholder="nome@empresa.com.br"
            className={`${CAMPO} mt-2`}
          />

          <label htmlFor="senha" className="mt-6 block text-sm font-medium text-white">
            Senha
          </label>
          <div className="relative mt-2">
            <input
              id="senha"
              type={mostrarSenha ? "text" : "password"}
              required
              autoComplete={criarConta ? "new-password" : "current-password"}
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

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={esqueciSenha}
              className="text-sm font-medium text-brand transition hover:brightness-110"
            >
              Esqueci a minha senha
            </button>
          </div>

          {mensagem ? (
            <p className="mt-5 rounded-xl bg-brand/10 px-4 py-3 text-sm font-medium text-brand">{mensagem}</p>
          ) : null}

          <button
            type="submit"
            disabled={carregando}
            className="mt-7 w-full rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold tracking-wide text-slate-900 shadow transition hover:brightness-110 disabled:opacity-60"
          >
            {carregando ? "Aguarde..." : criarConta ? "Criar conta" : "Entrar"}
          </button>

          <button
            type="button"
            onClick={() => { setCriarConta((v) => !v); setMensagem(null); }}
            className="mt-5 w-full text-center text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            {criarConta ? "Já tenho conta — entrar" : "Não tem conta? Criar conta"}
          </button>

          <p className="mt-6 text-center text-xs text-white/60">Acesso restrito a colaboradores</p>
        </form>
      </section>
      </div>
    </main>
  );
}
