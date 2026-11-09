import { useQuery } from "@tanstack/react-query";

import { listarFeriadosCadastrados } from "@/lib/feriados-cadastro";

// Feriados cadastrados pelo RH. Chave única para que qualquer tela que use feriados fique atualizada.
export const CHAVE_FERIADOS_CADASTRADOS = ["feriados-cadastrados"];

export function useFeriadosCadastrados() {
  const consulta = useQuery({
    queryKey: CHAVE_FERIADOS_CADASTRADOS,
    queryFn: listarFeriadosCadastrados,
  });
  return { ...consulta, feriados: consulta.data ?? [] };
}
