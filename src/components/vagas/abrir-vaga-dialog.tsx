import { useEffect, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, FileText, Plus, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { LIMITE_PREDOMINANTE, ordenarPerfisDisc, PERFIS_DISC, type PercentuaisDisc } from "@/components/processos-seletivos/perfis-disc";
import { BarraPercentualDisc, redistribuir } from "@/components/processos-seletivos/distribuicao-disc";
import { listarSetores } from "@/lib/cargos";
import { listarGestoresDoSetor } from "@/lib/organograma-dados";
import { getIniciais } from "@/lib/iniciais";
import { cn } from "@/lib/utils";

const ETAPAS = ["Informações básicas", "Motivo e contratação", "Perfil da vaga", "Controle e revisão"];
const MOTIVOS_ABERTURA = [
  "Substituição de colaborador desligado",
  "Substituição de colaborador afastado (licença, INSS, maternidade)",
  "Aumento de quadro",
  "Nova função/cargo",
  "Sazonalidade/demanda temporária",
  "Promoção ou transferência interna",
  "Novo projeto ou nova unidade",
];
const BENEFICIOS = ["VR", "VA", "VT", "Plano de saúde", "Plano odontológico", "Outros"];
const MOEDAS = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const db = supabase as unknown as SupabaseClient<any>;

type DadosVaga = {
  cargo: string;
  setor: string;
  gestor: string;
  quantidade: string;
  local: string;
  modalidade: string;
  motivo: string;
  substituido: string;
  justificativa: string;
  contrato: string;
  jornada: string;
  salarioMinimo: string;
  salarioMaximo: string;
  beneficios: string[];
  beneficioOutro: string;
  beneficiosOutros: string[];
  dataInicio: string;
  escolaridade: string;
  experiencia: string;
  atividades: string;
  obrigatorios: string;
  desejaveis: string;
  habilidades: string[];
  habilidadeRascunho: string;
  disc: PercentuaisDisc;
  exigeCnh: boolean;
  viagens: boolean;
  exigeIdiomas: boolean;
  idiomas: string;
  prioridade: string;
  confidencial: boolean;
  recrutamento: string;
  centroCusto: string;
  observacoes: string;
  anexo: File | null;
};

type GestorVaga = {
  id: string;
  user_id: string;
  nome: string;
  cargo: string;
  setor: string;
  setor_sigla: string;
  foto_url: string | null;
};

const DADOS_INICIAIS: DadosVaga = {
  cargo: "", setor: "", gestor: "", quantidade: "1", local: "", modalidade: "",
  motivo: "", substituido: "", justificativa: "", contrato: "", jornada: "",
  salarioMinimo: "", salarioMaximo: "", beneficios: [], beneficioOutro: "", beneficiosOutros: [], dataInicio: "",
  escolaridade: "", experiencia: "", atividades: "", obrigatorios: "", desejaveis: "",
  habilidades: [], habilidadeRascunho: "", disc: { Comunicador: 25, Executor: 25, Analista: 25, Planejador: 25 }, exigeCnh: false, viagens: false, exigeIdiomas: false,
  idiomas: "", prioridade: "média", confidencial: false, recrutamento: "", centroCusto: "",
  observacoes: "", anexo: null,
};

const CLASSES_CONTROLE = "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function valorNumericoMoeda(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  return digitos ? Number(digitos) / 100 : 0;
}

function formatarEntradaMoeda(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  return digitos ? MOEDAS.format(Number(digitos) / 100) : "";
}

function Campo({ label, children, required, error, className }: {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string | undefined;
  className?: string;
}) {
  return (
    <label className={cn("grid content-start gap-1.5 text-sm font-medium", className)}>
      <span>{label}{required ? <span className="ml-1 text-destructive">*</span> : null}</span>
      {children}
      {error ? <span className="text-xs font-normal text-destructive">{error}</span> : null}
    </label>
  );
}

