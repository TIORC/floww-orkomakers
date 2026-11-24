import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Banknote,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CircleCheck,
  ClipboardCheck,
  ConciergeBell,
  Crown,
  IdCard,
  Laptop,
  Megaphone,
  Pencil,
  Plus,
  Receipt,
  Scale,
  ShieldCheck,
  Smile,
  SprayCan,
  Target,
  Trash2,
  Truck,
  UserRound,
  Users,
  Wallet,
  Wrench,
  Handshake,
  type LucideIcon,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AbrirVagaDialog } from "@/components/vagas/abrir-vaga-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { podeGerenciarVagas, useUsuarioLogado } from "@/hooks/use-usuario-logado";
import { ordenarPerfisDisc, TONS_DISC } from "@/components/processos-seletivos/perfis-disc";
import { cn } from "@/lib/utils";

type SetorVagas = { id: number; nome: string; vagas: number };
type VagaAberta = {
  id: string;
  titulo: string;
  setor: string;
  criado_em: string;
  status: "ativa" | "encerrada";
  detalhes: Record<string, unknown> | null;
};

// Ícone e cor de cada setor. Setores sem cor definida ficam com a borda padrão.
const VISUAL_SETORES: Record<string, { icone: LucideIcon; cor?: string }> = {
  "Departamento TI": { icone: Laptop, cor: "#4169E1" },
  "BPO Financeiro": { icone: Wallet, cor: "#1B5E20" },
  "Departamento Comercial": { icone: Handshake, cor: "#F97316" },
  "Departamento Contábil": { icone: Calculator, cor: "#EC4899" },
  "Departamento Financeiro": { icone: Banknote, cor: "#4ADE80" },
  "Departamento Fiscal": { icone: Receipt, cor: "#B91C1C" },
  "Departamento Pessoal": { icone: Users, cor: "#CA8A04" },
  "Departamento Qualidade": { icone: ShieldCheck, cor: "#60A5FA" },
  "Departamento Social Media": { icone: Megaphone, cor: "#2DD4BF" },
  "Departamento Societário": { icone: Scale, cor: "#7C3AED" },
  "Departamento Sucesso do Cliente": { icone: Smile, cor: "#C084FC" },
  Recepção: { icone: ConciergeBell, cor: "#D1D5DB" },
  RH: { icone: IdCard, cor: "#D946EF" },
  Transportes: { icone: Truck, cor: "#8B5A2B" },
  "Departamento Técnico": { icone: Wrench },
  Limpeza: { icone: SprayCan },
  CEO: { icone: Crown },
};

// Estações do trilho: os mesmos quatro blocos do formulário, com os campos de cada um.
const ESTACOES_DETALHES: Array<{ titulo: string; icone: LucideIcon; campos: Array<[string, string]> }> = [
  {
    titulo: "Informações básicas",
    icone: Briefcase,
    campos: [
      ["gestor", "Gestor responsável"],
      ["quantidade", "Quantidade de vagas"],
      ["local", "Local de trabalho"],
      ["modalidade", "Modalidade"],
      ["contrato", "Tipo de contrato"],
      ["jornada", "Jornada"],
    ],
  },
  {
    titulo: "Motivo e contratação",
    icone: Target,
    campos: [
      ["motivo", "Motivo da abertura"],
      ["substituido", "Substituído"],
      ["justificativa", "Justificativa"],
      ["salarioMinimo", "Salário mínimo"],
      ["salarioMaximo", "Salário máximo"],
      ["beneficios", "Benefícios"],
      ["beneficiosOutros", "Outros benefícios"],
      ["dataInicio", "Data desejada para início"],
    ],
  },
  {
    titulo: "Perfil da vaga",
    icone: UserRound,
    campos: [
      ["escolaridade", "Escolaridade mínima"],
      ["experiencia", "Experiência necessária"],
      ["atividades", "Principais atividades"],
      ["obrigatorios", "Requisitos obrigatórios"],
      ["desejaveis", "Requisitos desejáveis"],
      ["habilidades", "Habilidades comportamentais"],
      ["disc", "Perfil DISC desejável"],
      ["exigeCnh", "Exige CNH"],
      ["viagens", "Disponibilidade para viagens"],
      ["exigeIdiomas", "Exige idiomas"],
      ["idiomas", "Idiomas"],
    ],
  },
  {
    titulo: "Controle e revisão",
    icone: ClipboardCheck,
    campos: [
      ["prioridade", "Prioridade"],
      ["confidencial", "Vaga confidencial"],
      ["recrutamento", "Recrutamento"],
      ["centroCusto", "Centro de custo"],
      ["observacoes", "Observações"],
      ["anexo", "Anexo"],
    ],
  },
];

