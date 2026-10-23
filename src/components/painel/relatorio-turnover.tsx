import { useEffect, useState } from "react";

import { AnimarEntrada } from "@/components/painel/animar-entrada";
import { CardConsolidadoTurnover } from "@/components/painel/relatorio-consolidado";
import { CardDepartamentoTurnover } from "@/components/painel/relatorio-departamento";
import { CardDesligamentosMes } from "@/components/painel/relatorio-desligamentos-mes";
import { CardHistoricoDesligamentos } from "@/components/painel/relatorio-historico";
import { CardMotivos } from "@/components/painel/relatorio-motivos";
import { CardTaxaPeriodo } from "@/components/painel/relatorio-taxa-periodo";
import { CardTipoTurnover } from "@/components/painel/relatorio-tipo";
import { CardTop5Motivos } from "@/components/painel/relatorio-top-motivos";
import {
  agruparPorNomeDoMotivo,
  buscarConsolidadoTurnover,
  buscarDesligamentosPorMes,
  buscarHistoricoDesligamentos,
  buscarTaxaTurnoverPorPeriodo,
  buscarTurnoverPorDepartamento,
  buscarTurnoverPorMotivo,
  type ConsolidadoTurnover,
  type DesligamentosMes,
  type LinhaHistorico,
  type MotivoTurnover,
  type PontoTurnoverPeriodo,
  type TurnoverPorDepartamento,
} from "@/lib/turnover";

type DadosTurnover = {
  consolidado: ConsolidadoTurnover;
  serie: PontoTurnoverPeriodo[];
  desligamentosMes: DesligamentosMes[];
  motivos: MotivoTurnover[];
  departamentos: TurnoverPorDepartamento;
  historico: LinhaHistorico[];
};

// Busca os dados uma vez e distribui para os relatórios em grade de 2 colunas:
// Consolidado | Taxa do período, Desligamentos por mês | Taxa por mês, Motivo | Top 8, Tipo | Departamento, Histórico (linha inteira).
export function RelatorioTurnover() {
  const [dados, setDados] = useState<DadosTurnover | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      buscarConsolidadoTurnover(),
      buscarTaxaTurnoverPorPeriodo(),
      buscarDesligamentosPorMes(),
      buscarTurnoverPorMotivo(),
      buscarTurnoverPorDepartamento(),
      buscarHistoricoDesligamentos(),
    ])
      .then(([consolidado, serie, desligamentosMes, motivos, departamentos, historico]) => {
        if (ativo) {
          setDados({ consolidado, serie, desligamentosMes, motivos, departamentos, historico });
        }
      })
      .catch(() => ativo && setErro(true));
    return () => {
      ativo = false;
    };
  }, []);

  if (erro) {
    return <p className="text-sm text-white/80">Não foi possível carregar os desligamentos.</p>;
  }

  if (dados === null) {
    return <p className="text-sm text-white/80">Carregando desligamentos...</p>;
  }

  const { consolidado, serie, desligamentosMes, motivos, departamentos, historico } = dados;
  const motivosAgrupados = agruparPorNomeDoMotivo(motivos);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AnimarEntrada indice={0}>
        <CardConsolidadoTurnover dados={consolidado} />
      </AnimarEntrada>
      <AnimarEntrada indice={1}>
        <CardTaxaPeriodo serie={serie} />
      </AnimarEntrada>
      <AnimarEntrada indice={2}>
        <CardDesligamentosMes serie={desligamentosMes} />
      </AnimarEntrada>
      <AnimarEntrada indice={3}>
        <CardTaxaPeriodo
          serie={serie}
          titulo="Taxa de turnover por mês"
          descricao="Taxa de turnover de cada mês nos últimos 12 meses."
        />
      </AnimarEntrada>
      <AnimarEntrada indice={4}>
        <CardMotivos motivos={motivosAgrupados} />
      </AnimarEntrada>
      <AnimarEntrada indice={5}>
        <CardTop5Motivos motivos={motivosAgrupados} />
      </AnimarEntrada>
      <AnimarEntrada indice={6}>
        <CardTipoTurnover motivos={motivos} />
      </AnimarEntrada>
      <AnimarEntrada indice={7}>
        <CardDepartamentoTurnover dados={departamentos} />
      </AnimarEntrada>
      <AnimarEntrada indice={8} className="lg:col-span-2">
        <CardHistoricoDesligamentos linhas={historico} />
      </AnimarEntrada>
    </div>
  );
}
