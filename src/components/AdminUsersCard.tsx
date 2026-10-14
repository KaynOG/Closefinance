import { appPrompt } from "@/lib/app-dialog";
import { useEffect, useState } from "react";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { ChevronDown, ChevronUp, Users, Search, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  id: string;
  name: string;
  email: string | null;
  license_kind: string;
  license_expires_at: string | null;
  created_at: string;
}

export function AdminUsersCard() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email, license_kind, license_expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data as Row[]) ?? []);
  }

  useEffect(() => { if (open) load(); }, [open]);

  async function setLicense(row: Row, kind: string, days?: number) {
    const patch =
      kind === "lifetime"
        ? { license_kind: "lifetime", license_expires_at: null }
        : {
            license_kind: kind,
            license_expires_at: new Date(Date.now() + (days ?? 30) * 86400000).toISOString(),
          };
    await supabase.from("profiles").update({ ...patch, license_started_at: row.created_at }).eq("id", row.id);
    setSavedId(row.id);
    setTimeout(() => setSavedId(null), 1500);
    load();
  }

  const filtered = rows.filter(r =>
    !q.trim() || `${r.name} ${r.email ?? ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle title="Admin · Controle de usuários" subtitle="Defina a licença de cada usuário" />
        <button
          onClick={() => setOpen(v => !v)}
          aria-label={open ? "Recolher" : "Expandir"}
          className="rounded-md p-1.5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
        >
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome ou e-mail"
              className="w-full rounded-md border border-border bg-transparent pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                <Users className="size-3.5" /> Nenhum usuário encontrado.
              </p>
            ) : filtered.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{r.name || "Sem nome"}</p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">
                    {r.email} · {r.license_kind === "lifetime"
                      ? "vitalícia"
                      : r.license_expires_at
                        ? `até ${new Date(r.license_expires_at).toLocaleDateString("pt-BR")}`
                        : "avaliação"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setLicense(r, "monthly", 30)} className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-white/5">Mensal</button>
                  <button onClick={() => setLicense(r, "lifetime")} className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-white/5">Vitalícia</button>
                  <button
                    onClick={async () => {
                      const v = await appPrompt("Quantos dias de acesso?", "90");
                      if (v && /^\d+$/.test(v)) setLicense(r, "custom", parseInt(v, 10));
                    }}
                    className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-white/5"
                  >
                    Dias…
                  </button>
                  {savedId === r.id && <Check className="size-3.5 text-primary" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
