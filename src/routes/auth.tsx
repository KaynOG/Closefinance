import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/Logo";
import { ArrowRight, Mail, Lock, User as UserIcon, Calendar as CalIcon, Briefcase, Target } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — CloseFinance" }, { name: "description", content: "Acesse sua conta CloseFinance e assuma o controle das suas finanças." }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [, api, user] = useStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", birthdate: "", job: "", yearlyGoal: "",
  });

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "login") {
      const r = api.login(form.email, form.password);
      if (!r.ok) setError(r.error);
      else navigate({ to: "/" });
    } else {
      if (!form.name.trim() || !form.email.trim() || form.password.length < 4) {
        setError("Preencha nome, e-mail e senha (mín. 4 caracteres).");
        return;
      }
      const r = api.signup({
        name: form.name, email: form.email, password: form.password,
        birthdate: form.birthdate || undefined, job: form.job || undefined,
        yearlyGoal: form.yearlyGoal ? parseFloat(form.yearlyGoal.replace(",", ".")) : undefined,
      });
      if (!r.ok) setError(r.error);
      else navigate({ to: "/" });
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-60" style={{ background: "var(--gradient-bg)" }} />
        <div className="absolute -top-32 -left-32 size-96 rounded-full blur-3xl opacity-30 bg-primary animate-pulse" />
        <div className="absolute bottom-0 right-0 size-96 rounded-full blur-3xl opacity-20 bg-secondary" />

        <div className="relative flex items-center gap-3 animate-in fade-in slide-in-from-top duration-500">
          <Logo size={56} />
          <div>
            <p className="font-display font-bold text-2xl">CloseFinance</p>
            <p className="font-mono text-xs text-muted-foreground">close your numbers</p>
          </div>
        </div>

        <div className="relative animate-in fade-in slide-in-from-left duration-700">
          <h1 className="text-5xl font-bold leading-tight">
            Feche o mês com <span className="text-gradient">clareza</span>.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-md">
            Controle gastos, ganhos e cartões. Aprenda. Cumpra missões diárias. Veja sua saúde financeira evoluir.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { v: "100%", l: "seus dados" },
              { v: "0 R$", l: "para começar" },
              { v: "+5", l: "telas conectadas" },
            ].map(s => (
              <div key={s.l} className="glass rounded-2xl p-4 text-center">
                <p className="font-display font-bold text-xl text-secondary">{s.v}</p>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative font-mono text-[11px] text-muted-foreground">© CloseFinance · armazenamento local seguro neste dispositivo</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Logo size={44} />
            <p className="font-display font-bold text-xl">CloseFinance</p>
          </div>

          <div className="glass-strong rounded-3xl p-6 lg:p-8">
            <div className="flex gap-1 p-1 rounded-2xl bg-white/5 mb-6">
              {(["login", "signup"] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${mode === m ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow-violet)]" : "text-muted-foreground hover:text-foreground"}`}>
                  {m === "login" ? "Entrar" : "Cadastrar"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <IconField icon={<UserIcon className="size-4" />} placeholder="Seu nome completo"
                  value={form.name} onChange={v => setForm({ ...form, name: v })} />
              )}
              <IconField icon={<Mail className="size-4" />} placeholder="E-mail" type="email"
                value={form.email} onChange={v => setForm({ ...form, email: v })} />
              <IconField icon={<Lock className="size-4" />} placeholder="Senha" type="password"
                value={form.password} onChange={v => setForm({ ...form, password: v })} />

              {mode === "signup" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground pt-2">Perfil</p>
                  <IconField icon={<CalIcon className="size-4" />} placeholder="Data de nascimento" type="date"
                    value={form.birthdate} onChange={v => setForm({ ...form, birthdate: v })} />
                  <IconField icon={<Briefcase className="size-4" />} placeholder="Emprego atual"
                    value={form.job} onChange={v => setForm({ ...form, job: v })} />
                  <IconField icon={<Target className="size-4" />} placeholder="Meta financeira anual (R$)"
                    value={form.yearlyGoal} onChange={v => setForm({ ...form, yearlyGoal: v })} inputMode="decimal" />
                </div>
              )}

              {error && <p className="text-sm text-[#FF8FA3] font-mono">{error}</p>}

              <button type="submit" className="w-full mt-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 active:scale-[0.98] transition-all duration-150 glow-violet flex items-center justify-center gap-2 group">
                {mode === "login" ? "Entrar" : "Criar conta"}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <p className="text-center text-xs font-mono text-muted-foreground mt-5">
              {mode === "login" ? "Novo por aqui? " : "Já tem conta? "}
              <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="text-secondary hover:underline">
                {mode === "login" ? "Crie sua conta" : "Entrar"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type IconFieldProps = {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};
function IconField({ icon, value, onChange, placeholder, type, inputMode }: IconFieldProps) {
  return (
    <label className="relative block">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        className="w-full rounded-xl bg-white/5 border border-border pl-10 pr-3 py-3 text-sm font-mono outline-none focus:border-primary focus:bg-white/10 transition"
      />
    </label>
  );
}