function CaixaResumo({ titulo, etapa, onEditar, children }: {
  titulo: string;
  etapa: number;
  onEditar: (etapa: number) => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-foreground">{titulo}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => onEditar(etapa)}>Editar</Button>
      </div>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function LinhaResumo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm">{value || "Não informado"}</dd>
    </div>
  );
}

// Vaga já cadastrada, aberta para edição (cargo, setor e detalhes do formulário).
export type VagaEditavel = { id: string; titulo: string; setor: string; detalhes: Record<string, unknown> | null };

// Preenche o formulário com o que foi salvo na vaga. O arquivo anexado não é recuperado (só o nome).
function dadosDaVaga(vaga: VagaEditavel): DadosVaga {
  const salvos = (vaga.detalhes ?? {}) as Partial<DadosVaga>;
  return {
    ...DADOS_INICIAIS,
    ...salvos,
    cargo: vaga.titulo,
    setor: vaga.setor,
    quantidade: String(salvos.quantidade ?? 1),
    anexo: null,
    habilidadeRascunho: "",
    beneficioOutro: "",
  };
}

export function AbrirVagaDialog({
  open,
  onOpenChange,
  vagaParaEditar = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vagaParaEditar?: VagaEditavel | null;
}) {
  const [etapa, setEtapa] = useState(0);
  const [dados, setDados] = useState<DadosVaga>(DADOS_INICIAIS);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false);
  const [gestores, setGestores] = useState<GestorVaga[]>([]);
  const [carregandoGestores, setCarregandoGestores] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Reinicia o formulário ao abrir, ou ao trocar a vaga em edição (senão, sobram dados da vez anterior).
  const idEdicao = vagaParaEditar?.id ?? null;
  useEffect(() => {
    if (!open) return;
    setDados(vagaParaEditar ? dadosDaVaga(vagaParaEditar) : DADOS_INICIAIS);
    setEtapa(0);
    setErros({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idEdicao]);
  const somaDisc = PERFIS_DISC.reduce((total, perfil) => total + dados.disc[perfil.valor], 0);

  const { data: setoresLista = [] } = useQuery({ queryKey: ["setores"], queryFn: listarSetores, enabled: open });

  useEffect(() => {
    if (!open) return;
    let cancelado = false;
    setCarregandoGestores(true);
    if (!dados.setor) {
      setGestores([]);
      setCarregandoGestores(false);
      return;
    }
    setCarregandoGestores(true);
    listarGestoresDoSetor(dados.setor)
      .then((lista) => {
        if (cancelado) return;
        setGestores(lista.map((pessoa) => ({ id: pessoa.email, user_id: pessoa.email, nome: pessoa.nome, cargo: pessoa.cargo, setor: pessoa.setor, setor_sigla: "", foto_url: pessoa.fotoUrl })));
      })
      .catch(() => {
        if (cancelado) return;
        toast.error("Não foi possível carregar os gestores do setor.");
        setGestores([]);
      })
      .finally(() => {
        if (!cancelado) setCarregandoGestores(false);
      });
    return () => { cancelado = true; };
  }, [open, dados.setor]);

  function atualizar<K extends keyof DadosVaga>(campo: K, valor: DadosVaga[K]) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: "" }));
  }

  function validarEtapa(indice: number) {
    const novosErros: Record<string, string> = {};
    if (indice === 0) {
      if (!dados.cargo.trim()) novosErros["cargo"] = "Informe o título do cargo.";
      if (!dados.setor) novosErros["setor"] = "Selecione um setor.";
      if (!dados.quantidade || Number(dados.quantidade) < 1) novosErros["quantidade"] = "A quantidade mínima é 1.";
    }
    if (indice === 1) {
      if (!dados.motivo) novosErros["motivo"] = "Selecione o motivo da abertura.";
      if (dados.motivo.startsWith("Substituição") && !dados.substituido.trim()) {
        novosErros["substituido"] = "Informe quem está sendo substituído.";
      }
      if (["Aumento de quadro", "Nova função/cargo"].includes(dados.motivo) && !dados.justificativa.trim()) {
        novosErros["justificativa"] = "Informe a justificativa.";
      }
      if (dados.salarioMinimo && dados.salarioMaximo && valorNumericoMoeda(dados.salarioMinimo) > valorNumericoMoeda(dados.salarioMaximo)) {
        novosErros["salarioMaximo"] = "O máximo precisa ser igual ou maior que o mínimo.";
      }
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function avancar() {
    if (validarEtapa(etapa)) setEtapa((atual) => Math.min(atual + 1, ETAPAS.length - 1));
  }

  async function enviarSolicitacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando) return;
    for (let indice = 0; indice < 3; indice += 1) {
      if (!validarEtapa(indice)) {
        setEtapa(indice);
        return;
      }
    }

    setSalvando(true);
    try {
      const titulo = dados.cargo.trim();
      const quantidade = Math.max(1, Math.floor(Number(dados.quantidade)) || 1);

      // Reaproveita o cargo já cadastrado com o mesmo nome; senão cadastra em Cargos & Salários.
      const { data: existente, error: erroBusca } = await db
        .from("cargos")
        .select("id")
        .eq("nome", titulo)
        .maybeSingle();
      if (erroBusca) throw erroBusca;

      let cargoId: string | undefined = existente?.id;
      if (!cargoId) {
        const { data: criado, error: erroCargo } = await db
          .from("cargos")
          .insert({ nome: titulo, setor: dados.setor })
          .select("id")
          .single();
        if (erroCargo || !criado) throw erroCargo ?? new Error("Cargo não criado");
        cargoId = criado.id;
      }

      // Formulário completo, sem o arquivo (só o nome) e sem os rascunhos dos campos de texto.
      const detalhes = {
        ...dados,
        anexo: dados.anexo?.name ?? null,
        habilidadeRascunho: undefined,
        beneficioOutro: undefined,
      };
      if (vagaParaEditar) {
        // Edição: atualiza só esta vaga (a quantidade não muda aqui).
        const { error: erroEdicao } = await db
          .from("vagas")
          .update({ cargo_id: cargoId, setor: dados.setor, titulo, detalhes })
          .eq("id", vagaParaEditar.id);
        if (erroEdicao) throw erroEdicao;

        await queryClient.invalidateQueries({ queryKey: ["vagas-abertas"] });
        toast.success(`Vaga “${titulo}” atualizada.`);
        fechar(false);
        return;
      }

      const linhas = Array.from({ length: quantidade }, () => ({
        cargo_id: cargoId,
        setor: dados.setor,
        titulo,
        status: "ativa",
        detalhes,
      }));
      const { error: erroVagas } = await db.from("vagas").insert(linhas);
      if (erroVagas) throw erroVagas;

      await queryClient.invalidateQueries({ queryKey: ["vagas-abertas"] });
      toast.success(quantidade === 1 ? `Vaga “${titulo}” aberta.` : `${quantidade} vagas de “${titulo}” abertas.`);
      fechar(false);
    } catch {
      toast.error(vagaParaEditar ? "Não foi possível salvar as alterações. Tente novamente." : "Não foi possível abrir a vaga. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  function fechar(aberto: boolean) {
    onOpenChange(aberto);
    if (!aberto) {
      setEtapa(0);
      setErros({});
    }
  }

  function adicionarBeneficioOutro() {
    const beneficio = dados.beneficioOutro.trim();
    if (!beneficio || dados.beneficiosOutros.includes(beneficio)) return;
    atualizar("beneficiosOutros", [...dados.beneficiosOutros, beneficio]);
    atualizar("beneficioOutro", "");
  }

  function adicionarHabilidade() {
    const habilidade = dados.habilidadeRascunho.trim();
    if (!habilidade || dados.habilidades.includes(habilidade)) return;
    atualizar("habilidades", [...dados.habilidades, habilidade]);
    setDados((atuais) => ({ ...atuais, habilidadeRascunho: "" }));
  }

  function aceitarArquivo(arquivo?: File) {
    if (arquivo) atualizar("anexo", arquivo);
  }

  function soltarArquivo(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setArrastandoArquivo(false);
    aceitarArquivo(event.dataTransfer.files[0]);
  }

  function resumoValor(valor: string | boolean | string[]) {
    if (Array.isArray(valor)) return valor.length ? valor.join(", ") : "";
    if (typeof valor === "boolean") return valor ? "Sim" : "Não";
    return valor;
  }

  const substituicao = dados.motivo.startsWith("Substituição");
  const precisaJustificativa = ["Aumento de quadro", "Nova função/cargo"].includes(dados.motivo);
  const nomeGestorSelecionado = gestores.find((gestor) => gestor.user_id === dados.gestor)?.nome ?? "";
  const prioridadeClasses: Record<string, string> = {
    baixa: "border-input bg-muted text-foreground",
    média: "border-blue-300 bg-blue-50 text-blue-700",
    alta: "border-orange-300 bg-orange-50 text-orange-700",
    urgente: "border-red-300 bg-red-50 text-red-700",
  };

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card text-foreground sm:max-w-4xl [&_input]:border-input [&_input]:bg-background [&_input]:text-foreground [&_select]:border-input [&_select]:bg-background [&_select]:text-foreground [&_textarea]:border-input [&_textarea]:bg-background [&_textarea]:text-foreground [&_button[role=combobox]]:border-input [&_button[role=combobox]]:bg-background [&_button[role=combobox]]:text-foreground">
        <DialogHeader className="pr-7">
          <DialogTitle className="font-display text-2xl">{vagaParaEditar ? "Editar vaga" : "Abrir vaga"}</DialogTitle>
          <DialogDescription>Preencha a solicitação em quatro etapas. Os campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>

        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Etapas da solicitação">
          {ETAPAS.map((nome, indice) => (
            <li key={nome}>
              <button type="button" onClick={() => indice < etapa && setEtapa(indice)} className={cn("flex w-full items-center gap-2 rounded-lg border p-2 text-left text-xs", indice === etapa ? "border-amber-500 bg-amber-400/5 text-amber-600" : indice < etapa ? "border-amber-500/30 text-foreground" : "border-border text-muted-foreground")}>
                <span className="grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold">{indice < etapa ? <Check className="size-3.5" /> : indice + 1}</span>
                <span className="leading-tight">{nome}</span>
              </button>
            </li>
          ))}
        </ol>

        <form onSubmit={enviarSolicitacao}>
          <motion.div
            key={etapa}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="min-h-[24rem] py-5"
          >
            {etapa === 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Título do cargo" required error={erros["cargo"]} className="sm:col-span-2">
                  <Input value={dados.cargo} onChange={(event) => atualizar("cargo", event.target.value)} placeholder="Ex.: Analista de Dados" />
                </Campo>
                <Campo label="Setor/Departamento" required error={erros["setor"]}>
                  <select className={CLASSES_CONTROLE} value={dados.setor} onChange={(event) => { atualizar("setor", event.target.value); atualizar("gestor", ""); }}>
                    <option value="">Selecione um setor</option>
                    {setoresLista.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Campo>
                <Campo label="Gestor responsável">
                  <Select value={dados.gestor} onValueChange={(value) => atualizar("gestor", value)} disabled={carregandoGestores}>
                    <SelectTrigger aria-label="Gestor responsável">
                      <SelectValue placeholder={carregandoGestores ? "Carregando gestores..." : "Selecione um gestor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {gestores.map((gestor) => (
                        <SelectItem key={gestor.user_id} value={gestor.user_id}>
                          <span className="flex items-center gap-2.5">
                            <Avatar className="size-8 shrink-0">
                              <AvatarImage src={gestor.foto_url ?? undefined} alt={gestor.nome} />
                              <AvatarFallback className="bg-amber-100 text-xs font-semibold text-amber-600">{getIniciais(gestor.nome)}</AvatarFallback>
                            </Avatar>
                            <span className="min-w-0">
                              <span className="block truncate">{gestor.nome}</span>
                              <span className="block truncate text-xs text-muted-foreground">{gestor.cargo} · {gestor.setor_sigla}</span>
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                      {!carregandoGestores && gestores.length === 0 ? (
                        <SelectItem value="sem-gestores" disabled>Nenhum gestor cadastrado neste setor</SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                </Campo>
                <Campo label="Quantidade de vagas" required error={erros["quantidade"]}>
                  <Input type="number" min={1} step={1} value={dados.quantidade} disabled={Boolean(vagaParaEditar)} onChange={(event) => atualizar("quantidade", event.target.value)} />
                </Campo>
                <Campo label="Local de trabalho">
                  <Input value={dados.local} onChange={(event) => atualizar("local", event.target.value)} placeholder="Unidade ou cidade" />
                </Campo>
                <Campo label="Modalidade">
                  <select className={CLASSES_CONTROLE} value={dados.modalidade} onChange={(event) => atualizar("modalidade", event.target.value)}>
                    <option value="">Selecione</option><option>Presencial</option><option>Híbrido</option><option>Remoto</option>
                  </select>
                </Campo>
              </div>
            ) : null}

            {etapa === 1 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Motivo da abertura" required error={erros["motivo"]} className="sm:col-span-2">
                  <select className={CLASSES_CONTROLE} value={dados.motivo} onChange={(event) => atualizar("motivo", event.target.value)}>
                    <option value="">Selecione o motivo</option>{MOTIVOS_ABERTURA.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Campo>
                {substituicao ? (
                  <Campo label="Quem está sendo substituído?" required error={erros["substituido"]} className="sm:col-span-2">
                    <Input value={dados.substituido} onChange={(event) => atualizar("substituido", event.target.value)} />
                  </Campo>
                ) : null}
                {precisaJustificativa ? (
                  <Campo label="Justificativa" required error={erros["justificativa"]} className="sm:col-span-2">
                    <Textarea rows={3} value={dados.justificativa} onChange={(event) => atualizar("justificativa", event.target.value)} />
                  </Campo>
                ) : null}
                <Campo label="Tipo de contrato">
                  <select className={CLASSES_CONTROLE} value={dados.contrato} onChange={(event) => atualizar("contrato", event.target.value)}>
                    <option value="">Selecione</option>{["CLT", "PJ", "Estágio", "Temporário", "Aprendiz"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Campo>
                <Campo label="Jornada/horário">
                  <Input value={dados.jornada} onChange={(event) => atualizar("jornada", event.target.value)} placeholder="Ex.: Segunda a sexta, 9h às 18h" />
                </Campo>
                <Campo label="Faixa salarial mínima">
                  <Input inputMode="numeric" value={dados.salarioMinimo} onChange={(event) => atualizar("salarioMinimo", formatarEntradaMoeda(event.target.value))} placeholder="R$ 0,00" />
                </Campo>
                <Campo label="Faixa salarial máxima" error={erros["salarioMaximo"]}>
                  <Input inputMode="numeric" value={dados.salarioMaximo} onChange={(event) => atualizar("salarioMaximo", formatarEntradaMoeda(event.target.value))} placeholder="R$ 0,00" />
                </Campo>
                <fieldset className="grid gap-2 sm:col-span-2">
                  <legend className="mb-1 text-sm font-medium">Benefícios</legend>
                  <div className="flex flex-wrap gap-x-5 gap-y-3">
                    {BENEFICIOS.map((beneficio) => (
                      <label key={beneficio} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={dados.beneficios.includes(beneficio)} onCheckedChange={(checked) => atualizar("beneficios", checked ? [...dados.beneficios, beneficio] : dados.beneficios.filter((item) => item !== beneficio))} />
                        {beneficio}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {dados.beneficios.includes("Outros") ? (
                  <fieldset className="grid gap-2 sm:col-span-2">
                    <legend className="mb-1 text-sm font-medium">Outros benefícios</legend>
                    <div className="flex gap-2">
                      <Input value={dados.beneficioOutro} onChange={(event) => atualizar("beneficioOutro", event.target.value)} placeholder="Ex.: Gympass" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); adicionarBeneficioOutro(); } }} />
                      <Button type="button" variant="outline" size="icon" aria-label="Adicionar benefício" onClick={adicionarBeneficioOutro}><Plus className="size-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dados.beneficiosOutros.map((beneficio) => <span key={beneficio} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-600">{beneficio}<button type="button" aria-label={`Remover ${beneficio}`} onClick={() => atualizar("beneficiosOutros", dados.beneficiosOutros.filter((item) => item !== beneficio))}><X className="size-3" /></button></span>)}
                    </div>
                  </fieldset>
                ) : null}
                <Campo label="Data desejada para início">
                  <Input type="date" value={dados.dataInicio} onChange={(event) => atualizar("dataInicio", event.target.value)} />
                </Campo>
              </div>
            ) : null}

            {etapa === 2 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Escolaridade mínima">
                  <select className={CLASSES_CONTROLE} value={dados.escolaridade} onChange={(event) => atualizar("escolaridade", event.target.value)}>
                    <option value="">Selecione</option>{["Ensino fundamental", "Ensino médio", "Técnico", "Superior cursando", "Superior completo", "Pós-graduação"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Campo>
                <Campo label="Experiência necessária">
                  <select className={CLASSES_CONTROLE} value={dados.experiencia} onChange={(event) => atualizar("experiencia", event.target.value)}>
                    <option value="">Selecione</option>{["Sem experiência", "1–2 anos", "3–5 anos", "5+ anos"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Campo>
                <Campo label="Principais atividades e responsabilidades" className="sm:col-span-2">
                  <Textarea rows={3} value={dados.atividades} onChange={(event) => atualizar("atividades", event.target.value)} />
                </Campo>
                <Campo label="Requisitos obrigatórios" className="sm:col-span-2">
                  <Textarea rows={3} value={dados.obrigatorios} onChange={(event) => atualizar("obrigatorios", event.target.value)} />
                </Campo>
                <Campo label="Requisitos desejáveis" className="sm:col-span-2">
                  <Textarea rows={3} value={dados.desejaveis} onChange={(event) => atualizar("desejaveis", event.target.value)} />
                </Campo>
                <fieldset className="grid gap-2 sm:col-span-2">
                  <legend className="mb-1 text-sm font-medium">Habilidades comportamentais</legend>
                  <div className="flex gap-2">
                    <Input value={dados.habilidadeRascunho} onChange={(event) => setDados((atuais) => ({ ...atuais, habilidadeRascunho: event.target.value }))} placeholder="Ex.: Comunicação" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); adicionarHabilidade(); } }} />
                    <Button type="button" variant="outline" size="icon" aria-label="Adicionar habilidade" onClick={adicionarHabilidade}><Plus className="size-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dados.habilidades.map((habilidade) => <span key={habilidade} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-600">{habilidade}<button type="button" aria-label={`Remover ${habilidade}`} onClick={() => atualizar("habilidades", dados.habilidades.filter((item) => item !== habilidade))}><X className="size-3" /></button></span>)}
                  </div>
                </fieldset>
                <fieldset className="grid gap-4 sm:col-span-2">
                  <legend className="mb-1 text-sm font-medium">Perfil DISC desejável</legend>
                  <p className="-mt-2 text-xs text-muted-foreground">Ajuste os percentuais: ao mudar um, os outros se reajustam para a soma dar 100%.</p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {PERFIS_DISC.map((perfil) => (
                      <BarraPercentualDisc
                        key={perfil.valor}
                        perfil={perfil.valor}
                        valor={dados.disc[perfil.valor]}
                        predominante={dados.disc[perfil.valor] > LIMITE_PREDOMINANTE}
                        aoAplicar={(novo) => atualizar("disc", redistribuir(dados.disc, perfil.valor, novo))}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Total: {somaDisc}%</p>
                </fieldset>
                <div className="flex flex-wrap gap-x-6 gap-y-3 sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={dados.exigeCnh} onCheckedChange={(checked) => atualizar("exigeCnh", checked === true)} />Exige CNH</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={dados.viagens} onCheckedChange={(checked) => atualizar("viagens", checked === true)} />Disponibilidade para viagens</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={dados.exigeIdiomas} onCheckedChange={(checked) => atualizar("exigeIdiomas", checked === true)} />Exige idiomas</label>
                </div>
                {dados.exigeIdiomas ? (
                  <Campo label="Qual idioma?" className="sm:col-span-2">
                    <Input value={dados.idiomas} onChange={(event) => atualizar("idiomas", event.target.value)} placeholder="Ex.: Inglês avançado" />
                  </Campo>
                ) : null}
              </div>
            ) : null}

            {etapa === 3 ? (
              <div className="grid gap-5">
                <div>
                  <p className="mb-2 text-sm font-semibold">Prioridade</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {["baixa", "média", "alta", "urgente"].map((nivel) => (
                      <button key={nivel} type="button" onClick={() => atualizar("prioridade", nivel)} className={cn("rounded-lg border px-3 py-2 text-sm font-semibold capitalize", prioridadeClasses[nivel], dados.prioridade === nivel && "ring-2 ring-primary ring-offset-2")}>{nivel}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div><p className="text-sm font-medium">Vaga confidencial</p><p className="text-xs text-muted-foreground">Restringe a divulgação inicial da posição.</p></div>
                  <Switch checked={dados.confidencial} onCheckedChange={(checked) => atualizar("confidencial", checked)} aria-label="Vaga confidencial" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo label="Tipo de recrutamento">
                    <select className={CLASSES_CONTROLE} value={dados.recrutamento} onChange={(event) => atualizar("recrutamento", event.target.value)}>
                      <option value="">Selecione</option><option>Interno</option><option>Externo</option><option>Ambos</option>
                    </select>
                  </Campo>
                  <Campo label="Centro de custo">
                    <Input value={dados.centroCusto} onChange={(event) => atualizar("centroCusto", event.target.value)} />
                  </Campo>
                  <Campo label="Observações adicionais" className="sm:col-span-2">
                    <Textarea rows={3} value={dados.observacoes} onChange={(event) => atualizar("observacoes", event.target.value)} />
                  </Campo>
                </div>

                <div>
                  <input ref={inputArquivo} type="file" accept=".pdf,.doc,.docx,.odt" className="sr-only" onChange={(event) => aceitarArquivo(event.target.files?.[0])} />
                  <button type="button" onClick={() => inputArquivo.current?.click()} onDragOver={(event) => { event.preventDefault(); setArrastandoArquivo(true); }} onDragLeave={() => setArrastandoArquivo(false)} onDrop={soltarArquivo} className={cn("flex min-h-28 w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition-colors", arrastandoArquivo ? "border-amber-500 bg-amber-400/5" : "border-border hover:border-amber-500/50")}>
                    {dados.anexo ? <FileText className="mb-2 size-6 text-amber-600" aria-hidden /> : <Upload className="mb-2 size-6 text-muted-foreground" aria-hidden />}
                    <span className="text-sm font-medium">{dados.anexo ? dados.anexo.name : "Anexe a descrição do cargo"}</span>
                    <span className="mt-1 text-xs text-muted-foreground">Arraste o arquivo para cá ou clique para escolher · PDF, DOC ou DOCX</span>
                  </button>
                  {dados.anexo ? <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={() => atualizar("anexo", null)}>Remover anexo</Button> : null}
                </div>

                <div className="grid gap-3 border-t border-border pt-5">
                  <h3 className="font-display text-lg font-semibold">Resumo da solicitação</h3>
                  <CaixaResumo titulo="Informações básicas" etapa={0} onEditar={setEtapa}>
                    <LinhaResumo label="Cargo" value={dados.cargo} /><LinhaResumo label="Setor" value={dados.setor} />
                    <LinhaResumo label="Gestor responsável" value={nomeGestorSelecionado} /><LinhaResumo label="Quantidade" value={dados.quantidade} />
                    <LinhaResumo label="Local" value={dados.local} /><LinhaResumo label="Modalidade" value={dados.modalidade} />
                  </CaixaResumo>
                  <CaixaResumo titulo="Motivo e contratação" etapa={1} onEditar={setEtapa}>
                    <LinhaResumo label="Motivo" value={dados.motivo} />
                    <LinhaResumo label="Substituído/justificativa" value={dados.substituido || dados.justificativa} />
                    <LinhaResumo label="Contrato e jornada" value={[dados.contrato, dados.jornada].filter(Boolean).join(" · ")} />
                    <LinhaResumo label="Faixa salarial" value={[dados.salarioMinimo, dados.salarioMaximo].filter(Boolean).join(" – ")} />
                    <LinhaResumo label="Benefícios" value={[...dados.beneficios.filter((item) => item !== "Outros"), ...(dados.beneficios.includes("Outros") ? dados.beneficiosOutros : [])].filter(Boolean).join(", ")} />
                    <LinhaResumo label="Início desejado" value={dados.dataInicio} />
                  </CaixaResumo>
                  <CaixaResumo titulo="Perfil da vaga" etapa={2} onEditar={setEtapa}>
                    <LinhaResumo label="Escolaridade" value={dados.escolaridade} /><LinhaResumo label="Experiência" value={dados.experiencia} />
                    <LinhaResumo label="Atividades" value={dados.atividades} /><LinhaResumo label="Requisitos obrigatórios" value={dados.obrigatorios} />
                    <LinhaResumo label="Requisitos desejáveis" value={dados.desejaveis} /><LinhaResumo label="Habilidades" value={resumoValor(dados.habilidades)} /><LinhaResumo label="Perfil DISC desejável" value={ordenarPerfisDisc(dados.disc).map((item) => `${item.perfil} ${item.valor}%`).join(" · ")} />
                    <LinhaResumo label="CNH / viagens / idiomas" value={[dados.exigeCnh && "CNH", dados.viagens && "Viagens", dados.exigeIdiomas && dados.idiomas].filter(Boolean).join(" · ")} />
                  </CaixaResumo>
                  <CaixaResumo titulo="Controle" etapa={3} onEditar={setEtapa}>
                    <LinhaResumo label="Prioridade" value={dados.prioridade} /><LinhaResumo label="Confidencial" value={resumoValor(dados.confidencial)} />
                    <LinhaResumo label="Recrutamento" value={dados.recrutamento} /><LinhaResumo label="Centro de custo" value={dados.centroCusto} />
                    <LinhaResumo label="Observações" value={dados.observacoes} /><LinhaResumo label="Anexo" value={dados.anexo?.name ?? ""} />
                  </CaixaResumo>
                </div>
              </div>
            ) : null}
          </motion.div>

          <DialogFooter className="flex-row justify-between border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => etapa > 0 ? setEtapa((atual) => atual - 1) : fechar(false)}>
              {etapa > 0 ? <><ChevronLeft className="size-4" />Voltar</> : "Cancelar"}
            </Button>
            {etapa < ETAPAS.length - 1 ? (
              <Button type="button" onClick={avancar}>Continuar<ChevronRight className="size-4" /></Button>
            ) : (
              <Button type="submit">{vagaParaEditar ? "Salvar alterações" : "Enviar solicitação"}</Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
