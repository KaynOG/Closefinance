import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/Logo";
import bgLogin from "@/assets/bg-login.png.asset.json";
import { ArrowRight, Mail, Lock, User as UserIcon, Calendar as CalIcon, Briefcase, Target, Check, X, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — CloseFinance" }, { name: "description", content: "Acesse sua conta CloseFinance e assuma o controle das suas finanças." }] }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

interface PwScore {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  checks: { ok: boolean; text: string }[];
}

function scorePassword(p: string): PwScore {
  const checks = [
    { ok: p.length >= 8, text: "Mínimo de 8 caracteres" },
    { ok: /[a-z]/.test(p), text: "Letra minúscula" },
    { ok: /[A-Z]/.test(p), text: "Letra maiúscula" },
    { ok: /[0-9]/.test(p), text: "Número" },
    { ok: /[^A-Za-z0-9]/.test(p), text: "Caractere especial (!@#…)" },
  ];
  const passed = checks.filter(c => c.ok).length;
  let score: PwScore["score"] = 0;
  if (passed <= 1) score = 0;
  else if (passed === 2) score = 1;
  else if (passed === 3) score = 2;
  else if (passed === 4) score = 3;
  else score = 4;
  const labels = ["Muito fraca", "Fraca", "Média", "Forte", "Muito segura"];
  const colors = ["#FF4D6D", "#FF8FA3", "#FFCC00", "#22C3CC", "#2BD9A1"];
  return { score, label: labels[score], color: colors[score], checks };
}

function AuthPage() {
  const navigate = useNavigate();
  const [, api, user] = useStore();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [info, setInfo] = useState<{ link: string; email: string } | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", birthdate: "", job: "", yearlyGoal: "",
  });

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  const pw = useMemo(() => scorePassword(form.password), [form.password]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setInfo(null);
    if (mode === "login") {
      const r = await api.login(form.email, form.password);
      if (!r.ok) setError(r.error);
      else navigate({ to: "/" });
    } else if (mode === "signup") {
      if (!form.name.trim() || !form.email.trim()) {
        setError("Preencha nome e e-mail."); return;
      }
      if (pw.score < 2) { setError("Sua senha está fraca. Atinja pelo menos o nível Média."); return; }
      const r = await api.signup({
        name: form.name, email: form.email, password: form.password,
        birthdate: form.birthdate || undefined, job: form.job || undefined,
        yearlyGoal: form.yearlyGoal ? parseFloat(form.yearlyGoal.replace(",", ".")) : undefined,
      });
      if (!r.ok) setError(r.error);
      else navigate({ to: "/" });
    } else {
      const r = await api.requestPasswordReset(form.email);
      if (!r.ok) setError(r.error);
      else setInfo({ link: r.link, email: r.email });
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `url(${bgLogin.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-background/40" />

      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative animate-in fade-in slide-in-from-top duration-500">
          <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">CloseFinance</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">Bolso fechado, financeiro guardado</p>
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

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Logo size={44} />
            <div>
              <p className="font-display font-bold text-xl leading-none">CloseFinance</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-1">Bolso fechado, financeiro guardado</p>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6 lg:p-8">
            {mode !== "forgot" ? (
              <div className="flex gap-1 p-1 rounded-2xl bg-white/5 mb-6">
                {(["login", "signup"] as const).map(m => (
                  <button key={m} type="button" onClick={() => { setMode(m); setError(""); setInfo(null); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${mode === m ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow-violet)]" : "text-muted-foreground hover:text-foreground"}`}>
                    {m === "login" ? "Entrar" : "Cadastrar"}
                  </button>
                ))}
              </div>
            ) : (
              <button type="button" onClick={() => { setMode("login"); setError(""); setInfo(null); }} className="mb-5 flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-3.5" /> voltar
              </button>
            )}

            {mode === "forgot" && (
              <div className="mb-5">
                <h2 className="font-display font-bold text-xl flex items-center gap-2"><KeyRound className="size-5 text-secondary" /> Recuperar senha</h2>
                <p className="text-xs font-mono text-muted-foreground mt-1">Informe o e-mail da sua conta. Vamos gerar um link de redefinição.</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <IconField icon={<UserIcon className="size-4" />} placeholder="Seu nome completo"
                  value={form.name} onChange={v => setForm({ ...form, name: v })} />
              )}
              <IconField icon={<Mail className="size-4" />} placeholder="E-mail" type="email"
                value={form.email} onChange={v => setForm({ ...form, email: v })} />

              {mode !== "forgot" && (
                <div className="relative">
                  <IconField icon={<Lock className="size-4" />} placeholder="Senha" type={showPw ? "text" : "password"}
                    value={form.password} onChange={v => setForm({ ...form, password: v })} />
                  <button type="button" data-no-sound onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              )}

              {mode === "signup" && form.password.length > 0 && (
                <div className="rounded-xl bg-white/5 border border-border p-3 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Força da senha</span>
                    <span className="text-xs font-mono font-semibold" style={{ color: pw.color }}>{pw.label}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className="h-1.5 rounded-full transition-colors" style={{ background: i <= pw.score ? pw.color : "rgba(255,255,255,0.08)" }} />
                    ))}
                  </div>
                  <ul className="grid grid-cols-1 gap-1 mt-1">
                    {pw.checks.map((c, i) => (
                      <li key={i} className={`flex items-center gap-1.5 text-[11px] font-mono ${c.ok ? "text-[#7DF2C5]" : "text-muted-foreground"}`}>
                        {c.ok ? <Check className="size-3" /> : <X className="size-3" />} {c.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
              {info && (
                <div className="rounded-xl border border-[#2BD9A1]/30 bg-[#2BD9A1]/10 p-3 text-xs font-mono space-y-2">
                  <p className="text-[#7DF2C5]">Enviaremos as instruções para <strong>{info.email}</strong>.</p>
                  <p className="text-muted-foreground">Link de redefinição (válido por 30 min):</p>
                  <a href={info.link} className="block break-all text-secondary underline">{info.link}</a>
                  <p className="text-[10px] text-muted-foreground">Em produção este link é entregue diretamente no e-mail.</p>
                </div>
              )}

              <button type="submit" data-sound="success" className="w-full mt-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 active:scale-[0.98] transition-all duration-150 glow-violet flex items-center justify-center gap-2 group">
                {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Gerar link de redefinição"}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            {mode === "login" && (
              <div className="mt-4 text-center">
                <button type="button" onClick={() => { setMode("forgot"); setError(""); setInfo(null); }} className="text-xs font-mono text-secondary hover:underline">
                  Esqueci minha senha
                </button>
              </div>
            )}

            {mode !== "forgot" && (
              <p className="text-center text-xs font-mono text-muted-foreground mt-5">
                {mode === "login" ? "Novo por aqui? " : "Já tem conta? "}
                <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setInfo(null); }} className="text-secondary hover:underline">
                  {mode === "login" ? "Crie sua conta" : "Entrar"}
                </button>
              </p>
            )}
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
