import type { LinhaHistorico } from "@/lib/turnover";

const CELULA = "border border-panel-active px-3 py-2 text-sm text-white";

// Tabela no formato de planilha, com cabeçalho fixo e rolagem interna.
export function CardHistoricoDesligamentos({ linhas }: { linhas: LinhaHistorico[] }) {
  return (
    <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold text-white">Histórico de Desligamentos</h2>
      <p className="mt-1 text-sm text-white/80">
        Todos os colaboradores desligados, com setor, cargo e motivo.
      </p>

      {linhas.length === 0 ? (
        <p className="mt-6 text-sm text-white/80">Nenhum desligamento registrado.</p>
      ) : (
        <div className="mt-6 max-h-[28rem] overflow-auto rounded-lg border border-panel-active">
          <table className="w-full min-w-[720px] border-collapse">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-white/80">
                <th className="border border-panel-active px-3 py-2">Nome Completo</th>
                <th className="border border-panel-active px-3 py-2">Setor</th>
                <th className="border border-panel-active px-3 py-2">Cargo</th>
                <th className="border border-panel-active px-3 py-2">Motivo do Desligamento</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha, indice) => (
                <tr key={`${linha.nome}-${indice}`} className="odd:bg-background/40">
                  <td className={CELULA}>{linha.nome}</td>
                  <td className={CELULA}>{linha.setor}</td>
                  <td className={CELULA}>{linha.cargo}</td>
                  <td className={CELULA}>{linha.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
