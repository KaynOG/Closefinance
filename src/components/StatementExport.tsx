import { useState } from "react";
import { FileDown } from "lucide-react";
import { useStore, formatBRL } from "@/lib/store";
import { notify } from "@/lib/notify";

type Mode = "expense" | "income" | "all";
type Period = "1" | "3" | "6" | "12" | "all" | "custom";

const PERIODS: { v: Period; label: string }[] = [
  { v: "1", label: "1 mês" },
  { v: "3", label: "3 meses" },
  { v: "6", label: "6 meses" },
  { v: "12", label: "1 ano" },
  { v: "all", label: "Todo o tempo" },
  { v: "custom", label: "Personalizado" },
];

const fmtD = (s: string) => new Date(s + "T00:00:00").toLocaleDateString("pt-BR");

const TITLES: Record<Mode, string> = {
  expense: "Extrato de Gastos",
  income: "Extrato de Ganhos",
  all: "Extrato de Transações",
};

export function StatementExport({ mode }: { mode: Mode }) {
  const [{ transactions, categories, cards }] = useStore();
  const [period, setPeriod] = useState<Period>("1");
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 8) + "01");
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (period === "custom" && (!from || !to || from > to)) { notify("Selecione um período válido (data inicial antes da final)."); return; }
    setBusy(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const now = new Date();
      const start = period === "all" || period === "custom" ? null : new Date(now.getFullYear(), now.getMonth() - (Number(period) - 1), 1);
      const todayStr = now.toISOString().slice(0, 10);
      const startStr = period === "custom" ? from : start ? start.toISOString().slice(0, 10) : "";
      const endStr = period === "custom" ? to : period === "all" ? "" : todayStr;
      const list = transactions
        .filter(t => (mode === "all" ? true : t.type === mode))
        .filter(t => !startStr || t.date >= startStr)
        .filter(t => !endStr || t.date <= endStr)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (list.length === 0) { notify("Nenhum lançamento no período selecionado."); return; }

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      doc.setFont("helvetica", "bold"); doc.setFontSize(18);
      doc.text(`CloseFinance — ${TITLES[mode]}`, 40, 50);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(110);
      const pLabel = period === "custom" ? `${fmtD(from)} até ${fmtD(to)}` : PERIODS.find(p => p.v === period)!.label;
      doc.text(`Período: ${pLabel}${start ? ` (desde ${start.toLocaleDateString("pt-BR")})` : ""} · Gerado em ${now.toLocaleDateString("pt-BR")}`, 40, 68);
      doc.setTextColor(0);

      const inc = list.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const exp = list.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const summary: string[][] = [];
      if (mode !== "expense") summary.push(["Total de ganhos", formatBRL(inc)]);
      if (mode !== "income") summary.push(["Total de gastos", formatBRL(exp)]);
      if (mode === "all") summary.push(["Saldo do período", formatBRL(inc - exp)]);
      summary.push(["Lançamentos", String(list.length)]);
      autoTable(doc, { startY: 82, body: summary, theme: "plain", styles: { fontSize: 10 }, columnStyles: { 1: { fontStyle: "bold", halign: "right" } }, tableWidth: 260 });

      // Group by month
      const groups = new Map<string, typeof list>();
      for (const t of list) {
        const k = t.date.slice(0, 7);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(t);
      }
      let y = (doc as any).lastAutoTable.finalY + 20;
      for (const [k, items] of groups) {
        const [yy, mm] = k.split("-").map(Number);
        const label = new Date(yy, mm - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        const mInc = items.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const mExp = items.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        if (y > 740) { doc.addPage(); y = 50; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(13);
        doc.text(label.charAt(0).toUpperCase() + label.slice(1), 40, y);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        const tot = mode === "income" ? `Ganhos: ${formatBRL(mInc)}` : mode === "expense" ? `Gastos: ${formatBRL(mExp)}` : `Ganhos ${formatBRL(mInc)} · Gastos ${formatBRL(mExp)} · Saldo ${formatBRL(mInc - mExp)}`;
        doc.text(tot, W - 40, y, { align: "right" });

        // Category breakdown
        const byCat = new Map<string, number>();
        for (const t of items) {
          const n = categories.find(c => c.id === t.categoryId)?.name ?? "Sem categoria";
          const key = mode === "all" ? `${t.type === "income" ? "Ganho" : "Gasto"} · ${n}` : n;
          byCat.set(key, (byCat.get(key) ?? 0) + t.amount);
        }
        autoTable(doc, {
          startY: y + 8,
          head: [["Classificação (categoria)", "Total"]],
          body: [...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([n, v]) => [n, formatBRL(v)]),
          styles: { fontSize: 8.5 }, headStyles: { fillColor: [60, 60, 70] },
          columnStyles: { 1: { halign: "right" } }, margin: { left: 40, right: 40 },
        });

        const head = ["Data", "Descrição", "Categoria", ...(mode === "all" ? ["Tipo"] : []), ...(mode !== "income" ? ["Classif.", "Cartão"] : []), "Valor"];
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 6,
          head: [head],
          body: items.map(t => {
            const cat = categories.find(c => c.id === t.categoryId)?.name ?? "Sem categoria";
            const card = cards.find(c => c.id === t.cardId)?.name ?? "—";
            const ess = t.type === "expense" ? (t.essential === "essential" ? "Essencial" : t.essential === "non_essential" ? "Não essencial" : "—") : "—";
            return [
              new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR"),
              (t.description || (t.type === "income" ? "Entrada" : "Gasto")).replace(/__\w+__:\S+/g, "").trim(),
              cat,
              ...(mode === "all" ? [t.type === "income" ? "Ganho" : "Gasto"] : []),
              ...(mode !== "income" ? [ess, t.type === "expense" ? card : "—"] : []),
              `${t.type === "income" ? "+" : "-"}${formatBRL(t.amount)}`,
            ];
          }),
          styles: { fontSize: 8 }, headStyles: { fillColor: [110, 60, 200] },
          columnStyles: { [head.length - 1]: { halign: "right" } }, margin: { left: 40, right: 40 },
        });
        y = (doc as any).lastAutoTable.finalY + 26;
      }

      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(140);
        doc.text(`Página ${i} de ${pages}`, W - 40, doc.internal.pageSize.getHeight() - 20, { align: "right" });
      }
      const slug = mode === "expense" ? "gastos" : mode === "income" ? "ganhos" : "transacoes";
      doc.save(`extrato-${slug}-${period === "all" ? "todo-tempo" : period === "custom" ? `${from}_a_${to}` : period + "m"}-${now.toISOString().slice(0, 10)}.pdf`);
      notify("Extrato em PDF gerado!");
    } finally {
      setBusy(false);
    }
  }

  const dateCls = "rounded-xl bg-white/5 border border-border px-2.5 py-1.5 text-xs font-mono outline-none focus:border-primary";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={period} onChange={e => setPeriod(e.target.value as Period)}
        className="rounded-xl bg-white/5 border border-border px-3 py-2 text-xs font-mono outline-none focus:border-primary">
        {PERIODS.map(p => <option key={p.v} value={p.v}>{p.label}</option>)}
      </select>
      {period === "custom" && (
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <input type="date" aria-label="Data inicial" value={from} max={to} onChange={e => setFrom(e.target.value)} className={dateCls} />
          <span className="text-muted-foreground">até</span>
          <input type="date" aria-label="Data final" value={to} min={from} onChange={e => setTo(e.target.value)} className={dateCls} />
        </div>
      )}
      <button type="button" onClick={generate} disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:opacity-90 transition disabled:opacity-50">
        <FileDown className="size-4" /> {busy ? "Gerando..." : "Extrato PDF"}
      </button>
    </div>
  );
}
