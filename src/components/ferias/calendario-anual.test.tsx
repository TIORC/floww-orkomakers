import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { motivoDeBloqueioDoInicio } from "@/lib/ferias-regras";
import { CalendarioAnual } from "./calendario-anual";

describe("CalendarioAnual", () => {
  it("marca o feriado em vermelho e mostra o nome ao passar o mouse", () => {
    render(<CalendarioAnual ano={2026} aoMudarAno={() => {}} />);
    const natal = screen.getByTitle("25 de Dezembro: Natal");
    expect(natal).toHaveClass("text-red-400");
    expect(screen.getByTitle("20 de Novembro: Dia da Consciência Negra")).toBeInTheDocument();
  });

  it("dia comum não tem dica nem cor de feriado", () => {
    render(<CalendarioAnual ano={2026} aoMudarAno={() => {}} />);
    const outubro = within(screen.getByRole("region", { name: "Outubro de 2026" }));
    expect(outubro.getByText("26")).not.toHaveClass("text-red-400");
    expect(outubro.getByText("12")).toHaveClass("text-red-400"); // Nossa Senhora Aparecida
  });

  it("no modo de seleção, o botão do feriado também traz o nome", () => {
    render(
      <CalendarioAnual
        ano={2027}
        aoMudarAno={() => {}}
        selecao={{ inicio: null, fim: null }}
        aoEscolherDia={() => {}}
      />,
    );
    const natal = screen.getByTitle("25 de Dezembro: Natal");
    expect(natal.tagName).toBe("BUTTON");
    expect(natal).toHaveAccessibleName("25 de Dezembro de 2027, feriado: Natal");
  });

  it("bloqueia só o primeiro dia nos 2 dias antes de feriado ou do descanso; o último dia é livre", () => {
    const quandoTodosPassam = { inicio: null, fim: null };
    const { rerender } = render(
      <CalendarioAnual
        ano={2028}
        aoMudarAno={() => {}}
        selecao={quandoTodosPassam}
        aoEscolherDia={() => {}}
        motivoDeBloqueioDoInicio={motivoDeBloqueioDoInicio}
      />,
    );
    // 17/11/2028 é sexta, um dos 2 dias antes do descanso semanal.
    const sexta = screen.getByRole("button", { name: /^17 de Novembro de 2028/ });
    expect(sexta).toBeDisabled();
    expect(sexta).toHaveAttribute("title", expect.stringMatching(/descanso semanal/));
    expect(screen.getByRole("button", { name: /^8 de Novembro de 2028/ })).toBeEnabled();

    // Com o início já escolhido, a sexta passa a valer como último dia.
    rerender(
      <CalendarioAnual
        ano={2028}
        aoMudarAno={() => {}}
        selecao={{ inicio: "2028-11-08", fim: null }}
        aoEscolherDia={() => {}}
        motivoDeBloqueioDoInicio={motivoDeBloqueioDoInicio}
      />,
    );
    expect(screen.getByRole("button", { name: /^17 de Novembro de 2028/ })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /^17 de Novembro de 2028/ }));
  }, 20_000);
});
