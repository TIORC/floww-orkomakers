import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listarSetores } from "@/lib/cargos";
import { publicarComunicado } from "@/lib/emails.functions";

const CAMPO = "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-foreground";
type Tipo = "todos" | "departamento" | "unidade";

export function PublicarComunicadoDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const publicar = useServerFn(publicarComunicado);
  const queryClient = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState<Tipo>("todos");
  const [valores, setValores] = useState<string[]>([]);
  const [unidades, setUnidades] = useState("");
  const [destaque, setDestaque] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: listarSetores, enabled: aberto });

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const publicoValores =
      tipo === "departamento" ? valores : tipo === "unidade" ? unidades.split(",").map((u) => u.trim()).filter(Boolean) : [];
    if (tipo !== "todos" && publicoValores.length === 0) {
      toast.error("Escolha ao menos um público.");
      return;
    }
    setSalvando(true);
    try {
      const r = await publicar({ data: { titulo, mensagem, publicoTipo: tipo, publicoValores, destaque } });
      toast.success(`Comunicado publicado. E-mails enviados: ${r.enviados} · pulados: ${r.pulados} · falhas: ${r.erros}.`);
      await queryClient.invalidateQueries({ queryKey: ["comunicados"] });
      setTitulo("");
      setMensagem("");
      setValores([]);
      setUnidades("");
      onFechar();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível publicar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-panel-active bg-panel">
        <DialogHeader>
          <DialogTitle className="text-foreground">Publicar comunicado</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={salvar}>
          <label className="grid gap-1.5 text-sm font-semibold text-foreground">
            Título
            <Input required maxLength={200} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-foreground">
            Mensagem
            <Textarea required rows={5} maxLength={10000} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-foreground">
            Público
            <select value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)} className={CAMPO}>
              <option value="todos">Todos os colaboradores</option>
              <option value="departamento">Por departamento</option>
              <option value="unidade">Por unidade</option>
            </select>
          </label>
          {tipo === "departamento" ? (
            <div className="grid max-h-40 gap-1 overflow-y-auto text-sm text-foreground">
              {setores.map((s) => (
                <label key={s} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={valores.includes(s)}
                    onChange={(e) => setValores((v) => (e.target.checked ? [...v, s] : v.filter((x) => x !== s)))}
                  />
                  {s}
                </label>
              ))}
            </div>
          ) : null}
          {tipo === "unidade" ? (
            <label className="grid gap-1.5 text-sm font-semibold text-foreground">
              Unidades (separe por vírgula)
              <Input value={unidades} onChange={(e) => setUnidades(e.target.value)} placeholder="Ex.: Matriz, Filial SP" />
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={destaque} onChange={(e) => setDestaque(e.target.checked)} /> Em destaque
          </label>
          <Button type="submit" disabled={salvando} className="bg-brand text-slate-900 hover:bg-brand/90">
            {salvando ? "Publicando..." : "Publicar e enviar e-mails"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
