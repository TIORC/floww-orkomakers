import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { criarFeedback } from "@/lib/emails.functions";
import { COMPETENCIAS_FEEDBACK } from "@/lib/feedbacks";
import { listarPessoasParaGestor } from "@/lib/organograma-dados";

const CAMPO = "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-foreground";
const NOTAS_VAZIAS: Record<string, string> = Object.fromEntries(COMPETENCIAS_FEEDBACK.map((c) => [c.id, ""]));

export function EnviarFeedbackDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const enviar = useServerFn(criarFeedback);
  const [destinatario, setDestinatario] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [notas, setNotas] = useState<Record<string, string>>(NOTAS_VAZIAS);
  const [salvando, setSalvando] = useState(false);
  const { data: pessoas = [] } = useQuery({ queryKey: ["pessoas-gestor"], queryFn: listarPessoasParaGestor, enabled: aberto });

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const r = await enviar({
        data: {
          destinatarioEmail: destinatario,
          mensagem,
          notas: {
            proatividadeAutonomia: Number(notas["proatividade-autonomia"]),
            confiabilidadeTransparencia: Number(notas["confiabilidade-transparencia"]),
            encantamentoCliente: Number(notas["encantamento-cliente"]),
            responsabilidadeProdutividade: Number(notas["responsabilidade-produtividade"]),
          },
        },
      });
      toast.success(r.email === "enviado" ? "Feedback enviado e destinatário avisado por e-mail." : "Feedback salvo (e-mail não enviado).");
      setDestinatario("");
      setMensagem("");
      setNotas(NOTAS_VAZIAS);
      onFechar();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="border-panel-active bg-panel">
        <DialogHeader>
          <DialogTitle className="text-foreground">Enviar feedback</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={salvar}>
          <label className="grid gap-1.5 text-sm font-semibold text-foreground">
            Para quem
            <select required value={destinatario} onChange={(e) => setDestinatario(e.target.value)} className={CAMPO}>
              <option value="">Selecione</option>
              {pessoas.map((p) => (
                <option key={p.email} value={p.email}>
                  {p.nome} ({p.email})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-foreground">
            Mensagem
            <Textarea required rows={5} maxLength={5000} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
          </label>
          <fieldset className="grid gap-3">
            <legend className="mb-1 text-sm font-semibold text-foreground">Avaliação (de 0 a 5)</legend>
            {COMPETENCIAS_FEEDBACK.map((competencia) => {
              return (
                <label key={competencia.id} className="grid gap-1.5 text-sm text-foreground">
                  {competencia.rotulo}
                  <select
                    required
                    value={notas[competencia.id]}
                    onChange={(e) => setNotas((n) => ({ ...n, [competencia.id]: e.target.value }))}
                    className={CAMPO}
                  >
                    <option value="">Selecione</option>
                    {[0, 1, 2, 3, 4, 5].map((nota) => (
                      <option key={nota} value={nota}>
                        {nota}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </fieldset>
          <Button type="submit" disabled={salvando} className="bg-brand text-slate-900 hover:bg-brand/90">
            {salvando ? "Enviando..." : "Enviar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
