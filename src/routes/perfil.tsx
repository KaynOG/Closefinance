import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { useStore, type Gender } from "@/lib/store";
import { getRank } from "@/lib/ranks";
import { useEffect, useRef, useState } from "react";
import { Camera, Save, LogOut, User as UserIcon, Briefcase, Calendar as CalIcon, Target, CheckCircle2, DatabaseBackup, Venus, Mars, CircleDot, Lock, KeyRound, Volume2, VolumeX, Palette, LifeBuoy, MessageCircle, Mail, Bell, BellOff, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import { BackupContent } from "./backup";
import { isSoundEnabled, setSoundEnabled, playTone } from "@/lib/sound";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ACCENTS, getAccent, setAccent, onAccentChange, type Accent } from "@/lib/theme";
import { arePopupsEnabled, setPopupsEnabled, notify } from "@/lib/notify";
import { areTutorialsEnabled, setTutorialsEnabled } from "@/lib/tutorials";
import { BACKGROUNDS, getBackgroundId, setBackgroundId, onBackgroundChange } from "@/lib/backgrounds";


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
        <h1 className="text-3xl lg:text-4xl font-bold">Perfil & Ajustes</h1>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 mb-6">
        <GlassCard hideKey="perfil-1" hideLabel="Foto de perfil">
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
          <button onClick={async () => { await api.logout(); sessionStorage.removeItem("closefinance:greeting"); navigate({ to: "/auth" }); }} className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl border border-[#FF4D6D]/40 text-[#FF8FA3] py-2.5 text-sm hover:bg-[#FF4D6D]/10">
            <LogOut className="size-4" /> Sair da conta
          </button>
        </GlassCard>

        <GlassCard hideKey="perfil-2" hideLabel="Dados pessoais">
          <SectionTitle title="Dados pessoais" subtitle="atualize quando precisar" />
          <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nome completo" icon={<UserIcon className="size-4" />}>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={input} />
            </Field>
            <Field label="Data de nascimento" icon={<CalIcon className="size-4" />}>
              <input type="date" value={form.birthdate} onChange={e => setForm({ ...form, birthdate: e.target.value })} className={input} />
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

      <section className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <LifeBuoy className="size-5 text-secondary" />
          <h2 className="text-xl lg:text-2xl font-bold">Suporte</h2>
        </div>
        <SupportPanel />
      </section>

      <section>
        <BackupCollapsible />
      </section>
    </AppShell>
  );
}

function BackupCollapsible() {
  const [open, setOpen] = useState(false);
  return (
    <GlassCard hideKey="perfil-backup" hideLabel="Backup e restauração">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg grid place-items-center bg-secondary/15 text-secondary"><DatabaseBackup className="size-4" /></div>
          <h2 className="text-base font-semibold">Backup e restauração</h2>
        </div>
        <button onClick={() => setOpen(o => !o)} aria-label={open ? "Recolher" : "Expandir"}
          className="rounded-lg border border-border p-1.5 hover:bg-white/5 transition active:scale-95">
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <BackupContent />
        </div>
      </div>
    </GlassCard>
  );
}

function SupportPanel() {
  const wpp = "5531993579103";
  const email = "filipewesley007@gmail.com";
  return (
    <GlassCard hideKey="perfil-3" hideLabel="Suporte">
      <p className="text-sm leading-relaxed text-muted-foreground mb-4">
        Olá! 👋 Se você tem dúvidas, sugestões ou precisa de ajuda para usar o <span className="text-foreground font-semibold">CloseFinance</span>,
        nossa equipe terá o maior prazer em te atender. Escolha o canal abaixo.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <a href={`https://wa.me/${wpp}`} target="_blank" rel="noopener noreferrer"
          className="rounded-2xl border border-border p-4 flex flex-col gap-2 hover:bg-white/5 transition active:scale-[0.98] group">
          <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 grid place-items-center">
            <MessageCircle className="size-5" />
          </div>
          <p className="font-semibold text-sm">WhatsApp</p>
          <p className="text-xs text-muted-foreground font-mono">(31) 99357-9103</p>
          <span className="text-xs text-primary group-hover:underline">Abrir conversa →</span>
        </a>
        <a href={`mailto:${email}`}
          className="rounded-2xl border border-border p-4 flex flex-col gap-2 hover:bg-white/5 transition active:scale-[0.98] group">
          <div className="size-10 rounded-xl bg-primary/20 text-primary grid place-items-center">
            <Mail className="size-5" />
          </div>
          <p className="font-semibold text-sm">E-mail</p>
          <p className="text-xs text-muted-foreground font-mono break-all">{email}</p>
          <span className="text-xs text-primary group-hover:underline">Enviar mensagem →</span>
        </a>
      </div>
    </GlassCard>
  );
}

