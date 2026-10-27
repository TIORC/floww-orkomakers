import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { separarLideres, type ColaboradorDoSetor } from "./colaboradores-diretorio";

const pessoa = (id: string, nivelAcesso = "colaborador", gestorEmail = ""): ColaboradorDoSetor => ({
  id,
  nome: id,
  email: `${id}@orcoma.com.br`,
  cargoVisivel: "",
  departamento: "TI",
  fotoUrl: "",
  nivelAcesso,
  gestorEmail,
  dataAdmissao: "",
  subliderArea: "",
});

describe("separarLideres", () => {
  it("o líder é quem tem nível Gestor, e a equipe é o resto", () => {
    const { lideres, equipe } = separarLideres([
      pessoa("ana"),
      pessoa("bia", "gestor"),
      pessoa("caio"),
    ]);
    expect(lideres.map((l) => l.id)).toEqual(["bia"]);
    expect(equipe.map((e) => e.id)).toEqual(["ana", "caio"]);
  });

  it("aceita mais de um líder no setor", () => {
    const { lideres } = separarLideres([
      pessoa("ana", "gestor"),
      pessoa("bia", "gestor"),
      pessoa("caio"),
    ]);
    expect(lideres.map((l) => l.id)).toEqual(["ana", "bia"]);
  });

  it("sem nível Gestor, usa o gestor direto mais comum que também está no setor", () => {
    const { lideres, equipe } = separarLideres([
      pessoa("chefe"),
      pessoa("ana", "colaborador", "CHEFE@orcoma.com.br"),
      pessoa("bia", "colaborador", "chefe@orcoma.com.br"),
      pessoa("caio", "colaborador", "outro@orcoma.com.br"),
    ]);
    expect(lideres.map((l) => l.id)).toEqual(["chefe"]);
    expect(equipe).toHaveLength(3);
  });

  it("sem nenhum critério, não destaca ninguém", () => {
    const { lideres, equipe } = separarLideres([pessoa("ana"), pessoa("bia")]);
    expect(lideres).toEqual([]);
    expect(equipe).toHaveLength(2);
  });
});
