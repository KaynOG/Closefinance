import { useEffect, useState } from "react";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { KeyRound, ChevronDown, ChevronUp, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  fetchLicense, redeemKey, formatCode, licenseLabel, dueDate, daysLeft, isAdmin,
  type LicenseInfo,
} from "@/lib/license";
import { AdminKeysCard } from "./AdminKeysCard";
import { AdminUsersCard } from "./AdminUsersCard";

export function LicenseCard() {
  const [, , user] = useStore();
  const [open, setOpen] = useState(false);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [admin, setAdmin] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchLicense(user.id).then(setLicense);
    isAdmin(user.id).then(setAdmin);
  }, [user?.id]);

  if (!user) return null;

  const due = dueDate(license, user.createdAt);
  const left = daysLeft(due);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !user) return;
    setBusy(true); setMsg(null);
    try {
      await redeemKey(code);
      const fresh = await fetchLicense(user.id);
      setLicense(fresh);
      setCode("");
      setMsg({ ok: true, text: "Chave ativada com sucesso!" });
      localStorage.removeItem("closefinance:licenseNotice");
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Erro ao validar chave." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <SectionTitle title="Licença & chave de acesso" subtitle="Ative seu plano com uma chave" />
          <button
            onClick={() => setOpen(v => !v)}
            aria-label={open ? "Recolher" : "Expandir"}
            className="rounded-md p-1.5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
          >
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1">
            <ShieldCheck className="size-3.5 text-primary" /> {licenseLabel(license)}
          </span>
          {license?.kind === "lifetime" ? (
            <span className="rounded-md border border-border px-2 py-1 text-primary">Acesso permanente</span>
          ) : due ? (
            <span className={`rounded-md border border-border px-2 py-1 ${left !== null && left <= 3 ? "text-destructive" : "text-muted-foreground"}`}>
              Vence em {due.toLocaleDateString("pt-BR")}
              {left !== null ? ` · ${left > 0 ? `${left} dia(s)` : "vencido"}` : ""}
            </span>
          ) : null}
        </div>

        {open && (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block text-xs text-muted-foreground">Inserir chave de acesso</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 min-w-0">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={code}
                  onChange={(e) => setCode(formatCode(e.target.value))}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full rounded-md border border-border bg-transparent pl-9 pr-3 py-2 text-sm font-mono tracking-wider outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Validando..." : "Ativar"}
              </button>
            </div>
            {msg && (
              <p className={`text-xs font-mono flex items-center gap-1.5 ${msg.ok ? "text-primary" : "text-destructive"}`}>
                {msg.ok ? <CheckCircle2 className="size-3.5" /> : null}{msg.text}
              </p>
            )}
          </form>
        )}
      </GlassCard>

      {admin && <AdminKeysCard />}
      {admin && <AdminUsersCard />}
    </div>
  );
}
