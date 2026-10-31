import { useState } from "react";
import { ArrowRight, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { projectPartialInstallment, type PartialInstallment } from "@/lib/partial-installment";
import { formatBRL, parseBRL, useStore } from "@/lib/store";
import { notify } from "@/lib/notify";

export function PartialInstallmentPayment({ kind, recordId, name, installmentId, installments }: {
  kind: "debt" | "receivable"; recordId: string; name: string; installmentId: string; installments: PartialInstallment[];
}) {
  const [, api] = useStore();
  const [step, setStep] = useState<"value" | "preview" | null>(null);
  const [value, setValue] = useState("");
  const [snapshot, setSnapshot] = useState<PartialInstallment[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = snapshot.find(row => row.id === installmentId);
  const debt = kind === "debt";
  const amount = parseBRL(value);
  const preview = step === "preview" ? projectPartialInstallment(snapshot, installmentId, amount) : null;
  function showPreview(event: React.FormEvent) {
    event.preventDefault();
    try { projectPartialInstallment(snapshot, installmentId, amount); setError(""); setStep("preview"); }
    catch (err) { setError(err instanceof Error ? err.message : "Confira o valor."); }
  }
  async function confirm() {
    if (busy || !preview) return;
    setBusy(true); setError("");
    try {
      await api.confirmPartialInstallment(kind, recordId, installmentId, preview.paidAmount, snapshot);
      setStep(null);
      notify(debt ? "Pagamento parcial registrado e parcelas reajustadas." : "Recebimento parcial registrado e parcelas reajustadas.");
    } catch { setError("Não foi possível confirmar. Feche e reabra a projeção para conferir as parcelas atualizadas."); }
    finally { setBusy(false); }
  }
  return <>
    <Button variant="outline" size="sm" className="mt-2 w-full text-xs" onClick={() => {
      setSnapshot(installments.map(row => ({ ...row })).sort((a, b) => a.number - b.number));
      setValue(""); setError(""); setStep("value");
    }}><HandCoins className="size-3.5" />{debt ? "Pagar parcialmente" : "Receber parcialmente"}</Button>
    <Dialog open={step !== null} onOpenChange={open => { if (!open) setStep(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === "preview" ? "Projeção das parcelas reajustadas" : debt ? "Pagar parcialmente a parcela" : "Receber parcialmente a parcela"}</DialogTitle>
          <DialogDescription>{name} · Parcela {selected?.number}</DialogDescription>
        </DialogHeader>
        {step === "value" ? <form onSubmit={showPreview} className="space-y-4">
          <p className="text-sm text-muted-foreground">Valor da parcela: <strong className="text-foreground">{formatBRL(selected?.amount ?? 0)}</strong></p>
          <label className="block text-sm">{debt ? "Valor pago (R$)" : "Valor recebido (R$)"}
            <input autoFocus required inputMode="decimal" value={value} onChange={event => setValue(event.target.value)} placeholder="0,00" className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" type="button" onClick={() => setStep(null)}>Cancelar</Button><Button type="submit">Ver projeção <ArrowRight /></Button></div>
        </form> : preview && <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 border-b border-border pb-4 text-sm">
            <div><dt className="text-muted-foreground">{debt ? "Pago agora" : "Recebido agora"}</dt><dd className="mt-1 font-mono font-semibold text-primary">{formatBRL(preview.paidAmount)}</dd></div>
            <div><dt className="text-muted-foreground">Saldo redistribuído</dt><dd className="mt-1 font-mono font-semibold">{formatBRL(preview.remainder)}</dd></div>
          </dl>
          <div className="max-h-[35dvh] overflow-y-auto">
            <table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th className="pb-2">Parcela / data</th><th className="pb-2 text-right">Antes</th><th className="pb-2 text-right">Após ajuste</th></tr></thead>
              <tbody>{preview.updates.map(row => <tr key={row.id} className="border-t border-border"><td className="py-3">{row.number} · {new Date(`${row.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}</td><td className="text-right font-mono">{formatBRL(row.previousAmount)}</td><td className="text-right font-mono text-primary">{formatBRL(row.amount)}</td></tr>)}
                {preview.extra && <tr className="border-t border-border"><td className="py-3">Nova {preview.extra.number} · {new Date(`${preview.extra.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}</td><td className="text-right">—</td><td className="text-right font-mono text-primary">{formatBRL(preview.extra.amount)}</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">{preview.extra ? "Sem parcelas seguintes pendentes, o saldo ficará em uma nova parcela no mês seguinte." : "O saldo foi dividido entre as parcelas seguintes pendentes, mantendo suas datas."} O total permanece igual. Somente o valor confirmado agora será lançado em {debt ? "Gastos" : "Ganhos"}; as demais parcelas continuam pendentes.</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => { setError(""); setStep("value"); }}>Voltar</Button><Button disabled={busy} onClick={confirm}>{busy ? "Confirmando…" : debt ? "Confirmar pagamento parcial" : "Confirmar recebimento parcial"}</Button></div>
        </div>}
      </DialogContent>
    </Dialog>
  </>;
}