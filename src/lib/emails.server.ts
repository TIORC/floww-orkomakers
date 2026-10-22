// Envio de e-mails via Resend (somente servidor) + registro de cada tentativa em email_envios.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailValido(email: string | null | undefined): email is string {
  return !!email && EMAIL_VALIDO.test(email.trim());
}

export function escapar(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function layout(titulo: string, corpoHtml: string) {
  return `<div style="font-family:Arial,sans-serif;background:#ffffff;padding:24px;color:#0f172a">
  <div style="max-width:560px;margin:0 auto">
    <p style="color:#1e3a8a;font-weight:bold;margin:0 0 16px">Orcoma Orkomakers</p>
    <h2 style="margin:0 0 16px">${escapar(titulo)}</h2>
    ${corpoHtml}
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
        from: process.env["EMAIL_FROM"] || "Orcoma Orkomakers <onboarding@resend.dev>",
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
