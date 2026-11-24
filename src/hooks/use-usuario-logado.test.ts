import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import {
  podeDesligarColaboradores,
  podeGerenciarColaboradores,
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

describe("desligar e desativar colaboradores", () => {
  const pessoa = (nome: string, nivel: string, acessoMaster = false): UsuarioLogado => ({
    ...com(nivel, acessoMaster),
    nome,
    nomeCompleto: nome,
  });

  it("só TI Maracas (conta master), Cléo e Yasmin podem", () => {
    expect(podeDesligarColaboradores(pessoa("TI Maracas", "desenvolvedor", true))).toBe(true);
    expect(podeDesligarColaboradores(pessoa("Cléo Barros", "administrador"))).toBe(true);
    expect(podeDesligarColaboradores(pessoa("Yasmin Pires", "administrador"))).toBe(true);
  });

  it("Celso e Jacson, mesmo sendo administradores, não podem", () => {
    expect(podeDesligarColaboradores(pessoa("Celso Alcantara", "administrador"))).toBe(false);
    expect(podeDesligarColaboradores(pessoa("Jacson Mascarenhas", "administrador"))).toBe(false);
  });

  it("cargo com a palavra Administrador não dá acesso", () => {
    const cargoAdmin = { ...pessoa("Fulano", "colaborador"), cargo: "Administrador", cargoVisivel: "Administrador" };
    expect(podeDesligarColaboradores(cargoAdmin)).toBe(false);
    expect(podeDesligarColaboradores(null)).toBe(false);
  });
});

describe("gerenciar colaboradores (desligar / desativar)", () => {
  it("Administrador e Desenvolvedor podem gerenciar, mesmo com cargo sem essas palavras", () => {
    expect(podeGerenciarColaboradores(com("administrador"))).toBe(true);
    expect(podeGerenciarColaboradores(com("desenvolvedor"))).toBe(true);
  });

  it("Gestor, Colaborador e Visitante não gerenciam", () => {
    for (const nivel of ["gestor", "colaborador", "convidado"]) {
      expect(podeGerenciarColaboradores(com(nivel))).toBe(false);
    }
    expect(podeGerenciarColaboradores(null)).toBe(false);
  });
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
