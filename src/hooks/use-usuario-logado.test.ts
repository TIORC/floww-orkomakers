import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import {
  podeVerProgramacaoFerias,
  podeVerTodosOsSetores,
  type UsuarioLogado,
} from "./use-usuario-logado";

const com = (nivelAcesso: string, acessoMaster = false): UsuarioLogado => ({
  email: "a@b.c",
  nome: "A",
  nomeCompleto: "A",
  setor: "TI",
  fotoUrl: null,
  acessoMaster,
  nivelAcesso,
  ouvidor: false,
  cargo: "",
  cargoVisivel: "",
  gestorDiretoEmail: "",
});

describe("acesso à Programação de Férias", () => {
  it("Desenvolvedor e Administrador veem todos os setores", () => {
    expect(podeVerTodosOsSetores(com("desenvolvedor"))).toBe(true);
    expect(podeVerTodosOsSetores(com("administrador"))).toBe(true);
  });

  it("Gestor e Colaborador veem a página, mas só o próprio setor", () => {
    for (const nivel of ["gestor", "colaborador"]) {
      expect(podeVerProgramacaoFerias(com(nivel))).toBe(true);
      expect(podeVerTodosOsSetores(com(nivel))).toBe(false);
    }
  });

  it("Visitante não tem acesso", () => {
    expect(podeVerProgramacaoFerias(com("convidado"))).toBe(false);
    expect(podeVerTodosOsSetores(com("convidado"))).toBe(false);
    expect(podeVerProgramacaoFerias(null)).toBe(false);
  });
});
