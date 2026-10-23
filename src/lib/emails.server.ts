// Envio de e-mails via Resend (somente servidor) + registro de cada tentativa em email_envios.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailValido(email: string | null | undefined): email is string {
  return !!email && EMAIL_VALIDO.test(email.trim());
}

export function escapar(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Visual das cores do sistema: azul-marinho, azul e amarelo.
export function layout(titulo: string, corpoHtml: string) {
  return `<div style="font-family:Arial,sans-serif;background:#eef2f7;padding:24px;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.08)">
    <div style="background:#0f172a;padding:24px 28px;border-bottom:4px solid #facc15">
      <p style="color:#facc15;font-weight:bold;font-size:18px;margin:0;letter-spacing:0.5px">Orcoma Orkomakers</p>
      <p style="color:#93c5fd;font-size:12px;margin:4px 0 0">Gestão de RH</p>
    </div>
    <div style="padding:28px">
      <h2 style="margin:0 0 16px;color:#1e3a8a;font-size:22px">${escapar(titulo)}</h2>
      <div style="font-size:15px;line-height:1.6">${corpoHtml}</div>
    </div>
    <div style="background:#1e3a8a;padding:14px 28px;color:#dbeafe;font-size:12px">
      Esta é uma mensagem automática do Orcoma Orkomakers. Não responda este e-mail.
    </div>
  </div></div>`;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function getAdmin() {
  return admin();
}

type Envio = { evento: string; referencia: string; destinatario: string | null | undefined; assunto: string; html: string };

// Retorna o status gravado: enviado | pulado | erro | duplicado.
export async function enviarERegistrar(envio: Envio) {
  const db = await admin();
  const log = (status: string, detalhe?: string) =>
    db.from("email_envios").insert({
      evento: envio.evento,
      referencia: envio.referencia,
      destinatario: envio.destinatario ?? null,
      assunto: envio.assunto,
      status,
      detalhe: detalhe ?? null,
    });

  if (!emailValido(envio.destinatario)) {
    await log("pulado", "destinatário ausente ou inválido");
    return "pulado";
  }

  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) {
    await log("erro", "Resend não configurado");
    return "erro";
  }

  try {
    const resp = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: process.env["EMAIL_FROM"] || "Orcoma Orkomakers <nao-responda@orcoma.com.br>",
        to: [envio.destinatario.trim()],
        subject: envio.assunto,
        html: envio.html,
      }),
    });
    const corpo = await resp.text();
    if (!resp.ok) {
      console.error(`Resend falhou [${resp.status}]: ${corpo}`);
      await log("erro", `[${resp.status}] ${corpo.slice(0, 500)}`);
      return "erro";
    }
    const { error } = await log("enviado", corpo.slice(0, 200));
    // Índice único impede segundo registro "enviado" de humor no mesmo dia.
    if (error?.code === "23505") return "duplicado";
    return "enviado";
  } catch (e) {
    await log("erro", e instanceof Error ? e.message : String(e));
    return "erro";
  }
}
