import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { useStore, formatBRL, type Transaction, type Category, type Card } from "@/lib/store";
import { useMemo, useRef, useState } from "react";
import {
  Download, Upload, Database, ShieldCheck, FileJson, CheckCircle2, AlertTriangle,
  ArrowDownCircle, ArrowUpCircle, CreditCard, Tags, Plus, RefreshCw, Minus,
} from "lucide-react";

export const Route = createFileRoute("/backup")({
  head: () => ({ meta: [{ title: "Backup — CloseFinance" }, { name: "description", content: "Exporte e importe seus dados financeiros para backup e restauração." }] }),
  component: BackupPage,
});

type Toast = { kind: "ok" | "err"; msg: string } | null;
type Status = "new" | "duplicate";

interface Preview {
  raw: string;
  fileName: string;
  exportedAt?: string;
  transactions: Array<Transaction & { _status: Status }>;
  categories: Array<Category & { _status: Status }>;
  cards: Array<Card & { _status: Status }>;
}

type TabKey = "transactions" | "categories" | "cards";

function BackupPage() {
  const [{ transactions, categories, cards }, api] = useStore();
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [toast, setToast] = useState<Toast>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [tab, setTab] = useState<TabKey>("transactions");
  const fileInput = useRef<HTMLInputElement>(null);

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const catMap = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach(c => m.set(c.id, c));
    preview?.categories.forEach(c => { if (!m.has(c.id)) m.set(c.id, c); });
    return m;
  }, [categories, preview]);

  const cardMap = useMemo(() => {
    const m = new Map<string, Card>();
    cards.forEach(c => m.set(c.id, c));
    preview?.cards.forEach(c => { if (!m.has(c.id)) m.set(c.id, c); });
    return m;
  }, [cards, preview]);

  function handleExport() {
    const json = api.exportData("user");
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url; a.download = `closefinance-backup-${stamp}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    setToast({ kind: "ok", msg: "Backup exportado com sucesso." });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const raw = await f.text();
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.app !== "CloseFinance") {
        setToast({ kind: "err", msg: "Arquivo não reconhecido. Use um backup .json gerado pelo CloseFinance." });
        setPreview(null);
        return;
      }
      const d = parsed.data ?? {};
      const txIds = new Set(transactions.map(x => x.id));
      const catIds = new Set(categories.map(x => x.id));
      const cardIds = new Set(cards.map(x => x.id));

      const incomingTx: Transaction[] = Array.isArray(d.transactions) ? d.transactions : [];
      const incomingCats: Category[] = Array.isArray(d.categories) ? d.categories : [];
      const incomingCards: Card[] = Array.isArray(d.cards) ? d.cards : [];

      setPreview({
        raw,
        fileName: f.name,
        exportedAt: parsed.exportedAt,
        transactions: incomingTx.map(t => ({ ...t, _status: txIds.has(t.id) ? "duplicate" : "new" })),
        categories: incomingCats.map(c => ({ ...c, _status: catIds.has(c.id) ? "duplicate" : "new" })),
        cards: incomingCards.map(c => ({ ...c, _status: cardIds.has(c.id) ? "duplicate" : "new" })),
      });
      setTab("transactions");
      setToast(null);
    } catch {
      setToast({ kind: "err", msg: "JSON inválido." });
      setPreview(null);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function confirmImport() {
    if (!preview) return;
    if (mode === "replace" && !confirm("Substituir TODOS os seus dados pelos do arquivo? Isso não pode ser desfeito.")) return;
    const r = api.importData(preview.raw, mode);
    if (r.ok) {
      setToast({ kind: "ok", msg: `Importação concluída: ${r.counts.transactions} transações, ${r.counts.categories} categorias, ${r.counts.cards} cartões.` });
      setPreview(null);
    } else {
      setToast({ kind: "err", msg: r.error });
    }
  }

  const counts = preview
    ? {
        transactions: preview.transactions.length,
        categories: preview.categories.length,
        cards: preview.cards.length,
        newTx: preview.transactions.filter(t => t._status === "new").length,
        newCat: preview.categories.filter(c => c._status === "new").length,
        newCard: preview.cards.filter(c => c._status === "new").length,
      }
    : null;

  return (
    <AppShell>
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Backup e restauração</p>
        <h1 className="text-3xl lg:text-4xl font-bold">Seus dados, <span className="text-gradient">portáteis</span>.</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">Exporte um arquivo <code className="font-mono text-secondary">.json</code> com tudo o que você cadastrou — ganhos, gastos, cartões e categorias — e restaure quando precisar.</p>
      </header>

      {toast && (
        <div className={`mb-6 rounded-2xl border p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.kind === "ok" ? "border-[#2BD9A1]/40 bg-[#2BD9A1]/10 text-[#7DF2C5]" : "border-[#FF4D6D]/40 bg-[#FF4D6D]/10 text-[#FF8FA3]"}`}>
          {toast.kind === "ok" ? <CheckCircle2 className="size-5 shrink-0 mt-0.5" /> : <AlertTriangle className="size-5 shrink-0 mt-0.5" />}
          <p className="text-sm">{toast.msg}</p>
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Database className="size-5 text-secondary" />
            <h3 className="font-semibold">O que está no seu cofre</h3>
          </div>
          <ul className="space-y-2 text-sm font-mono">
            <Row label="Transações" value={transactions.length.toString()} />
            <Row label="↳ Total recebido" value={formatBRL(totalIncome)} accent="#22C3CC" />
            <Row label="↳ Total gasto" value={formatBRL(totalExpense)} accent="#FF6B1A" />
            <Row label="Categorias" value={categories.length.toString()} />
            <Row label="Cartões" value={cards.length.toString()} />
          </ul>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Exportar backup" subtitle="baixe um arquivo .json com tudo" />
          <p className="text-sm text-muted-foreground mb-5">Guarde em um lugar seguro (drive, e-mail para si mesmo, pendrive). O arquivo é local — nada sai do seu dispositivo.</p>
          <button onClick={handleExport} className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 active:scale-[0.98] transition-all duration-150 glow-violet flex items-center justify-center gap-2 group">
            <Download className="size-4 transition-transform group-hover:translate-y-0.5" />
            Baixar closefinance-backup.json
          </button>
          <div className="mt-4 rounded-2xl bg-white/5 border border-border p-3 flex items-start gap-2">
            <ShieldCheck className="size-4 text-[#22C3CC] shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">A senha do seu cadastro <strong>não</strong> é incluída no backup.</p>
          </div>
        </GlassCard>
      </section>

      <GlassCard>
        <SectionTitle title="Importar / restaurar" subtitle="suba um arquivo .json gerado anteriormente" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <ModeCard active={mode === "merge"} onClick={() => setMode("merge")}
            title="Mesclar" desc="Mantém o que já existe e adiciona os itens novos do arquivo. Recomendado." />
          <ModeCard active={mode === "replace"} onClick={() => setMode("replace")}
            title="Substituir" desc="Apaga seus dados atuais e usa só o conteúdo do arquivo. Cuidado." danger />
        </div>

        <label className="block">
          <input ref={fileInput} type="file" accept="application/json,.json" onChange={handleFile} className="sr-only" />
          <div className="cursor-pointer rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-white/5 p-8 text-center transition-colors">
            <FileJson className="size-8 mx-auto text-muted-foreground" />
            <p className="mt-3 font-semibold">Clique para selecionar o arquivo .json</p>
            <p className="text-xs font-mono text-muted-foreground mt-1">closefinance-backup-*.json</p>
          </div>
        </label>

        {preview && counts && (
          <div className="mt-5 rounded-2xl glass-strong p-5 animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Pré-visualização do arquivo</p>
                <p className="font-display font-bold text-lg mt-1 truncate max-w-[60ch]">{preview.fileName}</p>
                {preview.exportedAt && (
                  <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                    Exportado em {new Date(preview.exportedAt).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Modo</p>
                <p className={`font-semibold ${mode === "replace" ? "text-[#FF8FA3]" : "text-[#7DF2C5]"}`}>
                  {mode === "replace" ? "Substituir tudo" : "Mesclar (novos apenas)"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Mini label="Transações" total={counts.transactions} fresh={counts.newTx} mode={mode} />
              <Mini label="Categorias" total={counts.categories} fresh={counts.newCat} mode={mode} />
              <Mini label="Cartões" total={counts.cards} fresh={counts.newCard} mode={mode} />
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
              <Tab active={tab === "transactions"} onClick={() => setTab("transactions")} icon={<ArrowDownCircle className="size-4" />} label="Transações" count={counts.transactions} />
              <Tab active={tab === "categories"} onClick={() => setTab("categories")} icon={<Tags className="size-4" />} label="Categorias" count={counts.categories} />
              <Tab active={tab === "cards"} onClick={() => setTab("cards")} icon={<CreditCard className="size-4" />} label="Cartões" count={counts.cards} />
            </div>

            <div className="max-h-96 overflow-y-auto rounded-xl border border-border bg-black/20">
              {tab === "transactions" && <TxList items={preview.transactions} catMap={catMap} cardMap={cardMap} />}
              {tab === "categories" && <CategoryList items={preview.categories} />}
              {tab === "cards" && <CardList items={preview.cards} />}
            </div>

            {mode === "merge" && (
              <p className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#2BD9A1]/15 text-[#7DF2C5] px-1.5 py-0.5"><Plus className="size-3" />novo</span>
                será adicionado.
                <span className="inline-flex items-center gap-1 rounded-md bg-white/10 text-muted-foreground px-1.5 py-0.5"><RefreshCw className="size-3" />duplicado</span>
                já existe — será ignorado.
              </p>
            )}
            {mode === "replace" && (
              <p className="text-xs text-[#FF8FA3] font-mono flex items-center gap-2">
                <AlertTriangle className="size-3.5" />
                Tudo o que está no cofre hoje será apagado e substituído pelos itens acima.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={confirmImport} className={`rounded-xl px-5 py-2.5 text-sm font-semibold active:scale-[0.98] transition flex items-center gap-2 ${mode === "replace" ? "bg-[#820432] text-white" : "bg-primary text-primary-foreground glow-violet"}`}>
                <Upload className="size-4" />
                {mode === "replace" ? `Substituir agora (${counts.transactions + counts.categories + counts.cards} itens)` : `Mesclar agora (${counts.newTx + counts.newCat + counts.newCard} novos)`}
              </button>
              <button onClick={() => setPreview(null)} className="rounded-xl border border-border px-5 py-2.5 text-sm hover:bg-white/5">Cancelar</button>
            </div>
          </div>
        )}
      </GlassCard>
    </AppShell>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <li className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span style={accent ? { color: accent } : undefined}>{value}</span>
    </li>
  );
}

function Mini({ label, total, fresh, mode }: { label: string; total: number; fresh: number; mode: "merge" | "replace" }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <p className="font-display font-bold text-2xl">{total}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
      {mode === "merge" && total > 0 && (
        <p className="font-mono text-[10px] mt-1 text-[#7DF2C5]">+{fresh} novos</p>
      )}
    </div>
  );
}

function Tab({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${active ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-muted-foreground"}`}>
      {icon}{label}
      <span className={`font-mono text-[10px] rounded px-1.5 py-0.5 ${active ? "bg-white/20" : "bg-white/5"}`}>{count}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "new") {
    return <span className="inline-flex items-center gap-1 rounded-md bg-[#2BD9A1]/15 text-[#7DF2C5] px-1.5 py-0.5 font-mono text-[10px]"><Plus className="size-3" />novo</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-md bg-white/10 text-muted-foreground px-1.5 py-0.5 font-mono text-[10px]"><RefreshCw className="size-3" />duplicado</span>;
}

