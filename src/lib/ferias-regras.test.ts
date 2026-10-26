import { describe, expect, it } from "vitest";

import { motivoDeBloqueioDoInicio } from "./ferias-regras";

describe("motivoDeBloqueioDoInicio", () => {
  it("bloqueia os dois dias antes de um feriado", () => {
    // 2026-11-20 (sexta) é a Consciência Negra: quarta 18 e quinta 19 não podem iniciar.
    expect(motivoDeBloqueioDoInicio("2026-11-18")).toMatch(/Consciência Negra/);
    expect(motivoDeBloqueioDoInicio("2026-11-19")).toMatch(/feriado/);
  });

  it("o terceiro dia antes do feriado e o próprio feriado seguem livres", () => {
    expect(motivoDeBloqueioDoInicio("2026-11-17")).toBeNull(); // terça
    // 25/12/2026 é sexta (já bloqueada pelo descanso semanal); use um feriado no meio da semana.
    expect(motivoDeBloqueioDoInicio("2026-09-07")).toBeNull(); // segunda, o próprio feriado
  });

  it("bloqueia sexta e sábado, os dois dias antes do descanso semanal", () => {
    expect(motivoDeBloqueioDoInicio("2026-11-06")).toMatch(/descanso semanal/); // sexta
    expect(motivoDeBloqueioDoInicio("2026-11-07")).toMatch(/descanso semanal/); // sábado
  });

  it("de domingo a quinta pode iniciar quando não há feriado próximo", () => {
    for (const dia of ["2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12"]) {
      expect(motivoDeBloqueioDoInicio(dia)).toBeNull();
    }
  });

  it("ponto facultativo não bloqueia (Corpus Christi, quinta 04/06/2026)", () => {
    expect(motivoDeBloqueioDoInicio("2026-06-02")).toBeNull(); // terça
    expect(motivoDeBloqueioDoInicio("2026-06-03")).toBeNull(); // quarta
  });

  it("vale também na virada do ano (1º/1/2027 é sexta)", () => {
    expect(motivoDeBloqueioDoInicio("2026-12-30")).toMatch(/Confraternização/);
    expect(motivoDeBloqueioDoInicio("2026-12-31")).toMatch(/Confraternização/);
  });
});
