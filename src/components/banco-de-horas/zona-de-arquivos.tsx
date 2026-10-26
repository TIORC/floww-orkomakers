import { useState, type DragEvent } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

type Props = {
  arquivos: File[];
  aoEscolher: (arquivos: File[]) => void;
  desabilitado?: boolean;
};

function ehPdf(arquivo: File) {
  return arquivo.type === "application/pdf" || arquivo.name.toLowerCase().endsWith(".pdf");
}

// Área para escolher PDFs clicando ou arrastando os arquivos para dentro dela. Só PDFs entram na seleção.
export function ZonaDeArquivos({ arquivos, aoEscolher, desabilitado = false }: Props) {
  const [arrastando, setArrastando] = useState(false);

  function escolher(recebidos: File[]) {
    const pdfs = recebidos.filter(ehPdf);
    const ignorados = recebidos.length - pdfs.length;
    if (ignorados > 0) {
      toast.error(
        ignorados === 1
          ? "Um arquivo foi ignorado: só PDFs são aceitos."
          : `${ignorados} arquivos foram ignorados: só PDFs são aceitos.`,
      );
    }
    if (pdfs.length > 0) aoEscolher(pdfs);
  }

  function aoArrastarSobre(evento: DragEvent<HTMLLabelElement>) {
    // Sem o preventDefault o navegador não deixa soltar o arquivo aqui (e abriria o PDF em outra aba).
    evento.preventDefault();
    if (!desabilitado) setArrastando(true);
  }

  function aoSairDoArraste(evento: DragEvent<HTMLLabelElement>) {
    // Passar por cima do ícone ou do texto dispara dragleave; só vale quando o mouse sai da área de fato.
    if (evento.currentTarget.contains(evento.relatedTarget as Node | null)) return;
    setArrastando(false);
  }

  function aoSoltar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    setArrastando(false);
    if (desabilitado) return;
    escolher(Array.from(evento.dataTransfer.files));
  }

  return (
    <div className="grid gap-2">
      <label htmlFor="espelho-ponto" className="text-sm font-semibold text-white">
        Espelhos de ponto (PDF)
      </label>
      <label
        htmlFor="espelho-ponto"
        onDragEnter={aoArrastarSobre}
        onDragOver={aoArrastarSobre}
        onDragLeave={aoSairDoArraste}
        onDrop={aoSoltar}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-background px-4 py-6 text-sm transition",
          arrastando
            ? "border-brand bg-brand/10 text-white"
            : "border-panel-active text-white/80 hover:border-brand hover:text-white",
        )}
      >
        <FileText className="size-5 shrink-0 text-brand" aria-hidden />
        <span className="min-w-0 truncate">
          {arrastando
            ? "Solte os arquivos aqui"
            : arquivos.length === 0
              ? "Arraste os PDFs do espelho de ponto para cá ou clique para escolher"
              : arquivos.length === 1
                ? arquivos[0]?.name
                : `${arquivos.length} arquivos selecionados`}
        </span>
      </label>
      <input
        id="espelho-ponto"
        type="file"
        multiple
        accept=".pdf,application/pdf"
        className="sr-only"
        disabled={desabilitado}
        onChange={(evento) => escolher(Array.from(evento.target.files ?? []))}
      />
    </div>
  );
}
