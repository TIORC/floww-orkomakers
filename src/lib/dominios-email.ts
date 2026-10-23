// Domínios aceitos para cadastro de colaboradores. Mantenha em sincronia com a migração
// supabase/migrations/20261022000002_dominios_email_cadastro.sql.
export const DOMINIOS_EMAIL_PERMITIDOS = ["gmail.com", "orcoma.com.br"];

export const MENSAGEM_DOMINIO_EMAIL = "Use um e-mail @gmail.com ou @orcoma.com.br.";

export function emailPermitido(email: string) {
  const dominio = email.trim().toLowerCase().split("@")[1] ?? "";
  return DOMINIOS_EMAIL_PERMITIDOS.includes(dominio);
}
