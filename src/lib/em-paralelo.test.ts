import { describe, expect, it } from "vitest";

import { emParalelo } from "./em-paralelo";

describe("emParalelo", () => {
  it("respeita o limite e mantém a ordem dos resultados", async () => {
    let ativas = 0;
    let maximo = 0;
    const resultados = await emParalelo([1, 2, 3, 4, 5, 6], 2, async (n) => {
      ativas += 1;
      maximo = Math.max(maximo, ativas);
      await new Promise((resolver) => setTimeout(resolver, 5));
      ativas -= 1;
      return n * 10;
    });
    expect(maximo).toBe(2);
    expect(resultados).toEqual([10, 20, 30, 40, 50, 60].map((valor) => ({ ok: true, valor })));
  });

  it("uma tarefa que falha não derruba as outras", async () => {
    const resultados = await emParalelo(["a", "b", "c"], 3, async (x) => {
      if (x === "b") throw new Error("falhou");
      return x;
    });
    expect(resultados.map((r) => r.ok)).toEqual([true, false, true]);
  });

  it("aceita lista vazia", async () => {
    expect(await emParalelo([], 4, async () => 1)).toEqual([]);
  });
});
