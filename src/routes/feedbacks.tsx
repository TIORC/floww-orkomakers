import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, MessageSquarePlus, Search, Send, SlidersHorizontal } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EnviarFeedbackDialog } from "@/components/painel/enviar-feedback-dialog";

export const Route = createFileRoute("/feedbacks")({
  head: () => ({
    meta: [{ title: "Feedbacks — Orcoma Orkomakers" }],
  }),
  component: Feedbacks,
});

const CORES = {
  enviados: "#38bdf8",
  recebidos: "#facc15",
  media: "#38bdf8",
  usuario: "#facc15",
};

const ITENS_RESUMO = [
  "Proatividade e Autonomia",
  "Confiabilidade e Transparência",
  "Encantamento e Foco no Cliente",
  "Responsabilidade e Produtividade",
];

const ABAS = ["Recebidos", "Enviados", "Solicitações"] as const;
type Aba = (typeof ABAS)[number];

function dataISO(data: Date) {
  return data.toISOString().slice(0, 10);
}

// Período padrão: últimos três meses até hoje.
function periodoPadrao() {
  const fim = new Date();
  const inicio = new Date(fim);
  inicio.setMonth(inicio.getMonth() - 3);
  return { inicio: dataISO(inicio), fim: dataISO(fim) };
}

// Meses do gráfico mensal, do início ao fim do período (sem dados por enquanto).
function mesesDoPeriodo(inicio: string, fim: string) {
  const meses: { mes: string; enviados: number; recebidos: number }[] = [];
  const atual = new Date(`${inicio}T00:00:00`);
  const limite = new Date(`${fim}T00:00:00`);
  while (atual <= limite) {
    const rotulo = `${String(atual.getMonth() + 1).padStart(2, "0")}/${atual.getFullYear()}`;
    if (!meses.some((m) => m.mes === rotulo)) meses.push({ mes: rotulo, enviados: 0, recebidos: 0 });
    atual.setMonth(atual.getMonth() + 1);
  }
  return meses;
}

function Feedbacks() {
  const padrao = periodoPadrao();
  const [periodo, setPeriodo] = useState(padrao);
  const [filtrado, setFiltrado] = useState(padrao);
  const [aba, setAba] = useState<Aba>("Recebidos");
  const [busca, setBusca] = useState("");
  const [feedbackAberto, setFeedbackAberto] = useState(false);

  const radar = ITENS_RESUMO.map((categoria) => ({ categoria, usuario: 0, media: 0 }));
  const mensal = mesesDoPeriodo(filtrado.inicio, filtrado.fim);

  function aplicarFiltro(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFiltrado(periodo);
  }

  function limpar() {
    setPeriodo(padrao);
    setFiltrado(padrao);
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <EnviarFeedbackDialog aberto={feedbackAberto} onFechar={() => setFeedbackAberto(false)} />
      <main className="min-w-0 flex-1 space-y-6 px-10 pb-10 pt-24">
        <Card className="border-panel-active bg-panel text-white">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-foreground">Feedbacks</CardTitle>
              <p className="mt-1 text-sm text-white">Dê, solicite e receba feedbacks de forma construtiva.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-brand text-slate-900 shadow hover:bg-brand/90">
                <MessageSquarePlus className="mr-2 size-4" /> Solicitar Feedback
              </Button>
              <Button onClick={() => setFeedbackAberto(true)} className="bg-brand text-slate-900 shadow hover:bg-brand/90">
                <Send className="mr-2 size-4" /> Enviar Feedback
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form className="flex flex-wrap items-end gap-3" onSubmit={aplicarFiltro}>
              <label className="grid gap-1 text-sm text-foreground">
                Data início
                <Input
                  type="date"
                  value={periodo.inicio}
                  onChange={(event) => setPeriodo((p) => ({ ...p, inicio: event.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm text-foreground">
                Data final
                <Input
                  type="date"
                  value={periodo.fim}
                  onChange={(event) => setPeriodo((p) => ({ ...p, fim: event.target.value }))}
                  required
                />
              </label>
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="ghost" onClick={limpar} className="text-foreground">
                  Limpar
                </Button>
                <Button type="submit" className="bg-brand text-slate-900 shadow hover:bg-brand/90">
                  <SlidersHorizontal className="mr-2 size-4" />
                  Filtrar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Dados do período</h2>
            <p className="text-sm text-white">
              Dados relacionados aos feedbacks enviados e recebidos no período filtrado.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-panel-active bg-panel text-white">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-white">Feedbacks recebidos</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Baixar relatório de feedbacks recebidos" className="text-brand">
                  <Download className="size-5" />
                </Button>
              </CardContent>
            </Card>
            <Card className="border-panel-active bg-panel text-white">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-white">Feedbacks enviados</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <Send className="size-5 text-brand" aria-hidden />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-panel-active bg-panel text-white">
              <CardHeader>
                <CardTitle className="text-base text-foreground">Resumo por item</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[28rem] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radar} outerRadius="80%">
                      <PolarGrid stroke="oklch(0.4 0.04 260)" />
                      <PolarAngleAxis dataKey="categoria" tick={{ fontSize: 10, fill: "oklch(0.82 0.02 255)" }} />
                      <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fill: "oklch(0.82 0.02 255)" }} />
                      <Tooltip />
                      <Legend />
                      <Radar name="Feedbacks recebidos" dataKey="usuario" stroke={CORES.usuario} fill={CORES.usuario} fillOpacity={0.3} />
                      <Radar name="Média da Companhia" dataKey="media" stroke={CORES.media} fill={CORES.media} fillOpacity={0.18} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-panel-active bg-panel text-white">
              <CardHeader>
                <CardTitle className="text-base text-foreground">
                  Resumo mensal de feedbacks enviados e recebidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mensal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.4 0.04 260)" />
                      <XAxis dataKey="mes" tick={{ fill: "oklch(0.82 0.02 255)" }} />
                      <YAxis allowDecimals={false} tick={{ fill: "oklch(0.82 0.02 255)" }} />
                      <Tooltip />
                      <Legend />
                      <Bar name="Feedbacks enviados" dataKey="enviados" fill={CORES.enviados} radius={[3, 3, 0, 0]} />
                      <Bar name="Feedbacks recebidos" dataKey="recebidos" fill={CORES.recebidos} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Feedbacks do período</h2>
            <p className="text-sm text-white">Listagem dos feedbacks e solicitações no período filtrado.</p>
          </div>

          <div role="tablist" aria-label="Tipos de feedback" className="flex flex-wrap gap-2 border-b border-panel-active pb-3">
            {ABAS.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={aba === item}
                onClick={() => setAba(item)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm",
                  aba === item
                    ? "bg-brand font-semibold text-slate-900 shadow"
                    : "text-white hover:bg-panel-active/50",
                )}
              >
                {item} (0)
              </button>
            ))}
          </div>

          <div className="mt-4 grid min-h-[20rem] gap-4 lg:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.5fr)]">
            <Card className="min-w-0 border-panel-active bg-panel text-white">
              <CardContent className="p-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-panel-label" aria-hidden />
                  <Input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Filtrar por pessoa ou departamento"
                    className="pl-9"
                    aria-label="Filtrar feedbacks"
                  />
                </div>
                <p className="p-4 text-sm text-white">Nenhum registro encontrado no período.</p>
              </CardContent>
            </Card>
            <Card className="min-w-0 border-panel-active bg-panel text-white">
              <CardContent className="flex h-full min-h-[16rem] items-center justify-center p-6">
                <p className="text-sm text-white">Selecione um feedback para ver os detalhes.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
