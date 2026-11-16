import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enviarBannerHome } from "@/lib/home-banners.functions";

const TIPOS = ["image/jpeg", "image/png", "image/webp"] as const;
type Tipo = (typeof TIPOS)[number];
const LIMITE_BYTES = 5 * 1024 * 1024;

type Previa = { arquivo: File; url: string; largura: number; altura: number };

function lerComoBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result).split(",")[1] ?? "");
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.readAsDataURL(arquivo);
  });
}

type Props = {
  aberto: boolean;
  onFechar: () => void;
};

// Diálogo do botão "Carregar Mídia": envia um banner novo para a tela inicial, sem precisar de código.
export function CarregarMidiaDialog({ aberto, onFechar }: Props) {
  const queryClient = useQueryClient();
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [alt, setAlt] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Libera a URL temporária da prévia quando ela é trocada ou o diálogo é desmontado.
  useEffect(() => {
    return () => {
      if (previa) URL.revokeObjectURL(previa.url);
    };
  }, [previa]);

  function fechar() {
    setPrevia(null);
    setAlt("");
    onFechar();
  }

  function escolherArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    if (!TIPOS.includes(arquivo.type as Tipo)) {
      toast.error("Use uma imagem em JPG, PNG ou WebP.");
      return;
    }
    if (arquivo.size > LIMITE_BYTES) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      return;
    }

    // Lê as dimensões reais da imagem, que vão junto com o banner para a caixa do carrossel.
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();
    imagem.onload = () =>
      setPrevia({ arquivo, url, largura: imagem.naturalWidth, altura: imagem.naturalHeight });
    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error("Não foi possível ler a imagem.");
    };
    imagem.src = url;
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!previa) return;
    setEnviando(true);
    try {
      const base64 = await lerComoBase64(previa.arquivo);
      await enviarBannerHome({
        data: {
          tipo: previa.arquivo.type as Tipo,
          base64,
          alt,
          largura: previa.largura,
          altura: previa.altura,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["home-banners"] });
      toast.success("Banner enviado.");
      fechar();
    } catch (erro) {
      console.error("Falha ao enviar o banner da tela inicial:", erro);
      // Erro fica na tela por mais tempo, para dar para ler a mensagem.
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar o banner.", {
        duration: 15000,
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        if (!valor) fechar();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Carregar mídia</DialogTitle>
          <DialogDescription>
            Envie um banner novo para a tela inicial. Ele entra no carrossel junto com o banner
            atual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="arquivo-banner">Imagem do banner</Label>
            <Input
              id="arquivo-banner"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={escolherArquivo}
              disabled={enviando}
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WebP, até 5 MB. Use a mesma proporção do banner atual (cerca de 4,3:1)
              para ele ficar bem enquadrado.
            </p>
          </div>

          {previa ? (
            <div className="overflow-hidden rounded-xl border border-panel-active bg-[#0a1a3f]">
              <img
                src={previa.url}
                alt="Prévia do banner"
                className="max-h-64 w-full object-contain"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="alt-banner">Texto alternativo (opcional)</Label>
            <Input
              id="alt-banner"
              value={alt}
              onChange={(evento) => setAlt(evento.target.value)}
              maxLength={300}
              placeholder="Descreva a imagem para quem usa leitor de tela"
              disabled={enviando}
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={fechar}
              disabled={enviando}
              className="inline-flex items-center justify-center rounded-full border border-panel-active px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-panel-active disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!previa || enviando}
              className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? "Enviando..." : "Enviar banner"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