function Empty({ label }: { label: string }) {
  return <p className="p-6 text-center text-sm text-muted-foreground font-mono">Nenhum(a) {label} no arquivo.</p>;
}

function TxList({ items, catMap, cardMap }: { items: Array<Transaction & { _status: Status }>; catMap: Map<string, Category>; cardMap: Map<string, Card> }) {
  if (!items.length) return <Empty label="transação" />;
  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <ul className="divide-y divide-border">
      {sorted.map(t => {
        const cat = t.categoryId ? catMap.get(t.categoryId) : undefined;
        const card = t.cardId ? cardMap.get(t.cardId) : undefined;
        const isIncome = t.type === "income";
        return (
          <li key={t.id} className="flex items-start gap-3 px-3 py-2.5 text-sm hover:bg-white/[0.03]">
            <div className={`mt-0.5 rounded-lg p-1.5 ${isIncome ? "bg-[#22C3CC]/15 text-[#22C3CC]" : "bg-[#FF6B1A]/15 text-[#FF6B1A]"}`}>
              {isIncome ? <ArrowUpCircle className="size-4" /> : <ArrowDownCircle className="size-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{t.description || <span className="text-muted-foreground italic">sem descrição</span>}</p>
                <StatusBadge status={t._status} />
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-mono text-muted-foreground">
                <span>{formatDate(t.date)}</span>
                {cat && <span className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: cat.color }} />{cat.name}</span>}
                {card && <span className="flex items-center gap-1"><CreditCard className="size-3" />{card.name}</span>}
                {t.essential && <span>{t.essential === "essential" ? "essencial" : "não essencial"}</span>}
                {t.tag && <span className="rounded bg-white/5 px-1.5 py-0.5">#{t.tag}</span>}
              </div>
            </div>
            <p className={`font-mono font-semibold ${isIncome ? "text-[#22C3CC]" : "text-[#FF6B1A]"}`}>
              {isIncome ? "+" : "−"}{formatBRL(t.amount)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function CategoryList({ items }: { items: Array<Category & { _status: Status }> }) {
  if (!items.length) return <Empty label="categoria" />;
  return (
    <ul className="divide-y divide-border">
      {items.map(c => (
        <li key={c.id} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/[0.03]">
          <span className="size-5 rounded-md shrink-0" style={{ background: c.color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{c.name}</p>
              <StatusBadge status={c._status} />
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              {c.kind === "income" ? "ganhos" : c.kind === "expense" ? "gastos" : "ambos"} · {c.color}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CardList({ items }: { items: Array<Card & { _status: Status }> }) {
  if (!items.length) return <Empty label="cartão" />;
  return (
    <ul className="divide-y divide-border">
      {items.map(c => (
        <li key={c.id} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/[0.03]">
          <span className="h-8 w-12 rounded-md shrink-0 border border-white/10" style={{ background: c.color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{c.name}</p>
              <StatusBadge status={c._status} />
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              limite {formatBRL(c.limit)} · fecha dia {c.closingDay} · vence dia {c.dueDay}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

// Re-export Minus to silence unused import warning during incremental edits
void Minus;

function ModeCard({ active, onClick, title, desc, danger }: { active: boolean; onClick: () => void; title: string; desc: string; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`text-left rounded-2xl p-4 border transition-all active:scale-[0.99] ${active ? (danger ? "border-[#820432] bg-[#820432]/10" : "border-primary bg-primary/10 shadow-[var(--shadow-glow-violet)]") : "border-border hover:bg-white/5"}`}>
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </button>
  );
}
