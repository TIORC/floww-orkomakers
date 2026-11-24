import { supabase } from "@/integrations/supabase/client";

// Competências avaliadas em cada feedback (nota de 0 a 5). `campo` é a coluna em public.feedbacks.
export const COMPETENCIAS_FEEDBACK = [
  { id: "proatividade-autonomia", campo: "nota_proatividade_autonomia", rotulo: "Proatividade e Autonomia" },
  { id: "confiabilidade-transparencia", campo: "nota_confiabilidade_transparencia", rotulo: "Confiabilidade e Transparência" },
  { id: "encantamento-cliente", campo: "nota_encantamento_cliente", rotulo: "Encantamento e Foco no Cliente" },
  { id: "responsabilidade-produtividade", campo: "nota_responsabilidade_produtividade", rotulo: "Responsabilidade e Produtividade" },
] as const;

// Média de todos os feedbacks recebidos pela pessoa (desde o início), em percentual sobre a escala 0–5.
// Feedbacks sem nota numa competência (antigos) ficam fora da média dela. Sem nenhuma nota, o valor é 0.
export async function buscarPercentuaisFeedbacks(email: string) {
  const campos = COMPETENCIAS_FEEDBACK.map((c) => c.campo).join(", ");
  const { data, error } = await supabase.from("feedbacks").select(campos).eq("destinatario_email", email);
  if (error) throw error;

  const linhas = (data ?? []) as unknown as Record<string, number | null>[];
  return COMPETENCIAS_FEEDBACK.map((competencia) => {
    const notas = linhas
      .map((linha) => linha[competencia.campo])
      .filter((nota): nota is number => typeof nota === "number");
    const media = notas.length ? notas.reduce((soma, nota) => soma + nota, 0) / notas.length : 0;
    return { id: competencia.id, rotulo: competencia.rotulo, valor: Math.round((media / 5) * 100) };
  });
}
