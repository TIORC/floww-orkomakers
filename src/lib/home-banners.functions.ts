import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdmin } from "@/lib/emails.server";

const BUCKET = "banners-home";
const LIMITE_BYTES = 5 * 1024 * 1024;
const EXTENSAO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
// Mesma regra de src/hooks/use-usuario-logado.ts (podeGerenciarBanners): só o Desenvolvedor do Sistema.
const NIVEL_PERMITIDO = "desenvolvedor";

// Envia um banner da tela inicial: confere a permissão no servidor, salva a imagem e registra o banner no banco.
export const enviarBannerHome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tipo: z.enum(["image/jpeg", "image/png", "image/webp"]),
        base64: z
          .string()
          .min(1)
          .max(Math.ceil((LIMITE_BYTES * 4) / 3) + 4),
        alt: z.string().trim().max(300).default(""),
        largura: z.number().int().positive().max(10000),
        altura: z.number().int().positive().max(10000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string }).email ?? "";
    const admin = await getAdmin();

    const { data: pessoa, error: erroBusca } = await admin
      .from("colaboradores_importados")
      .select("nivel_acesso")
      .eq("email", email)
      .maybeSingle();
    if (erroBusca) throw new Error(erroBusca.message);
    const permitido =
      (pessoa as { nivel_acesso?: string } | null)?.nivel_acesso === NIVEL_PERMITIDO;
    if (!permitido) throw new Error("Você não tem permissão para carregar mídias na tela inicial.");

    const bytes = Buffer.from(data.base64, "base64");
    if (bytes.length === 0 || bytes.length > LIMITE_BYTES) {
      throw new Error("A imagem deve ter no máximo 5 MB.");
    }

    const caminho = `${crypto.randomUUID()}.${EXTENSAO[data.tipo]}`;
    const { error: erroUpload } = await admin.storage
      .from(BUCKET)
      .upload(caminho, bytes, { contentType: data.tipo, upsert: false });
    if (erroUpload)
      throw new Error(
        `Falha ao enviar a imagem para o armazenamento (bucket ${BUCKET}): ${erroUpload.message}`,
      );

    const { data: publica } = admin.storage.from(BUCKET).getPublicUrl(caminho);
    const banner = {
      src: publica.publicUrl,
      alt: data.alt,
      largura: data.largura,
      altura: data.altura,
      criado_por: email,
    };

    // A tipagem gerada do banco ainda não inclui home_banners.
    const db = admin as unknown as SupabaseClient;
    const { error: erroInsert } = await db.from("home_banners").insert(banner);
    if (erroInsert)
      throw new Error(`A imagem foi enviada, mas o banner não foi salvo: ${erroInsert.message}`);

    return { src: banner.src, alt: banner.alt, largura: banner.largura, altura: banner.altura };
  });
