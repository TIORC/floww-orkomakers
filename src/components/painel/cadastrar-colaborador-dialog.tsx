import { Camera, User, X } from "lucide-react";

import { cn } from "@/lib/utils";

// Formulário de cadastro de colaborador. Sem persistência por enquanto: o envio chega da fonte real depois.

const CAMPO =
  "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand";
const ROTULO = "grid gap-1.5 text-sm font-semibold text-white";

function Obrigatorio() {
  return <span className="ml-0.5 text-destructive">*</span>;
}

export function CadastrarColaboradorDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cadastrar-colaborador-titulo"
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-panel-active bg-panel p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onFechar}
          className="absolute right-4 top-4 rounded-md p-1.5 text-white/80 transition hover:bg-panel-active hover:text-white"
        >
          <X className="size-5" aria-hidden />
        </button>

        <h2 id="cadastrar-colaborador-titulo" className="font-display text-xl font-semibold text-white">
          Cadastrar colaborador
        </h2>
        <p className="mt-1 text-sm text-white/80">
          Preencha os dados do novo colaborador. Campos com <span className="text-destructive">*</span> são obrigatórios.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[14rem_1fr]">
          <div className="grid content-start gap-3">
            <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-panel-active bg-background p-4 text-center">
              <User className="size-16 text-white/60" aria-hidden />
              <p className="text-xs text-white/80">Nenhuma foto selecionada</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10"
            >
              <Camera className="size-4" aria-hidden />
              Selecionar foto
            </button>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(evento) => evento.preventDefault()}>
            <label className={cn(ROTULO, "sm:col-span-2")}>
              Nome (nome que será exibido)
              <Obrigatorio />
              <input placeholder="Ex.: Maria Silva" className={CAMPO} />
            </label>
            <label className={cn(ROTULO, "sm:col-span-2")}>
              Nome Completo
              <Obrigatorio />
              <input placeholder="Ex.: Maria Silva Santos" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Matrícula (não obrigatório)
              <input placeholder="Ex.: 12345" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              E-mail
              <Obrigatorio />
              <input type="email" placeholder="Ex.: maria.silva@empresa.com" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              CPF
              <input placeholder="000.000.000-00" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Cargo
              <select defaultValue="" className={CAMPO}>
                <option value="" disabled>
                  Selecione um cargo
                </option>
              </select>
            </label>
            <label className={ROTULO}>
              Cargo visível
              <input placeholder="Ex.: Analista de Operações" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Unidade
              <input placeholder="Ex.: Matriz" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Departamento
              <input placeholder="Ex.: Operações" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Grupos
              <input placeholder="Ex.: Grupo A" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Papel
              <input placeholder="Ex.: Colaborador" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Gestor Direto
              <select defaultValue="" className={CAMPO}>
                <option value="" disabled>
                  Selecione um gestor
                </option>
              </select>
            </label>
            <label className={ROTULO}>
              Gestor Direto - E-mail
              <input type="email" placeholder="Ex.: joao.souza@empresa.com" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Etnia
              <input placeholder="Ex.: Branca" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Sexo
              <input placeholder="Ex.: Feminino" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Gênero
              <input placeholder="Ex.: Mulher" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Data de Nascimento
              <input type="date" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Data de Admissão
              <input type="date" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Situação
              <input defaultValue="Ativo" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Origem
              <input defaultValue="Manual" className={CAMPO} />
            </label>

            <fieldset className="grid gap-2 sm:col-span-2">
              <legend className="text-sm font-semibold text-white">Participa da gamificação?</legend>
              <div className="flex gap-6 text-sm text-white">
                <label className="flex items-center gap-2">
                  <input type="radio" name="gamificacao" value="sim" className="accent-[oklch(0.82_0.16_80)]" />
                  Sim
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="gamificacao" value="nao" defaultChecked className="accent-[oklch(0.82_0.16_80)]" />
                  Não
                </label>
              </div>
            </fieldset>

            <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
              <button
                type="button"
                onClick={onFechar}
                className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
              >
                Cadastrar colaborador
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
