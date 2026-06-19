import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { useStore, formatBRL } from "@/lib/store";
import { useRef, useState } from "react";
import { Download, Upload, Database, ShieldCheck, FileJson, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/backup")({
  head: () => ({ meta: [{ title: "Backup — CloseFinance" }, { name: "description", content: "Exporte e importe seus dados financeiros para backup e restauração." }] }),
  component: BackupPage,
});

type Toast = { kind: "ok" | "err"; msg: string } | null;

function BackupPage() {
  const [{ transactions, categories, cards }, api] = useStore();
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [toast, setToast] = useState<Toast>(null);
  const [preview, setPreview] = useState<null | { transactions: number; categories: number; cards: number; raw: string }>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

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
      setPreview({
        transactions: (d.transactions ?? []).length,
        categories: (d.categories ?? []).length,
        cards: (d.cards ?? []).length,
        raw,
      });
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
        {/* Summary */}
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

        {/* Export */}
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

      {/* Import */}
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

        {preview && (
          <div className="mt-5 rounded-2xl glass-strong p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Pré-visualização</p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <Mini label="Transações" value={preview.transactions} />
              <Mini label="Categorias" value={preview.categories} />
              <Mini label="Cartões" value={preview.cards} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={confirmImport} className={`rounded-xl px-5 py-2.5 text-sm font-semibold active:scale-[0.98] transition flex items-center gap-2 ${mode === "replace" ? "bg-[#820432] text-white" : "bg-primary text-primary-foreground glow-violet"}`}>
                <Upload className="size-4" />
                {mode === "replace" ? "Substituir agora" : "Mesclar agora"}
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

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <p className="font-display font-bold text-2xl">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function ModeCard({ active, onClick, title, desc, danger }: { active: boolean; onClick: () => void; title: string; desc: string; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`text-left rounded-2xl p-4 border transition-all active:scale-[0.99] ${active ? (danger ? "border-[#820432] bg-[#820432]/10" : "border-primary bg-primary/10 shadow-[var(--shadow-glow-violet)]") : "border-border hover:bg-white/5"}`}>
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </button>
  );
}
