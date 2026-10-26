// Roda `tarefa` em todos os itens, no máximo `limite` ao mesmo tempo, e devolve os resultados na ordem dos itens.
// Uma tarefa que falha não derruba as outras: o resultado dela é o erro.
export async function emParalelo<T, R>(
  itens: T[],
  limite: number,
  tarefa: (item: T, indice: number) => Promise<R>,
): Promise<({ ok: true; valor: R } | { ok: false; erro: unknown })[]> {
  const resultados: ({ ok: true; valor: R } | { ok: false; erro: unknown })[] = new Array(
    itens.length,
  );
  let proximo = 0;

  async function trabalhador() {
    while (proximo < itens.length) {
      const indice = proximo++;
      try {
        resultados[indice] = { ok: true, valor: await tarefa(itens[indice] as T, indice) };
      } catch (erro) {
        resultados[indice] = { ok: false, erro };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
  return resultados;
}
