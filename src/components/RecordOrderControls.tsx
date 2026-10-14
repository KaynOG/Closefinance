import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecordOrder } from "@/lib/record-order";

export function useRecordOrder(userId: string | null, kind: "debts" | "receivables") {
  const key = `cf_record_order_${kind}_${userId ?? "anon"}`;
  const [order, setOrder] = useState<RecordOrder>("oldest");
  useEffect(() => {
    const stored = localStorage.getItem(key);
    setOrder(stored === "newest" || stored === "custom" ? stored : "oldest");
  }, [key]);
  return [order, (next: RecordOrder) => {
    setOrder(next);
    localStorage.setItem(key, next);
  }] as const;
}

export function RecordOrderControls({ value, onChange }: { value: RecordOrder; onChange: (value: RecordOrder) => void }) {
  return (
    <label className="mb-4 flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
      <ArrowUpDown className="size-4" /> Ordenar por
      <select aria-label="Ordenar por" value={value} onChange={event => onChange(event.target.value as RecordOrder)}
        className="min-w-0 max-w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <option value="oldest">Cadastro: mais antigo primeiro</option>
        <option value="newest">Cadastro: mais recente primeiro</option>
        <option value="custom">Minha ordem</option>
      </select>
    </label>
  );
}

export function RecordMoveButtons({ name, first, last, busy, onMove }: { name: string; first: boolean; last: boolean; busy: boolean; onMove: (direction: -1 | 1) => void }) {
  return (
    <div className="mb-2 flex justify-end gap-1">
      <Button variant="outline" size="icon" disabled={first || busy} onClick={() => onMove(-1)} title={`Mover ${name} para cima`} aria-label={`Mover ${name} para cima`}><ArrowUp /></Button>
      <Button variant="outline" size="icon" disabled={last || busy} onClick={() => onMove(1)} title={`Mover ${name} para baixo`} aria-label={`Mover ${name} para baixo`}><ArrowDown /></Button>
    </div>
  );
}