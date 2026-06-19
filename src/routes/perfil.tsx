import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { useStore, type Gender } from "@/lib/store";
import { getRank } from "@/lib/ranks";
import { useEffect, useRef, useState } from "react";
import { Camera, Save, LogOut, User as UserIcon, Briefcase, Calendar as CalIcon, Target, CheckCircle2, DatabaseBackup, Venus, Mars, CircleDot, Lock, KeyRound, Volume2, VolumeX } from "lucide-react";
import { BackupContent } from "./backup";
import { isSoundEnabled, setSoundEnabled, playTone } from "@/lib/sound";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — CloseFinance" }, { name: "description", content: "Gerencie seu perfil, foto, dados e backup." }] }),
  component: PerfilPage,
});

function calcAge(birthdate?: string): number | null {
  if (!birthdate) return null;
  const b = new Date(birthdate + "T00:00:00");
  if (isNaN(b.getTime())) return null;
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}

function PerfilPage() {
  const [{ missions }, api, user] = useStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    birthdate: user?.birthdate ?? "",
    job: user?.job ?? "",
    yearlyGoal: user?.yearlyGoal ? String(user.yearlyGoal) : "",
    avatar: user?.avatar ?? "",
    gender: (user?.gender ?? "other") as Gender,
  });

  if (!user) return null;

  const rank = getRank(missions.totalPoints, form.gender);
  const RankIcon = rank.current.Icon;
  const age = calcAge(form.birthdate);

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { alert("Imagem muito grande (máx 2MB)"); return; }
    const r = new FileReader();
    r.onload = () => setForm(prev => ({ ...prev, avatar: String(r.result) }));
    r.readAsDataURL(f);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    api.updateProfile({
      name: form.name.trim(),
      birthdate: form.birthdate || undefined,
      job: form.job.trim() || undefined,
      yearlyGoal: form.yearlyGoal ? parseFloat(form.yearlyGoal.replace(",", ".")) : undefined,
      avatar: form.avatar || undefined,
      gender: form.gender,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Sua conta</p>
        <h1 className="text-3xl lg:text-4xl font-bold">Perfil</h1>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 mb-6">
        <GlassCard>
          <SectionTitle title="Foto de perfil" />
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="size-32 rounded-full overflow-hidden border-2 border-primary/50 bg-[image:var(--gradient-primary)] grid place-items-center text-4xl font-display font-bold">
                {form.avatar ? <img src={form.avatar} alt={form.name} className="size-full object-cover" /> : form.name.charAt(0).toUpperCase()}
              </div>
              {/* Rank badge ao lado do avatar */}
              <div className="absolute -right-3 -bottom-2 glass-strong rounded-2xl px-2.5 py-1.5 flex items-center gap-1.5 border" style={{ borderColor: rank.current.color + "66" }} title={rank.displayName}>
                <RankIcon className="size-4" style={{ color: rank.current.color }} />
                <span className="font-display text-[11px] font-bold" style={{ color: rank.current.color }}>{rank.displayName}</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickAvatar} className="sr-only" />
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()} className="rounded-xl bg-primary text-primary-foreground font-semibold px-4 py-2 text-sm flex items-center gap-2 glow-violet">
                <Camera className="size-4" /> Trocar foto
              </button>
              {form.avatar && (
                <button onClick={() => setForm({ ...form, avatar: "" })} className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-white/5">Remover</button>
              )}
            </div>
            <p className="text-[11px] font-mono text-muted-foreground text-center">PNG / JPG · até 2MB</p>
          </div>
          <div className="mt-6 pt-5 border-t border-border space-y-1.5 text-xs font-mono text-muted-foreground">
            <p>Conta criada em {new Date(user.createdAt).toLocaleDateString("pt-BR")}</p>
            <p>E-mail: <span className="text-foreground">{user.email}</span></p>
            {age !== null && <p>Idade: <span className="text-foreground">{age} anos</span></p>}
            <p>Pontos: <span className="text-foreground">{missions.totalPoints}</span></p>
          </div>
          <button onClick={() => { api.logout(); sessionStorage.removeItem("closefinance:greeting"); navigate({ to: "/auth" }); }} className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl border border-[#FF4D6D]/40 text-[#FF8FA3] py-2.5 text-sm hover:bg-[#FF4D6D]/10">
            <LogOut className="size-4" /> Sair da conta
          </button>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Dados pessoais" subtitle="atualize quando precisar" />
          <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nome completo" icon={<UserIcon className="size-4" />}>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={input} />
            </Field>
            <Field label="Data de nascimento" icon={<CalIcon className="size-4" />}>
              <input type="date" value={form.birthdate} onChange={e => setForm({ ...form, birthdate: e.target.value })} className={input} />
            </Field>
            <Field label="Emprego atual" icon={<Briefcase className="size-4" />}>
              <input value={form.job} onChange={e => setForm({ ...form, job: e.target.value })} placeholder="Ex: Designer" className={input} />
            </Field>
            <Field label="Meta financeira anual (R$)" icon={<Target className="size-4" />}>
              <input value={form.yearlyGoal} onChange={e => setForm({ ...form, yearlyGoal: e.target.value })} inputMode="decimal" placeholder="0,00" className={input} />
            </Field>

            <div className="md:col-span-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Gênero</span>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                <GenderBtn current={form.gender} value="male" label="Homem" icon={<Mars className="size-4" />} onClick={(v) => setForm({ ...form, gender: v })} />
                <GenderBtn current={form.gender} value="female" label="Mulher" icon={<Venus className="size-4" />} onClick={(v) => setForm({ ...form, gender: v })} />
                <GenderBtn current={form.gender} value="other" label="Prefiro não dizer" icon={<CircleDot className="size-4" />} onClick={(v) => setForm({ ...form, gender: v })} />
              </div>
              <p className="mt-2 text-[11px] font-mono text-muted-foreground">As patentes serão exibidas no gênero correspondente (ex.: Mestre / Mestra).</p>
            </div>

            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button type="submit" className="rounded-xl bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm flex items-center gap-2 glow-violet active:scale-[0.98] transition">
                <Save className="size-4" /> Salvar alterações
              </button>
              {saved && (
                <span className="text-sm text-[#7DF2C5] font-mono flex items-center gap-1.5 animate-in fade-in"><CheckCircle2 className="size-4" /> Perfil atualizado</span>
              )}
            </div>
          </form>
        </GlassCard>
      </section>

      <section className="mb-6">
        <SecurityPanel />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <DatabaseBackup className="size-5 text-secondary" />
          <h2 className="text-xl lg:text-2xl font-bold">Backup e restauração</h2>
        </div>
        <BackupContent />
      </section>
    </AppShell>
  );
}

