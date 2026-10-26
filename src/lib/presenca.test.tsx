import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const gancho = vi.hoisted(() => {
  const estado: { sync?: () => void; presenca: Record<string, unknown[]> } = { presenca: {} };
  const canal = {
    on: vi.fn((_tipo: string, _filtro: unknown, aoSincronizar: () => void) => {
      estado.sync = aoSincronizar;
      return canal;
    }),
    subscribe: vi.fn((aoMudar: (status: string) => void) => {
      aoMudar("SUBSCRIBED");
      return canal;
    }),
    track: vi.fn(async () => "ok"),
    presenceState: vi.fn(() => estado.presenca),
  };
  const supabase = {
    channel: vi.fn(() => canal),
    removeChannel: vi.fn(async () => "ok"),
  };
  return { estado, canal, supabase };
});

vi.mock("@/integrations/supabase/client", () => ({ supabase: gancho.supabase }));
vi.mock("@/hooks/use-usuario-logado", () => ({ useUsuarioLogado: () => ({ data: null }) }));

import { entrarNaPresenca, sairDaPresenca, usePresenca } from "./presenca";

describe("presença", () => {
  beforeEach(() => {
    sairDaPresenca();
    vi.clearAllMocks();
    gancho.estado.presenca = {};
  });

  it("entra no canal com o e-mail em minúsculas como chave e avisa que está online", () => {
    entrarNaPresenca("  Ana@Orcoma.com.br ");
    expect(gancho.supabase.channel).toHaveBeenCalledWith("presenca-sistema", {
      config: { presence: { key: "ana@orcoma.com.br" } },
    });
    expect(gancho.canal.track).toHaveBeenCalledTimes(1);
  });

  it("não entra de novo com o mesmo e-mail", () => {
    entrarNaPresenca("ana@orcoma.com.br");
    entrarNaPresenca("ANA@orcoma.com.br");
    expect(gancho.supabase.channel).toHaveBeenCalledTimes(1);
  });

  it("a lista de online acompanha o estado de presença do canal", () => {
    const { result } = renderHook(() => usePresenca());
    entrarNaPresenca("ana@orcoma.com.br");
    expect(result.current.size).toBe(0);

    gancho.estado.presenca = { "ana@orcoma.com.br": [{}], "bia@orcoma.com.br": [{}] };
    act(() => gancho.estado.sync?.());
    expect([...result.current].sort()).toEqual(["ana@orcoma.com.br", "bia@orcoma.com.br"]);

    gancho.estado.presenca = { "bia@orcoma.com.br": [{}] };
    act(() => gancho.estado.sync?.());
    expect([...result.current]).toEqual(["bia@orcoma.com.br"]);
  });
});