function formatarValorDetalhe(valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (Array.isArray(valor)) return valor.length > 0 ? valor.join(", ") : null;
  if (typeof valor === "object") {
    const partes = Object.entries(valor as Record<string, number>).map(([perfil, percentual]) => `${perfil} ${percentual}%`);
    return partes.length > 0 ? partes.join(" · ") : null;
  }
  const texto = String(valor);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : texto;
}

// Perfil DISC com cada perfil na sua cor (Comunicador amarelo, Executor vermelho, Analista azul, Planejador verde).
function DiscColorido({ valores }: { valores: Record<string, number> }) {
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {ordenarPerfisDisc(valores).map((item, indice) => (
        <span key={item.perfil} className="inline-flex items-center gap-1.5">
          {indice > 0 ? <span aria-hidden className="text-muted-foreground">·</span> : null}
          <span className={cn("font-semibold", TONS_DISC[item.perfil].texto)}>
            {item.perfil} {item.valor}%
          </span>
          <span className="text-xs text-muted-foreground">{item.predominante ? "predominante" : "secundário"}</span>
        </span>
      ))}
    </span>
  );
}

// Trilho de trem: dois trilhos paralelos com dormentes, desenhados em SVG entre as estações.
function TrilhoConector({ id }: { id: string }) {
  return (
    <span aria-hidden className="absolute left-[0.875rem] top-11 bottom-0 w-4 text-amber-400">
      <svg className="size-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={id} width="16" height="12" patternUnits="userSpaceOnUse">
            <rect x="0" y="4" width="16" height="3" rx="1" fill="currentColor" opacity="0.35" />
          </pattern>
        </defs>
        <rect width="16" height="100%" fill={`url(#${id})`} />
        <line x1="3" y1="0" x2="3" y2="100%" stroke="currentColor" strokeWidth="2" />
        <line x1="13" y1="0" x2="13" y2="100%" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
  );
}