function SecurityPanel() {
  const [, api, user] = useStore();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [resetMsg, setResetMsg] = useState<{ link: string; email: string } | null>(null);
  const [sound, setSound] = useState(true);
  const [popups, setPopups] = useState(true);
  const [tutorials, setTutorials] = useState(false);
  const [openPw, setOpenPw] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  useEffect(() => { setSound(isSoundEnabled()); setPopups(arePopupsEnabled()); setTutorials(areTutorialsEnabled()); }, []);

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard hideKey="perfil-4" hideLabel="Alterar senha">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg grid place-items-center bg-primary/15 text-primary"><Lock className="size-4" /></div>
              <h2 className="text-base font-semibold">Alterar senha</h2>
            </div>
            <button onClick={() => setOpenPw(o => !o)} aria-label={openPw ? "Recolher" : "Expandir"}
              className="rounded-lg border border-border p-1.5 hover:bg-white/5 transition active:scale-95">
              {openPw ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          </div>
          <div className={`grid transition-all duration-300 ease-out ${openPw ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
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
            </div>
          </div>
        </GlassCard>

        <GlassCard hideKey="perfil-5" hideLabel="Recuperação por e-mail">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg grid place-items-center bg-secondary/15 text-secondary"><Mail className="size-4" /></div>
              <h2 className="text-base font-semibold">Recuperação por e-mail</h2>
            </div>
            <button onClick={() => setOpenEmail(o => !o)} aria-label={openEmail ? "Recolher" : "Expandir"}
              className="rounded-lg border border-border p-1.5 hover:bg-white/5 transition active:scale-95">
              {openEmail ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          </div>
          <div className={`grid transition-all duration-300 ease-out ${openEmail ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
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
                  <p className="text-[10px] text-muted-foreground">Em produção, este link é entregue diretamente no seu e-mail. Configure o serviço de e-mail para envio automático.</p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard hideKey="perfil-prefs" hideLabel="Preferências">
        <div className="space-y-4">
          <div>
            <SectionTitle title="Sons da interface" subtitle="cliques e confirmações" />
            <button onClick={() => { const v = !sound; setSound(v); setSoundEnabled(v); if (v) playTone("success"); }}
              data-no-sound
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-mono transition ${sound ? "border-secondary/50 bg-secondary/10 text-secondary" : "border-border text-muted-foreground hover:bg-white/5"}`}>
              {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              {sound ? "Sons ativados" : "Sons desativados"}
            </button>
          </div>
          <div>
            <SectionTitle title="Notificações pop-up" subtitle="confirmações ao adicionar ganhos, gastos e alertas" />
            <button onClick={() => { const v = !popups; setPopups(v); setPopupsEnabled(v); if (v) notify("Notificações ativadas"); }}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-mono transition ${popups ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-white/5"}`}>
              {popups ? <Bell className="size-4" /> : <BellOff className="size-4" />}
              {popups ? "Pop-ups ativados" : "Pop-ups desativados"}
            </button>
          </div>
          <div>
            <SectionTitle title="Tutoriais para novos usuários" subtitle="dicas guiadas em Ganhos, Gastos, Categorias, Bancos e Cartões" />
            <button onClick={() => { const v = !tutorials; setTutorials(v); setTutorialsEnabled(v); if (v) notify("Tutoriais ativados"); }}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-mono transition ${tutorials ? "border-secondary/50 bg-secondary/10 text-secondary" : "border-border text-muted-foreground hover:bg-white/5"}`}>
              <GraduationCap className="size-4" />
              {tutorials ? "Tutoriais ativados" : "Tutoriais desativados"}
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="size-4 text-primary" />
              <h3 className="font-semibold text-sm">Aparência</h3>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <ThemeToggle />
              <span className="text-[11px] font-mono text-muted-foreground">Modo claro / escuro</span>
            </div>
            <AccentPicker />
            <div className="mt-4">
              <BackgroundPicker />
            </div>
          </div>


        </div>
      </GlassCard>
    </div>
  );
}

function AccentPicker() {
  const [a, setA] = useState<Accent>("violet");
  useEffect(() => { setA(getAccent()); return onAccentChange(setA); }, []);
  return (
    <div>
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Tema de cor</p>
      <div className="grid grid-cols-4 gap-2">
        {ACCENTS.map(opt => {
          const active = a === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              data-sound="soft"
              onClick={() => setAccent(opt.id)}
              title={opt.name}
              className={`group relative rounded-xl border p-2 transition active:scale-95 ${active ? "border-primary bg-primary/10" : "border-border hover:bg-white/5"}`}
            >
              <span className="block h-8 w-full rounded-lg" style={{ background: opt.color }} />
              <span className="mt-1.5 block text-[10px] font-mono text-center">{opt.name}</span>
              {active && <span className="absolute top-1 right-1 text-[9px] font-mono text-primary">●</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BackgroundPicker() {
  const [id, setId] = useState<string>("glass");
  useEffect(() => { setId(getBackgroundId()); return onBackgroundChange(() => setId(getBackgroundId())); }, []);
  return (
    <div>
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Plano de fundo</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {BACKGROUNDS.map(opt => {
          const active = id === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              data-sound="soft"
              onClick={() => setBackgroundId(opt.id)}
              title={opt.name}
              className={`group relative rounded-xl border overflow-hidden transition active:scale-95 ${active ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/40"}`}
            >
              <div
                className="h-20 w-full"
                style={{ backgroundImage: `url(${opt.url})`, backgroundSize: "cover", backgroundPosition: "center" }}
              />
              <div className="px-2 py-1.5 bg-background/70 backdrop-blur">
                <span className="block text-[10px] font-mono text-center truncate">{opt.name}</span>
              </div>
              {active && <span className="absolute top-1 right-1 text-[9px] font-mono text-primary bg-background/80 rounded px-1">●</span>}
            </button>
          );
        })}
      </div>
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
