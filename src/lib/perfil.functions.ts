import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdmin } from "@/lib/emails.server";

// Cada pessoa escolhe o cargo visível do próprio perfil. O cargo real (campo cargo) continua só com o RH.
export const atualizarCargoVisivel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ cargoVisivel: z.string().trim().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string }).email ?? "";
    const admin = await getAdmin();
    const { data: linhas, error } = await admin
      .from("colaboradores_importados")
      .update({ cargo_visivel: data.cargoVisivel })
      .eq("email", email)
      .select("id");
    if (error) throw new Error(error.message);
    // Sem nenhuma linha atualizada, o cargo não foi gravado: avisa em vez de dizer que salvou.
    if (!linhas || linhas.length === 0) throw new Error("Colaborador não encontrado para salvar o cargo.");
    return { cargoVisivel: data.cargoVisivel };
  });
