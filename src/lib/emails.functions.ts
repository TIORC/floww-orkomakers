import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { emailPermitido } from "@/lib/dominios-email";
import { emailValido, enviarERegistrar, escapar, getAdmin, layout } from "./emails.server";

const ROTULO_EMOCAO: Record<string, string> = { triste: "Triste", muito_triste: "Muito triste" };

// Cria o feedback e avisa o destinatário por e-mail.
export const criarFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ destinatarioEmail: z.string().trim().max(255), mensagem: z.string().trim().min(1).max(5000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const autorEmail = (context.claims as { email?: string }).email ?? "";
    const { data: fb, error } = await context.supabase
      .from("feedbacks")
      .insert({ autor_id: context.userId, autor_email: autorEmail, destinatario_email: data.destinatarioEmail, mensagem: data.mensagem })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const status = await enviarERegistrar({
      evento: "feedback_criado",
      referencia: fb.id,
      destinatario: data.destinatarioEmail,
      assunto: "Você recebeu um novo feedback",
      html: layout("Você recebeu um novo feedback", `<p>${escapar(autorEmail)} enviou:</p><blockquote style="border-left:3px solid #facc15;padding-left:12px">${escapar(data.mensagem).replace(/\n/g, "<br>")}</blockquote>`),
    });
    return { id: fb.id, email: status };
  });

// Publica o comunicado e envia a cada pessoa do público definido.
export const publicarComunicado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        titulo: z.string().trim().min(1).max(200),
        mensagem: z.string().trim().min(1).max(10000),
        publicoTipo: z.enum(["todos", "departamento", "unidade"]),
        publicoValores: z.array(z.string().trim().max(200)).max(100),
        destaque: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: com, error } = await context.supabase
      .from("comunicados")
      .insert({
        autor_id: context.userId,
        titulo: data.titulo,
        mensagem: data.mensagem,
        publico_tipo: data.publicoTipo,
        publico_valores: data.publicoValores,
        destaque: data.destaque,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const admin = await getAdmin();
    let consulta = admin.from("colaboradores_importados").select("email");
    if (data.publicoTipo !== "todos") consulta = consulta.in(data.publicoTipo, data.publicoValores);
    const { data: pessoas } = await consulta;
    const emails = [...new Set((pessoas ?? []).map((p: { email: string | null }) => (p.email ?? "").trim().toLowerCase()))];

    const html = layout(data.titulo, `<p>${escapar(data.mensagem).replace(/\n/g, "<br>")}</p>`);
    const resultado = { enviados: 0, pulados: 0, erros: 0 };
    for (const email of emails) {
      const s = await enviarERegistrar({ evento: "comunicado_publicado", referencia: com.id, destinatario: email, assunto: `Comunicado: ${data.titulo}`, html });
      if (s === "enviado") resultado.enviados++;
      else if (s === "pulado") resultado.pulados++;
      else resultado.erros++;
    }
    return { id: com.id, ...resultado };
  });

export type StatusConvite = "enviado" | "pulado" | "erro" | "duplicado" | "ja_tem_conta" | "invalido";

// E-mail com o botão que leva a pessoa a criar a senha (usado no convite e nas instruções de primeiro acesso).
function emailCriarSenha(nome: string, link: string) {
  return layout(
    `Boas-vindas, ${nome}!`,
    `<p>Que bom ter você com a gente. Seu cadastro no Orcoma Orkomakers está pronto.</p>
     <p>Use o botão abaixo para criar sua senha e entrar no sistema:</p>
     <p><a href="${link}" style="display:inline-block;background:#facc15;color:#0f172a;padding:12px 20px;border-radius:8px;font-weight:bold;text-decoration:none">Criar minha senha</a></p>
     <p style="color:#64748b;font-size:12px">Se o botão não funcionar, copie este endereço no navegador: ${escapar(link)}</p>`,
  );
}

// Só administradores (ou o Desenvolvedor do Sistema) enviam acessos.
async function podeGerenciarAcessos(emailQuem: string) {
  const admin = await getAdmin();
  const { data: quem } = await admin
    .from("colaboradores_importados")
    .select("acesso_master, nivel_acesso")
    .eq("email", emailQuem)
    .maybeSingle();
  const perfil = quem as { acesso_master?: boolean; nivel_acesso?: string } | null;
  return Boolean(perfil?.acesso_master) || perfil?.nivel_acesso === "desenvolvedor" || perfil?.nivel_acesso === "administrador";
}

