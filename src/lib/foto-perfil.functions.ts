import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdmin } from "@/lib/emails.server";

const BUCKET = "fotos-colaboradores";
const LIMITE_BYTES = 2 * 1024 * 1024;
const EXTENSAO: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Salva a foto de perfil do próprio usuário e grava a URL em foto_url (usada em todo o sistema).
export const enviarFotoPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tipo: z.enum(["image/jpeg", "image/png", "image/webp"]),
        base64: z.string().min(1).max(Math.ceil((LIMITE_BYTES * 4) / 3) + 4),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const bytes = Buffer.from(data.base64, "base64");
    if (bytes.length === 0 || bytes.length > LIMITE_BYTES) {
      throw new Error("A foto deve ter no máximo 2 MB.");
    }

    const email = (context.claims as { email?: string }).email ?? "";
    const admin = await getAdmin();
    const { data: pessoa, error: erroBusca } = await admin
      .from("colaboradores_importados")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (erroBusca) throw new Error(erroBusca.message);
    const id = (pessoa as { id?: string } | null)?.id;
    if (!id) throw new Error("Colaborador não encontrado.");

    const caminho = `${id}.${EXTENSAO[data.tipo]}`;
    const { error: erroUpload } = await admin.storage
      .from(BUCKET)
      .upload(caminho, bytes, { contentType: data.tipo, upsert: true });
    if (erroUpload) throw new Error(`Falha ao enviar a foto para o armazenamento (bucket ${BUCKET}): ${erroUpload.message}`);

    // Parâmetro de versão evita que o navegador mostre a foto antiga em cache.
    const { data: publica } = admin.storage.from(BUCKET).getPublicUrl(caminho);
    const fotoUrl = `${publica.publicUrl}?v=${Date.now()}`;

    const { error: erroAtualiza } = await admin
      .from("colaboradores_importados")
      .update({ foto_url: fotoUrl })
      .eq("id", id);
    if (erroAtualiza) throw new Error(`A foto foi enviada, mas o link não foi salvo: ${erroAtualiza.message}`);

    return { fotoUrl };
  });
