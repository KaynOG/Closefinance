import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
      { name: "description", content: "Redefina a senha da sua conta CloseFinance com segurança." },
      { property: "og:title", content: "Redefinir senha — CloseFinance" },
      { property: "og:description", content: "Redefina a senha da sua conta CloseFinance com segurança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Redefinir senha — CloseFinance" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState({ a: "", b: "" });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pw.a.length < 8) { setMsg({ type: "err", text: "A senha deve ter ao menos 8 caracteres." }); return; }
    if (pw.a !== pw.b) { setMsg({ type: "err", text: "As senhas não coincidem." }); return; }
    const { error } = await supabase.auth.updateUser({ password: pw.a });
    if (error) { setMsg({ type: "err", text: error.message }); return; }
    setDone(true);
    setTimeout(() => navigate({ to: "/" }), 1800);
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md glass-strong rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3 mb-6">
          <Logo size={42} />
          <div>
            <p className="font-display font-bold text-lg leading-none">CloseFinance</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">Redefinir senha</p>
          </div>
        </div>
        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="size-12 mx-auto text-[#2BD9A1]" />
            <p className="mt-3 text-sm font-mono">Senha redefinida! Redirecionando…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock className="size-4" /></span>
              <input type="password" placeholder="Nova senha" value={pw.a} onChange={e => setPw({ ...pw, a: e.target.value })}
                className="w-full rounded-xl bg-white/5 border border-border pl-10 pr-3 py-3 text-sm font-mono outline-none focus:border-primary" />
            </label>
            <label className="block relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock className="size-4" /></span>
              <input type="password" placeholder="Confirmar nova senha" value={pw.b} onChange={e => setPw({ ...pw, b: e.target.value })}
                className="w-full rounded-xl bg-white/5 border border-border pl-10 pr-3 py-3 text-sm font-mono outline-none focus:border-primary" />
            </label>
            {msg && <p className={`text-sm font-mono ${msg.type === "ok" ? "text-[#7DF2C5]" : "text-[#FF8FA3]"}`}>{msg.text}</p>}
            <button type="submit" data-sound="success" className="w-full mt-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 active:scale-[0.98] glow-violet flex items-center justify-center gap-2">
              Salvar nova senha <ArrowRight className="size-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