// Cria a conta do colaborador recém-cadastrado e envia o convite por e-mail (Resend) com o link para criar a senha.
// Só administradores podem convidar. O link leva à tela de login do próprio app.
export const criarAcessoColaborador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ email: z.string().trim().max(255), origem: z.string().trim().url().max(500) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ status: StatusConvite }> => {
    const email = data.email.toLowerCase();
    if (!emailValido(email) || !emailPermitido(email)) return { status: "invalido" };

    if (!(await podeGerenciarAcessos((context.claims as { email?: string }).email ?? ""))) {
      throw new Error("Só administradores podem criar acessos.");
    }

    const admin = await getAdmin();
    const { data: pessoa } = await admin.from("colaboradores_importados").select("nome").eq("email", email).maybeSingle();
    const nome = (pessoa as { nome?: string } | null)?.nome ?? "";

    // Em produção, a URL vem de APP_URL; sem ela, usa a origem de quem fez o cadastro.
    const base = process.env["APP_URL"] || data.origem;
    const { data: convite, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo: `${base}/login` },
    });
    if (error || !convite?.properties?.action_link) {
      const jaTemConta = /already|registered|exists/i.test(error?.message ?? "");
      return { status: jaTemConta ? "ja_tem_conta" : "erro" };
    }

    const status = await enviarERegistrar({
      evento: "convite_acesso",
      referencia: email,
      destinatario: email,
      assunto: "Seu acesso ao Orcoma Orkomakers",
      html: emailCriarSenha(nome, convite.properties.action_link),
    });
    return { status };
  });

// Reenvia as instruções de primeiro acesso para quem já está cadastrado. Quem ainda não tem conta recebe o convite.
export const enviarPrimeiroAcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ email: z.string().trim().max(255), origem: z.string().trim().url().max(500) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ status: StatusConvite }> => {
    const email = data.email.toLowerCase();
    if (!emailValido(email) || !emailPermitido(email)) return { status: "invalido" };
    if (!(await podeGerenciarAcessos((context.claims as { email?: string }).email ?? ""))) {
      throw new Error("Só administradores podem enviar instruções de acesso.");
    }

    const admin = await getAdmin();
    const { data: pessoa } = await admin.from("colaboradores_importados").select("nome").eq("email", email).maybeSingle();
    const nome = (pessoa as { nome?: string } | null)?.nome ?? "";
    const base = process.env["APP_URL"] || data.origem;
    const redirectTo = `${base}/login`;

    // Conta existente: link de redefinição de senha. Sem conta: convite.
    let { data: link, error } = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } });
    if (error && /not found/i.test(error.message)) {
      ({ data: link, error } = await admin.auth.admin.generateLink({ type: "invite", email, options: { redirectTo } }));
    }
    if (error || !link?.properties?.action_link) return { status: "erro" };

    const status = await enviarERegistrar({
      evento: "primeiro_acesso",
      referencia: `${email}:${Date.now()}`,
      destinatario: email,
      assunto: "Instruções de primeiro acesso ao Orcoma Orkomakers",
      html: emailCriarSenha(nome, link.properties.action_link),
    });
    return { status };
  });

// Após o check-in: se o humor de hoje for triste/muito triste, avisa o gestor (1 por pessoa por dia).
export const notificarHumorBaixo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string }).email;
    if (!email) return { email: "pulado" };
    const admin = await getAdmin();
    const { data: checkins } = await admin
      .from("checkin_sentimento")
      .select("emocao, data")
      .eq("colaborador_email", email)
      .order("data", { ascending: false })
      .limit(1);
    const checkin = checkins?.[0] as { emocao: string; data: string } | undefined;
    if (!checkin || !ROTULO_EMOCAO[checkin.emocao]) return { email: "nao_aplicavel" };

    const referencia = `${email.toLowerCase()}:${checkin.data}`;
    const { data: jaEnviado } = await admin
      .from("email_envios")
      .select("id")
      .eq("evento", "humor_baixo")
      .eq("referencia", referencia)
      .eq("status", "enviado")
      .limit(1);
    if (jaEnviado && jaEnviado.length > 0) return { email: "duplicado" };

    const { data: pessoa } = await admin
      .from("colaboradores_importados")
      .select("nome, gestor_direto_email")
      .eq("email", email)
      .maybeSingle();
    const p = pessoa as { nome?: string; gestor_direto_email?: string } | null;
    const nome = p?.nome || email;
    const emocao = ROTULO_EMOCAO[checkin.emocao];
    const status = await enviarERegistrar({
      evento: "humor_baixo",
      referencia,
      destinatario: p?.gestor_direto_email,
      assunto: `${nome} registrou humor "${emocao}" hoje`,
      html: layout("Atenção ao humor da sua equipe", `<p><strong>${escapar(nome)}</strong> registrou o humor <strong>${emocao}</strong> em ${checkin.data.split("-").reverse().join("/")}.</p><p>Que tal conversar com essa pessoa?</p>`),
    });
    return { email: status };
  });