function DetalhesVaga({
  vaga,
  podeGerenciar,
  processando,
  onEditar,
  onFechar,
  onExcluir,
}: {
  vaga: VagaAberta;
  podeGerenciar: boolean;
  processando: boolean;
  onEditar: () => void;
  onFechar: () => void;
  onExcluir: () => void;
}) {
  const detalhes = vaga.detalhes ?? {};
  const estacoes = ESTACOES_DETALHES.map((estacao) => ({
    ...estacao,
    linhas: estacao.campos.flatMap(([chave, rotulo]) => {
      const valor = formatarValorDetalhe(detalhes[chave]);
      return valor ? [{ chave, rotulo, valor }] : [];
    }),
  })).filter((estacao) => estacao.linhas.length > 0);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">{vaga.titulo}</DialogTitle>
        <DialogDescription>
          {vaga.setor} · Aberta em {new Date(vaga.criado_em).toLocaleDateString("pt-BR")}
        </DialogDescription>
      </DialogHeader>
      {estacoes.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">
          Esta vaga foi aberta antes do registro completo das informações, então só o cargo, o setor e a data estão disponíveis.
        </p>
      ) : (
        <ol className="mt-2">
          {estacoes.map((estacao, indice) => {
            const Icone = estacao.icone;
            return (
              <li key={estacao.titulo} className="relative pb-8 pl-14 last:pb-0">
                {indice < estacoes.length - 1 ? <TrilhoConector id={`trilho-dormente-${indice}`} /> : null}
                <span className="absolute left-0 top-0 grid size-11 place-items-center rounded-full border-2 border-amber-400 bg-card text-amber-400">
                  <Icone className="size-5" aria-hidden />
                </span>
                <h3 className="font-display text-base font-semibold text-foreground">{estacao.titulo}</h3>
                <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {estacao.linhas.map((linha) => (
                    <div key={linha.rotulo} className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{linha.rotulo}</dt>
                      <dd className="mt-0.5 break-words text-sm text-foreground">
                        {linha.chave === "disc" ? <DiscColorido valores={detalhes["disc"] as Record<string, number>} /> : linha.valor}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ol>
      )}
      {podeGerenciar ? (
        <DialogFooter className="border-t border-border pt-4 sm:justify-between">
          <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={processando} onClick={onEditar}>
            <Pencil className="size-4" aria-hidden />
            Editar vaga
          </Button>
          {vaga.status === "ativa" ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" disabled={processando} className="bg-emerald-600 text-white hover:bg-emerald-700">
                  <CircleCheck className="size-4" aria-hidden />
                  Fechar vaga
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Fechar esta vaga?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A vaga “{vaga.titulo}” será movida para Fechadas, indicando que ela já foi preenchida.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onFechar} className="bg-emerald-600 text-white hover:bg-emerald-700">Fechar vaga</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={processando}>
                <Trash2 className="size-4" aria-hidden />
                Excluir vaga
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir esta vaga?</AlertDialogTitle>
                <AlertDialogDescription>
                  A vaga “{vaga.titulo}” será removida permanentemente e não poderá ser recuperada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      ) : null}
    </>
  );
}

const db = supabase as unknown as SupabaseClient<any>;

// Vagas ativas e fechadas (encerradas): a aba Abertas e a aba Fechadas usam esta lista.
async function listarVagasAbertas(): Promise<VagaAberta[]> {
  const { data, error } = await db
    .from("vagas")
    .select("id, titulo, setor, criado_em, status, detalhes")
    .in("status", ["ativa", "encerrada"])
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VagaAberta[];
}

export const Route = createFileRoute("/vagas")({ component: VagasPage });

function VagasVazias({ fechadas }: { fechadas: boolean }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-12 text-center">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mb-6 grid size-36 place-items-center rounded-[2rem] bg-primary/5 text-primary/75 sm:size-44"
      >
        <BriefcaseBusiness className="size-20 sm:size-24" strokeWidth={1.2} aria-hidden />
      </motion.div>
      <h2 className="font-display text-lg font-semibold text-amber-500">
        {fechadas ? "Nenhuma vaga fechada" : "Nenhuma vaga aberta"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {fechadas
          ? "As vagas encerradas aparecerão aqui."
          : "As oportunidades disponíveis para candidatura aparecerão aqui."}
      </p>
    </div>
  );
}

// Lista de cards de vagas (usada nas abas Abertas e Fechadas).
function ListaVagas({ vagas, onSelecionar }: { vagas: VagaAberta[]; onSelecionar: (vaga: VagaAberta) => void }) {
  return (
    <ul className="grid gap-3">
      {vagas.map((vaga) => {
        const visual = VISUAL_SETORES[vaga.setor];
        const Icone = visual?.icone ?? Building2;
        const cor = visual?.cor;
        return (
          <li
            key={vaga.id}
            className={cn("overflow-hidden rounded-xl border", !cor && "border-border")}
            style={cor ? { borderColor: cor, backgroundColor: `${cor}26` } : undefined}
          >
            <button
              type="button"
              onClick={() => onSelecionar(vaga)}
              className="flex w-full flex-wrap items-center gap-4 p-4 text-left transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span
                className={cn("grid size-11 shrink-0 place-items-center rounded-full border-2", !cor && "border-border text-muted-foreground")}
                style={cor ? { borderColor: cor, color: cor, backgroundColor: "rgba(0,0,0,0.25)" } : undefined}
              >
                <Icone className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{vaga.titulo}</p>
                <p className="text-sm text-muted-foreground">{vaga.setor}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {vaga.status === "encerrada" ? "Fechada" : "Aberta"} em {new Date(vaga.criado_em).toLocaleDateString("pt-BR")}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function VagasPage() {
  const [abrirVagaAberto, setAbrirVagaAberto] = useState(false);
  const [vagaEmEdicao, setVagaEmEdicao] = useState<VagaAberta | null>(null);
  const [vagaSelecionada, setVagaSelecionada] = useState<VagaAberta | null>(null);
  const [processando, setProcessando] = useState(false);
  const queryClient = useQueryClient();
  const { data: usuario } = useUsuarioLogado();

  async function alterarVaga(vaga: VagaAberta, operacao: "excluir" | "fechar") {
    setProcessando(true);
    const consulta = db.from("vagas");
    const { error } = operacao === "excluir"
      ? await consulta.delete().eq("id", vaga.id)
      : await consulta.update({ status: "encerrada" }).eq("id", vaga.id);
    setProcessando(false);
    if (error) {
      toast.error(operacao === "excluir" ? "Não foi possível excluir a vaga. Tente novamente." : "Não foi possível fechar a vaga. Tente novamente.");
      return;
    }
    toast.success(operacao === "excluir" ? `Vaga “${vaga.titulo}” excluída.` : `Vaga “${vaga.titulo}” fechada.`);
    setVagaSelecionada(null);
    await queryClient.invalidateQueries({ queryKey: ["vagas-abertas"] });
  }

  const { data: todasVagas = [], isError: erroVagasAbertas } = useQuery({
    queryKey: ["vagas-abertas"],
    queryFn: listarVagasAbertas,
  });
  const vagasAbertas = useMemo(() => todasVagas.filter((vaga) => vaga.status === "ativa"), [todasVagas]);
  const vagasFechadas = useMemo(() => todasVagas.filter((vaga) => vaga.status === "encerrada"), [todasVagas]);

  const setoresVagas = useMemo<SetorVagas[]>(() => {
    const contagem = new Map<string, number>();
    for (const vaga of vagasAbertas) contagem.set(vaga.setor, (contagem.get(vaga.setor) ?? 0) + 1);
    return [...contagem]
      .map(([nome, vagas], id) => ({ id, nome, vagas }))
      .sort((a, b) => b.vagas - a.vagas || a.nome.localeCompare(b.nome));
  }, [vagasAbertas]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-4 pb-10 pt-24 sm:px-6 lg:px-10">
        <Card className="min-h-[34rem] rounded-2xl shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <motion.header
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="mb-8 flex flex-wrap items-start justify-between gap-4"
            >
              <div>
              <h1 className="font-display text-3xl font-semibold text-amber-500">Vagas</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Consulte as oportunidades abertas e as vagas já encerradas.
              </p>
              </div>
              <Button type="button" onClick={() => { setVagaEmEdicao(null); setAbrirVagaAberto(true); }} className="rounded-full bg-brand text-slate-900 shadow hover:bg-brand/90 hover:text-slate-900">
                <Plus className="size-4" aria-hidden />
                Abrir vaga
              </Button>
            </motion.header>
            <Tabs defaultValue="abertas" className="w-full">
              <TabsList className="h-auto w-full justify-start gap-2 rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger
                  value="abertas"
                  className="rounded-t-md rounded-b-none border border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Abertas
                </TabsTrigger>
                <TabsTrigger
                  value="fechadas"
                  className="rounded-t-md rounded-b-none border border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Fechadas
                </TabsTrigger>
              </TabsList>
              <TabsContent value="abertas" className="mt-0">
                {erroVagasAbertas ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">Não foi possível carregar as vagas abertas.</p>
                ) : vagasAbertas.length === 0 ? (
                  <VagasVazias fechadas={false} />
                ) : (
                  <ListaVagas vagas={vagasAbertas} onSelecionar={setVagaSelecionada} />
                )}
              </TabsContent>
              <TabsContent value="fechadas" className="mt-0">
                {vagasFechadas.length === 0 ? (
                  <VagasVazias fechadas />
                ) : (
                  <ListaVagas vagas={vagasFechadas} onSelecionar={setVagaSelecionada} />
                )}
              </TabsContent>
            </Tabs>

            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 240, damping: 26 }}
              className="mt-8 border-t border-border pt-8"
              aria-labelledby="vagas-setor-title"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 id="vagas-setor-title" className="font-display text-xl font-semibold text-amber-500">
                    Vagas abertas por setor
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Distribuição das vagas abertas por setor.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                {setoresVagas.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
                    <p className="text-sm font-medium text-amber-500">Nenhum setor com vagas abertas</p>
                    <p className="mt-1 text-sm text-muted-foreground">O gráfico será preenchido quando houver vagas abertas.</p>
                  </div>
                ) : (
                  <div className="h-80 w-full rounded-xl border border-border bg-card p-4" role="img" aria-label="Gráfico de vagas abertas por setor">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={setoresVagas} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                        <YAxis dataKey="nome" type="category" width={130} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(value) => [`${value} vagas`, "Abertas"]}
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            borderRadius: 8,
                            color: "var(--card-foreground)",
                          }}
                          labelStyle={{ color: "var(--card-foreground)" }}
                          itemStyle={{ color: "#fbbf24" }}
                        />
                        <Bar dataKey="vagas" name="Vagas abertas" fill="#fbbf24" radius={[0, 6, 6, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

              </div>
            </motion.section>
          </CardContent>
        </Card>
        <Dialog open={vagaSelecionada !== null} onOpenChange={(aberto) => { if (!aberto) setVagaSelecionada(null); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
            {vagaSelecionada ? (
              <DetalhesVaga
                vaga={vagaSelecionada}
                podeGerenciar={podeGerenciarVagas(usuario)}
                processando={processando}
                onEditar={() => {
                  setVagaEmEdicao(vagaSelecionada);
                  setVagaSelecionada(null);
                  setAbrirVagaAberto(true);
                }}
                onFechar={() => alterarVaga(vagaSelecionada, "fechar")}
                onExcluir={() => alterarVaga(vagaSelecionada, "excluir")}
              />
            ) : null}
          </DialogContent>
        </Dialog>
        <AbrirVagaDialog open={abrirVagaAberto} onOpenChange={setAbrirVagaAberto} vagaParaEditar={vagaEmEdicao} />
      </main>
    </div>
  );
}
