import { describe, expect, it } from "vitest";

import { linhasDoMes } from "@/lib/historico-pontos";
import {
  agruparBatidasPorDia,
  dataLocalDeIso,
  diaCompleto,
  horaLocalDeIso,
  marcacoesDoDia,
  minutosTrabalhadosDoDia,
  paresDeMarcacoes,
  ultimaBatida,
  type Batida,
} from "@/lib/ponto-batidas";

describe("paresDeMarcacoes", () => {
  it("junta cada entrada com a saída seguinte e calcula o saldo do par", () => {
    const pares = paresDeMarcacoes([
      { tipo: "Entrada", hora: "08:20" },
      { tipo: "Saída", hora: "12:05" },
      { tipo: "Entrada", hora: "13:05" },
      { tipo: "Saída", hora: "20:47" },
    ]);
    expect(pares).toEqual([
      { entrada: "08:20", saida: "12:05", saldo: 225 },
      { entrada: "13:05", saida: "20:47", saldo: 462 },
    ]);
  });

  it("deixa o saldo vazio quando a entrada ainda não tem saída", () => {
    expect(paresDeMarcacoes([{ tipo: "Entrada", hora: "09:00" }])).toEqual([
      { entrada: "09:00", saida: null, saldo: null },
    ]);
  });
});

// Monta a batida em hora local, para o teste valer em qualquer fuso horário.
const batida = (
  id: string,
  ano: number,
  mes: number,
  dia: number,
  hora: number,
  minuto: number,
): Batida => ({
  id,
  registradoEm: new Date(ano, mes - 1, dia, hora, minuto).toISOString(),
});

describe("horário e dia locais", () => {
  it("lê o dia e a hora no fuso do navegador", () => {
    const iso = new Date(2026, 10, 13, 8, 5).toISOString();
    expect(dataLocalDeIso(iso)).toBe("2026-11-13");
    expect(horaLocalDeIso(iso)).toBe("08:05");
  });
});

describe("marcacoesDoDia", () => {
  it("nomeia as 4 batidas do dia pelo período: entrada, almoço, retorno e saída", () => {
    const dia = [
      batida("a", 2026, 11, 13, 8, 20),
      batida("b", 2026, 11, 13, 12, 5),
      batida("c", 2026, 11, 13, 13, 5),
      batida("d", 2026, 11, 13, 20, 47),
    ];
    expect(marcacoesDoDia(dia)).toEqual([
      { tipo: "Entrada", hora: "08:20" },
      { tipo: "Saída para almoço", hora: "12:05" },
      { tipo: "Retorno do almoço", hora: "13:05" },
      { tipo: "Saída", hora: "20:47" },
    ]);
  });

  it("diaCompleto só é verdadeiro com as 4 batidas", () => {
    const tres = [
      batida("a", 2026, 11, 13, 8, 0),
      batida("b", 2026, 11, 13, 12, 0),
      batida("c", 2026, 11, 13, 13, 0),
    ];
    expect(diaCompleto(tres)).toBe(false);
    expect(diaCompleto([...tres, batida("d", 2026, 11, 13, 18, 0)])).toBe(true);
  });
});

describe("minutosTrabalhadosDoDia", () => {
  it("soma cada par entrada-saída", () => {
    const dia = [
      batida("a", 2026, 11, 13, 8, 20),
      batida("b", 2026, 11, 13, 12, 5),
      batida("c", 2026, 11, 13, 13, 5),
      batida("d", 2026, 11, 13, 20, 47),
    ];
    // 3h45 da manhã + 7h42 da tarde = 11h27
    expect(minutosTrabalhadosDoDia(dia)).toBe(687);
  });

  it("não conta uma entrada sem saída (jornada ainda aberta)", () => {
    const dia = [
      batida("a", 2026, 11, 13, 8, 0),
      batida("b", 2026, 11, 13, 12, 0),
      batida("c", 2026, 11, 13, 13, 0),
    ];
    expect(minutosTrabalhadosDoDia(dia)).toBe(240);
  });
});

describe("agruparBatidasPorDia", () => {
  it("separa por dia e ordena pela hora, mesmo que chegue fora de ordem", () => {
    const grupos = agruparBatidasPorDia([
      batida("b", 2026, 11, 13, 12, 5),
      batida("a", 2026, 11, 13, 8, 20),
      batida("c", 2026, 11, 14, 9, 0),
    ]);
    expect([...grupos.keys()]).toEqual(["2026-11-13", "2026-11-14"]);
    expect(grupos.get("2026-11-13")?.map((b) => b.id)).toEqual(["a", "b"]);
  });
});

describe("ultimaBatida", () => {
  it("devolve a mais recente, ou null sem batidas", () => {
    expect(ultimaBatida([])).toBeNull();
    const ultima = ultimaBatida([
      batida("a", 2026, 11, 13, 8, 0),
      batida("b", 2026, 11, 13, 18, 0),
    ]);
    expect(ultima?.id).toBe("b");
  });
});

describe("batidas nas linhas do mês", () => {
  it("mostra as marcações e calcula o trabalhado de um dia sem espelho", () => {
    const batidas = [batida("a", 2026, 11, 16, 8, 0), batida("b", 2026, 11, 16, 12, 0)];
    const [linha] = linhasDoMes([], [], "2026-11", batidas);
    expect(linha?.data).toBe("2026-11-16");
    expect(linha?.marcacoes).toEqual([
      { tipo: "Entrada", hora: "08:00" },
      { tipo: "Saída para almoço", hora: "12:00" },
    ]);
    expect(linha?.trabalhado).toBe(240);
  });

  it("mantém o trabalhado do espelho quando o dia já tem espelho", () => {
    const dias = [
      {
        data: "2026-11-16",
        diaSemana: "Segunda-feira",
        trabalhado: 540,
        horasExtras: 0,
        horasFaltas: 0,
        observacao: "",
      },
    ];
    const batidas = [batida("a", 2026, 11, 16, 8, 0), batida("b", 2026, 11, 16, 12, 0)];
    const [linha] = linhasDoMes(dias, [], "2026-11", batidas);
    expect(linha?.trabalhado).toBe(540);
    expect(linha?.marcacoes).toHaveLength(2);
  });

  it("ignora batidas de outro mês", () => {
    const batidas = [batida("a", 2026, 10, 31, 8, 0)];
    expect(linhasDoMes([], [], "2026-11", batidas)).toEqual([]);
  });
});
