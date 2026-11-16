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

// A troca de canal espera numa fila de promessas; uma volta do laço de eventos basta para ela terminar.
const esperar = () => new Promise((resolver) => setTimeout(resolver, 0));

describe("presença", () => {
  beforeEach(async () => {
    sairDaPresenca();
    await esperar();
    vi.clearAllMocks();
    gancho.estado.presenca = {};
  });

  it("entra no canal com o e-mail em minúsculas como chave e avisa que está online", async () => {
    entrarNaPresenca("  Ana@Orcoma.com.br ");
    await esperar();
    expect(gancho.supabase.channel).toHaveBeenCalledWith("presenca-sistema", {
      config: { presence: { key: "ana@orcoma.com.br" } },
    });
    expect(gancho.canal.track).toHaveBeenCalledTimes(1);
  });

  it("não entra de novo com o mesmo e-mail", async () => {
    entrarNaPresenca("ana@orcoma.com.br");
    entrarNaPresenca("ANA@orcoma.com.br");
    await esperar();
    expect(gancho.supabase.channel).toHaveBeenCalledTimes(1);
  });

  it("troca de e-mail fecha o canal antigo antes de abrir o novo", async () => {
    entrarNaPresenca("ana@orcoma.com.br");
    await esperar();
    entrarNaPresenca("bia@orcoma.com.br");
    await esperar();
    expect(gancho.supabase.removeChannel).toHaveBeenCalledTimes(1);
    expect(gancho.supabase.channel).toHaveBeenCalledTimes(2);
    expect(gancho.supabase.channel).toHaveBeenLastCalledWith("presenca-sistema", {
      config: { presence: { key: "bia@orcoma.com.br" } },
    });
  });

  it("a lista de online acompanha o estado de presença do canal", async () => {
    const { result } = renderHook(() => usePresenca());
    entrarNaPresenca("ana@orcoma.com.br");
    await esperar();
    expect(result.current.size).toBe(0);

    gancho.estado.presenca = { "ana@orcoma.com.br": [{}], "bia@orcoma.com.br": [{}] };
    act(() => gancho.estado.sync?.());
    expect([...result.current].sort()).toEqual(["ana@orcoma.com.br", "bia@orcoma.com.br"]);

    gancho.estado.presenca = { "bia@orcoma.com.br": [{}] };
    act(() => gancho.estado.sync?.());
    expect([...result.current]).toEqual(["bia@orcoma.com.br"]);
  });
});