function SecurityPanel() {
  const [, api, user] = useStore();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [resetMsg, setResetMsg] = useState<{ link: string; email: string } | null>(null);
  const [sound, setSound] = useState(true);
  useEffect(() => { setSound(isSoundEnabled()); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pw.next !== pw.confirm) { setMsg({ type: "err", text: "A confirmação não bate com a nova senha." }); return; }
    const r = await api.changePassword(pw.current, pw.next);
    if (!r.ok) { setMsg({ type: "err", text: r.error }); return; }
    setMsg({ type: "ok", text: "Senha alterada com sucesso." });
    setPw({ current: "", next: "", confirm: "" });
  }

  async function sendResetEmail() {
    if (!user) return;
    const r = await api.requestPasswordReset(user.email);
    if (r.ok) setResetMsg({ link: r.link, email: r.email });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <GlassCard>
        <SectionTitle title="Alterar senha" subtitle="mantenha sua conta segura" />
        <form onSubmit={submit} className="space-y-3">
          <Field label="Senha atual" icon={<Lock className="size-4" />}>
            <input type="password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} className={input} />
          </Field>
          <Field label="Nova senha" icon={<Lock className="size-4" />}>
            <input type="password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} className={input} />
          </Field>
          <Field label="Confirmar nova senha" icon={<Lock className="size-4" />}>
            <input type="password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} className={input} />
          </Field>
          {msg && (
            <p className={`text-sm font-mono ${msg.type === "ok" ? "text-[#7DF2C5]" : "text-[#FF8FA3]"}`}>{msg.text}</p>
          )}
          <button type="submit" data-sound="success" className="rounded-xl bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm flex items-center gap-2 glow-violet">
            <Save className="size-4" /> Salvar nova senha
          </button>
        </form>
      </GlassCard>

      <GlassCard>
        <SectionTitle title="Recuperação por e-mail" subtitle="enviamos um link de redefinição" />
        <p className="text-sm text-muted-foreground">
          Se você esquecer sua senha, podemos enviar um link de redefinição para <span className="text-foreground font-mono">{user?.email}</span>.
        </p>
        <button onClick={sendResetEmail} className="mt-4 rounded-xl border border-secondary/40 text-secondary px-4 py-2 text-sm flex items-center gap-2 hover:bg-secondary/10">
          <KeyRound className="size-4" /> Enviar link de redefinição
        </button>
        {resetMsg && (
          <div className="mt-4 rounded-xl border border-[#2BD9A1]/30 bg-[#2BD9A1]/10 p-3 text-xs font-mono space-y-2">
            <p className="text-[#7DF2C5]">Instruções enviadas para <strong>{resetMsg.email}</strong>.</p>
            <p className="text-muted-foreground">Link (válido por 30 min):</p>
            <a href={resetMsg.link} className="block break-all text-secondary underline">{resetMsg.link}</a>
            <p className="text-[10px] text-muted-foreground">Em produção, este link é entregue diretamente no e-mail. Ative o serviço de e-mail (Lovable Cloud) para envio automático.</p>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-border">
          <SectionTitle title="Sons da interface" subtitle="cliques e confirmações" />
          <button onClick={() => { const v = !sound; setSound(v); setSoundEnabled(v); if (v) playTone("success"); }}
            data-no-sound
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-mono transition ${sound ? "border-secondary/50 bg-secondary/10 text-secondary" : "border-border text-muted-foreground hover:bg-white/5"}`}>
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            {sound ? "Sons ativados" : "Sons desativados"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

const input = "w-full rounded-xl bg-white/5 border border-border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white/10 transition font-mono";

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="mt-1.5 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function GenderBtn({ current, value, label, icon, onClick }: { current: Gender; value: Gender; label: string; icon: React.ReactNode; onClick: (v: Gender) => void }) {
  const active = current === value;
  return (
    <button type="button" onClick={() => onClick(value)}
      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-mono transition ${active ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:bg-white/5"}`}>
      {icon}{label}
    </button>
  );
}
