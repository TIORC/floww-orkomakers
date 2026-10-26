import { describe, expect, it } from "vitest";

import {
  dataBr,
  diaDeRetorno,
  diasDoPeriodo,
  ordenarPeriodo,
  paraIso,
  semanasDoMes,
} from "./calendario";

describe("semanasDoMes", () => {
  it("começa no domingo e preenche com vazios antes do dia 1 e depois do último dia", () => {
    // Outubro de 2026 começa numa quinta-feira e tem 31 dias.
    const semanas = semanasDoMes(2026, 9);
    expect(semanas[0]).toEqual([null, null, null, null, 1, 2, 3]);
    expect(semanas.at(-1)).toEqual([25, 26, 27, 28, 29, 30, 31]);
    expect(semanas.every((s) => s.length === 7)).toBe(true);
  });

  it("conta fevereiro de ano bissexto e não bissexto", () => {
    const dias = (ano: number) => semanasDoMes(ano, 1).flat().filter(Boolean).length;
    expect(dias(2028)).toBe(29);
    expect(dias(2026)).toBe(28);
  });

  it("um mês que começa no domingo não tem vazios no começo", () => {
    // Fevereiro de 2026 começa num domingo.
    expect(semanasDoMes(2026, 1)[0]?.[0]).toBe(1);
  });
});

describe("período de férias", () => {
  it("conta os dias corridos incluindo o primeiro e o último", () => {
    expect(diasDoPeriodo("2026-11-10", "2026-11-10")).toBe(1);
    expect(diasDoPeriodo("2026-11-10", "2026-11-14")).toBe(5);
    expect(diasDoPeriodo("2026-12-20", "2027-01-18")).toBe(30);
    expect(diasDoPeriodo("2028-02-27", "2028-03-01")).toBe(4);
  });

  it("o retorno é o dia seguinte, pulando só o fim de semana", () => {
    expect(diaDeRetorno("2026-11-10")).toBe("2026-11-11"); // terça -> quarta
    expect(diaDeRetorno("2026-11-13")).toBe("2026-11-16"); // sexta -> segunda
    expect(diaDeRetorno("2026-11-14")).toBe("2026-11-16"); // sábado -> segunda
    expect(diaDeRetorno("2026-12-31")).toBe("2027-01-01");
    // Feriado não é pulado: 20/11/2026 (sexta, feriado) é o retorno de quem termina em 19/11.
    expect(diaDeRetorno("2026-11-19")).toBe("2026-11-20");
  });

  it("formata datas e ordena os dois cliques", () => {
    expect(dataBr("2026-11-10")).toBe("10/11/2026");
    expect(paraIso(2026, 0, 5)).toBe("2026-01-05");
    expect(ordenarPeriodo("2026-11-20", "2026-11-10")).toEqual({
      inicio: "2026-11-10",
      fim: "2026-11-20",
    });
  });
});
