import { useEffect, useState } from "react";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { Copy, Check, Plus, Trash2, ChevronDown, ChevronUp, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { formatCode } from "@/lib/license";

type Kind = "monthly" | "lifetime" | "custom";

interface KeyRow {
  id: string;
  code: string;
  kind: string;
  days: number | null;
  note: string | null;
  active: boolean;
  redeemed_by: string | null;
  redeemed_at: string | null;
  created_at: string;
}

export function AdminKeysCard() {
  const [, , user] = useStore();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<KeyRow[]>([]);
  const [kind, setKind] = useState<Kind>("monthly");
  const [days, setDays] = useState("30");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("access_keys")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setRows((data as KeyRow[]) ?? []);
  }

  useEffect(() => { if (open) load(); }, [open]);

  async function generate() {
    if (!user) return;
    setBusy(true);
    try {
      const { data: gen } = await supabase.rpc("gen_access_code");
      const code = String(gen ?? "");
      const payload = {
        code,
        kind,
        days: kind === "lifetime" ? null : Math.max(1, parseInt(days || "30", 10)),
        note: note.trim() || null,
        created_by: user.id,
      };
      const { error } = await supabase.from("access_keys").insert(payload);
      if (error) throw error;
      setNote("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await supabase.from("access_keys").delete().eq("id", id);
    load();
  }

  function copy(code: string) {
    navigator.clipboard?.writeText(formatCode(code));
    setCopied(code);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle title="Admin · Chaves de acesso" subtitle="Gere licenças mensais, vitalícias ou personalizadas" />
        <button
          onClick={() => setOpen(v => !v)}
          aria-label={open ? "Recolher" : "Expandir"}
          className="rounded-md p-1.5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
        >
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto]">
            <select
              value={kind}
              onChange={(e) => {
                const k = e.target.value as Kind;
                setKind(k);
                if (k === "monthly") setDays("30");
              }}
              className="rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="monthly">Mensal (30 dias)</option>
              <option value="lifetime">Vitalícia</option>
              <option value="custom">Personalizada</option>
            </select>
            <input
              value={kind === "lifetime" ? "∞" : days}
              disabled={kind === "lifetime"}
              onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))}
              placeholder="dias"
              className="w-full sm:w-24 rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono outline-none focus:border-primary disabled:opacity-50"
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Observação (opcional)"
              className="rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={generate}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="size-4" /> Gerar
            </button>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {rows.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono">Nenhuma chave gerada ainda.</p>
            ) : rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2">
                <Crown className={`size-3.5 shrink-0 ${r.kind === "lifetime" ? "text-primary" : "text-muted-foreground"}`} />
                <code className="font-mono text-xs tracking-wider break-all">{formatCode(r.code)}</code>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {r.kind === "lifetime" ? "vitalícia" : `${r.days} dias`}
                </span>
                <span className={`text-[10px] font-mono rounded px-1.5 py-0.5 border border-border ${r.redeemed_by ? "text-muted-foreground" : "text-primary"}`}>
                  {r.redeemed_by ? "usada" : "disponível"}
                </span>
                {r.note && <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">{r.note}</span>}
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => copy(r.code)} className="rounded-md p-1.5 hover:bg-white/10" aria-label="Copiar">
                    {copied === r.code ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                  </button>
                  <button onClick={() => remove(r.id)} className="rounded-md p-1.5 hover:bg-white/10 text-destructive" aria-label="Apagar">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
