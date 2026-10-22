import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enviarERegistrar, escapar, getAdmin, layout } from "./emails.server";

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

// Boas-vindas ao colaborador recém-cadastrado (dados lidos do banco, não do navegador).
export const enviarBoasVindas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().trim().max(255) }).parse(d))
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const { data: pessoa } = await admin
      .from("colaboradores_importados")
      .select("nome, email")
      .eq("email", data.email)
      .maybeSingle();
    const nome = (pessoa as { nome?: string } | null)?.nome ?? "";
    const status = await enviarERegistrar({
      evento: "boas_vindas",
      referencia: data.email,
      destinatario: (pessoa as { email?: string } | null)?.email,
      assunto: "Boas-vindas à Orcoma!",
      html: layout(`Boas-vindas, ${nome}!`, `<p>Que bom ter você com a gente. Seu cadastro no Orcoma Orkomakers está pronto.</p>`),
    });
    return { email: status };
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
