import { nomeDoFeriado } from "@/lib/feriados";

// CLT, art. 134, §3º: é vedado o início das férias nos dois dias que antecedem feriado ou dia de repouso semanal
// remunerado (DSR). Aqui o DSR é o domingo, então sexta e sábado também não podem ser o primeiro dia.
// Feriado que cai dentro das férias conta como dia de férias normalmente: não é pulado nem estende o período.

export const REGRA_INICIO_DAS_FERIAS =
  "As férias não podem começar nos dois dias que antecedem feriado ou o descanso semanal (CLT, art. 134, §3º).";

const emUtc = (iso: string) => {
  const [ano = 0, mes = 1, dia = 1] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
};

function maisDias(iso: string, dias: number): string {
  const data = emUtc(iso);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

// Pontos facultativos (Carnaval, Corpus Christi) não são feriados legais, então não entram na regra.
function feriadoLegal(iso: string): string | undefined {
  const nome = nomeDoFeriado(iso);
  return nome && !nome.includes("ponto facultativo") ? nome : undefined;
}

// Por que esta data não pode ser o primeiro dia das férias, ou null se pode.
export function motivoDeBloqueioDoInicio(iso: string): string | null {
  for (const antes of [1, 2]) {
    const feriado = feriadoLegal(maisDias(iso, antes));
    if (feriado) {
      return `Não pode começar nos 2 dias antes de feriado (${feriado}, em ${maisDias(iso, antes).split("-").reverse().join("/")}).`;
    }
  }
  const diaDaSemana = emUtc(iso).getUTCDay();
  if (diaDaSemana === 5 || diaDaSemana === 6) {
    return "Não pode começar nos 2 dias antes do descanso semanal (domingo).";
  }
  return null;
}
