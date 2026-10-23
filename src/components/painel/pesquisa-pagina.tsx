import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { cn } from "@/lib/utils";

// Modelo compartilhado das páginas de pesquisa (Satisfação, Rápida, Super, Engajamento, Desligamento e Riscos).
// Os selects de participantes e dimensões ficam sem opções até a integração com os dados.

const CAMPO =
  "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm font-normal text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand";
const AREA = `${CAMPO} h-auto py-2`;
const ROTULO = "grid gap-1.5 text-xs font-medium text-white/80";

const PARTICIPANTES = [
  { id: "papel", rotulo: "Papel", placeholder: "Selecione o papel" },
  { id: "unidades", rotulo: "Unidades", placeholder: "Selecione as unidades" },
  { id: "departamento", rotulo: "Departamento", placeholder: "Selecione o departamento" },
  { id: "grupos", rotulo: "Grupos", placeholder: "Selecione os grupos" },
] as const;

const TIPOS_PESQUISA = [
  { id: "anonima", rotulo: "Anônima", descricao: "não serão identificados os colaboradores." },
  {
    id: "identificada",
    rotulo: "Identificada",
    descricao: "os colaboradores serão identificados nas respostas.",
  },
] as const;

const TIPOS_RESPOSTA = [
  "Textos Curtos",
  "Textos Longos",
  "Alternativas escolha única",
  "Alternativas múltipla escolha",
  "Lista suspensa",
  "Escala numérica (0 a 10)",
  "Avaliação por estrelas",
  "Números",
  "Ranking",
];

type Pergunta = { id: number; dimensao: string; tipo: string };

function SelectVazio({ rotulo, placeholder }: { rotulo: string; placeholder: string }) {
  return (
    <label className={ROTULO}>
      {rotulo}
      <select aria-label={rotulo} defaultValue="" className={CAMPO}>
        <option value="" disabled>
          {placeholder}
        </option>
        <option disabled>Nenhuma opção disponível</option>
      </select>
    </label>
  );
}

function CardShell({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-panel-active bg-background p-6">
      <h2 className="font-display text-xl font-semibold text-white">{titulo}</h2>
      <p className="mt-1 text-sm text-white/80">{descricao}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function CardParticipantes({ nome }: { nome: string }) {
  const [dirEIndiretos, setDirEIndiretos] = useState({ diretos: false, indiretos: false });

  return (
    <CardShell
      titulo="Participantes"
      descricao={`Selecione os colaboradores que irão receber a ${nome}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PARTICIPANTES.map((campo) => (
          <SelectVazio key={campo.id} rotulo={campo.rotulo} placeholder={campo.placeholder} />
        ))}
        <label className={ROTULO}>
          Data admissão inicial
          <input type="date" className={CAMPO} />
        </label>
        <label className={ROTULO}>
          Data admissão final
          <input type="date" className={CAMPO} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectVazio rotulo="Lideranças" placeholder="Selecione as lideranças" />
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={dirEIndiretos.diretos}
            onChange={(evento) =>
              setDirEIndiretos((atual) => ({ ...atual, diretos: evento.target.checked }))
            }
            className="size-4 accent-[oklch(0.82_0.16_80)]"
          />
          Liderados diretos
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={dirEIndiretos.indiretos}
            onChange={(evento) =>
              setDirEIndiretos((atual) => ({ ...atual, indiretos: evento.target.checked }))
            }
            className="size-4 accent-[oklch(0.82_0.16_80)]"
          />
          Liderados indiretos
        </label>
      </div>

      <div className="space-y-3 border-t border-panel-active pt-5">
        <h3 className="text-sm font-semibold text-white">Outros Participantes</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectVazio rotulo="Colaboradores" placeholder="Selecione os colaboradores" />
        </div>
      </div>
    </CardShell>
  );
}

export function CardDetalhes({ nome, exemplo }: { nome: string; exemplo: string }) {
  const [titulo, setTitulo] = useState("");
  const [informacoes, setInformacoes] = useState("");
  const [tipo, setTipo] = useState("");
  const tipoSelecionado = TIPOS_PESQUISA.find((item) => item.id === tipo);

  return (
    <CardShell
      titulo="Detalhes da Pesquisa"
      descricao={`Descreva o tema, o contexto e as regras de encerramento da ${nome}.`}
    >
      <label className={ROTULO}>
        Título da Pesquisa
        <input
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value.slice(0, 5000))}
          placeholder={exemplo}
          className={CAMPO}
        />
        <span className="text-right font-normal">
          {titulo.length.toLocaleString("pt-BR")} / 5.000 caracteres
        </span>
      </label>

      <label className={ROTULO}>
        Informações sobre a pesquisa
        <textarea
          value={informacoes}
          onChange={(evento) => setInformacoes(evento.target.value.slice(0, 20000))}
          rows={6}
          placeholder="Explique o objetivo e as orientações para participação."
          className={AREA}
        />
        <span className="text-right font-normal">
          {informacoes.length.toLocaleString("pt-BR")} / 20.000 caracteres
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className={ROTULO}>
          Data de Encerramento
          <input type="date" className={CAMPO} />
        </label>

        <label className={ROTULO}>
          Tipo de Pesquisa
          <select
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value)}
            className={CAMPO}
          >
            <option value="" disabled>
              Selecione o tipo de pesquisa
            </option>
            {TIPOS_PESQUISA.map((item) => (
              <option key={item.id} value={item.id}>
                {item.rotulo}
              </option>
            ))}
          </select>
          {tipoSelecionado ? (
            <span className="font-normal text-white/70">
              {tipoSelecionado.rotulo} ({tipoSelecionado.descricao})
            </span>
          ) : null}
        </label>

        <label className={ROTULO}>
          Habilitar botão de voltar?
          <select defaultValue="" className={CAMPO}>
            <option value="" disabled>
              Selecione
            </option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </label>
      </div>
    </CardShell>
  );
}

export function CardPerguntas() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([{ id: 1, dimensao: "", tipo: "" }]);

  function atualizar(id: number, campo: "dimensao" | "tipo", valor: string) {
    setPerguntas((lista) =>
      lista.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)),
    );
  }

  function remover(id: number) {
    setPerguntas((lista) =>
      lista.filter((item) => item.id !== id).map((item, indice) => ({ ...item, id: indice + 1 })),
    );
  }

  function adicionar() {
    setPerguntas((lista) => [...lista, { id: lista.length + 1, dimensao: "", tipo: "" }]);
  }

  return (
    <CardShell
      titulo="Perguntas"
      descricao="Vincule cada pergunta a uma dimensão e defina o tipo de resposta esperado."
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-panel-active text-left text-xs font-semibold text-white/80">
              <th className="w-44 px-3 py-3">Dimensão</th>
              <th className="w-28 px-3 py-3">Pergunta #</th>
              <th className="px-3 py-3">Tipo de Resposta</th>
              <th className="w-14 px-3 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {perguntas.map((pergunta) => (
              <tr key={pergunta.id} className="border-b border-panel-active/60">
                <td className="px-3 py-3 align-middle">
                  <select
                    aria-label="Dimensão"
                    value={pergunta.dimensao}
                    onChange={(evento) => atualizar(pergunta.id, "dimensao", evento.target.value)}
                    className={CAMPO}
                  >
                    <option value="" disabled>
                      Selecione a dimensão
                    </option>
                    <option disabled>Nenhuma opção disponível</option>
                  </select>
                </td>
                <td className="px-3 py-3 align-middle font-display text-lg font-semibold text-white">
                  {pergunta.id}
                </td>
                <td className="px-3 py-3 align-middle">
                  <select
                    aria-label="Tipo de resposta"
                    value={pergunta.tipo}
                    onChange={(evento) => atualizar(pergunta.id, "tipo", evento.target.value)}
                    className={CAMPO}
                  >
                    <option value="" disabled>
                      Selecione o tipo de resposta
                    </option>
                    {TIPOS_RESPOSTA.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3 align-middle">
                  <button
                    type="button"
                    aria-label={`Remover pergunta ${pergunta.id}`}
                    disabled={perguntas.length === 1}
                    onClick={() => remover(pergunta.id)}
                    className="rounded-md p-2 text-white/80 transition hover:bg-panel-active hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={adicionar}
        className="inline-flex items-center gap-2 rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10"
      >
        <Plus className="size-4" aria-hidden />
        Adicionar pergunta
      </button>
    </CardShell>
  );
}

export function PaginaPesquisa({
  titulo,
  descricao,
  exemplo,
  relatorios,
}: {
  titulo: string;
  descricao: string;
  exemplo: string;
  relatorios?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <section
          className={cn("min-h-[34rem] rounded-2xl border border-panel-active bg-panel p-6 sm:p-8")}
        >
          <header>
            <h1 className="font-display text-3xl font-semibold text-white">{titulo}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">{descricao}</p>
          </header>

          <div className="mt-8 space-y-6">
            <CardParticipantes nome={titulo} />
            <CardDetalhes nome={titulo} exemplo={exemplo} />
            <CardPerguntas />
          </div>
        </section>

        {relatorios ? <div className="mt-6 space-y-6">{relatorios}</div> : null}
      </main>
    </div>
  );
}
