import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/ui-kit";

export const Route = createFileRoute("/design-system")({
  head: () => ({ meta: [{ title: "Design System — Finlux" }, { name: "description", content: "Tokens, tipografia, componentes e diretrizes para reproduzir no Figma." }] }),
  component: DSPage,
});

const COLORS = [
  { name: "Primary / Violet", token: "--brand-violet", hex: "#540BD3", use: "Botões primários, links, foco" },
  { name: "Secondary / Yellow", token: "--brand-yellow", hex: "#FFCC00", use: "Destaques, métricas-chave, CTA" },
  { name: "Complementary / Teal", token: "--brand-teal", hex: "#006F77", use: "Sucesso suave, gráficos, badges" },
  { name: "Complementary / Crimson", token: "--brand-crimson", hex: "#820432", use: "Despesas, alertas críticos" },
  { name: "Background", token: "--background", hex: "#0A0118", use: "Fundo principal escuro" },
  { name: "Foreground", token: "--foreground", hex: "#FFFFFF", use: "Texto em fundos escuros" },
  { name: "Success", token: "--success", hex: "#2BD9A1", use: "Receitas, indicadores positivos" },
  { name: "Danger", token: "--danger", hex: "#FF4D6D", use: "Erros e alertas críticos" },
];

const TYPOGRAPHY = [
  { name: "Display / H1", font: "Poppins", weight: 700, size: "36–48px", line: 1.1, sample: "Finlux" },
  { name: "Display / H2", font: "Poppins", weight: 700, size: "24–32px", line: 1.15, sample: "Saúde financeira" },
  { name: "Heading / H3", font: "Poppins", weight: 600, size: "18–20px", line: 1.2, sample: "Limite dos cartões" },
  { name: "Body", font: "Poppins", weight: 400, size: "14–16px", line: 1.5, sample: "Texto corrido com clareza e leveza." },
  { name: "Mono / Caption", font: "JetBrains Mono", weight: 500, size: "11–12px", line: 1.4, sample: "FONT-MONO · 2025" },
  { name: "Mono / Data", font: "JetBrains Mono", weight: 500, size: "14–16px", line: 1.4, sample: "R$ 12.450,00" },
];

const SPACING = [
  { token: "xs", value: 4 }, { token: "sm", value: 8 }, { token: "md", value: 12 },
  { token: "lg", value: 16 }, { token: "xl", value: 24 }, { token: "2xl", value: 32 },
  { token: "3xl", value: 48 },
];

const RADII = [
  { token: "sm", value: 12 }, { token: "md", value: 14 }, { token: "lg", value: 16 },
  { token: "xl", value: 20 }, { token: "2xl", value: 24 }, { token: "3xl", value: 28 }, { token: "pill", value: 999 },
];

function DSPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Documentação</p>
        <h1 className="text-3xl lg:text-4xl font-bold">Design System <span className="text-gradient">Finlux</span></h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          Referência completa de cores, tipografia, espaçamento, raios e componentes — pronta para ser recriada no Figma como estilos e variáveis.
        </p>
      </header>

      {/* Brand */}
      <GlassCard className="mb-6">
        <SectionTitle title="Marca e princípios" subtitle="o que guia cada decisão visual" />
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { t: "Claro e direto", d: "Hierarquia óbvia, sem ruído. O número importante deve ser o herói." },
            { t: "Moderno com profundidade", d: "Glassmorfismo sutil, gradientes suaves, luz violeta como fio condutor." },
            { t: "Funcional e calmo", d: "Cores fortes só onde precisam comunicar — receitas, alertas, foco." },
          ].map(p => (
            <div key={p.t} className="rounded-2xl bg-white/5 p-4 border border-border">
              <p className="font-semibold">{p.t}</p>
              <p className="text-sm text-muted-foreground mt-1">{p.d}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Colors */}
      <GlassCard className="mb-6">
        <SectionTitle title="Paleta de cores" subtitle="tokens e usos recomendados" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COLORS.map(c => (
            <div key={c.name} className="rounded-2xl border border-border overflow-hidden bg-white/[0.02]">
              <div className="h-24" style={{ background: c.hex }} />
              <div className="p-3">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="font-mono text-[11px] text-muted-foreground mt-1">{c.hex.toUpperCase()}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{c.token}</p>
                <p className="text-xs text-muted-foreground mt-2">{c.use}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: "Gradient · Primary", css: "linear-gradient(135deg, #540BD3 0%, #B388FF 100%)" },
            { name: "Gradient · Warm", css: "linear-gradient(135deg, #FFCC00 0%, #820432 100%)" },
            { name: "Gradient · Cool", css: "linear-gradient(135deg, #540BD3 0%, #006F77 100%)" },
          ].map(g => (
            <div key={g.name} className="rounded-2xl border border-border overflow-hidden">
              <div className="h-20" style={{ backgroundImage: g.css }} />
              <div className="p-3"><p className="text-sm font-semibold">{g.name}</p><p className="font-mono text-[11px] text-muted-foreground break-all mt-1">{g.css}</p></div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Typography */}
      <GlassCard className="mb-6">
        <SectionTitle title="Tipografia" subtitle="Poppins (display) + JetBrains Mono (data/captions)" />
        <div className="space-y-3">
          {TYPOGRAPHY.map(t => (
            <div key={t.name} className="rounded-2xl border border-border bg-white/[0.02] p-4 flex flex-wrap items-end gap-6">
              <div className="min-w-[200px]">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{t.name}</p>
                <p className="font-mono text-[11px] text-muted-foreground mt-1">{t.font} · {t.weight} · {t.size} · LH {t.line}</p>
              </div>
              <p className="text-2xl" style={{ fontFamily: t.font, fontWeight: t.weight as number, lineHeight: t.line }}>{t.sample}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Spacing + radii */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <GlassCard>
          <SectionTitle title="Espaçamento" subtitle="múltiplos de 4 — usar tokens" />
          <div className="space-y-2">
            {SPACING.map(s => (
              <div key={s.token} className="flex items-center gap-3">
                <span className="w-12 font-mono text-xs text-muted-foreground">{s.token}</span>
                <span className="font-mono text-xs w-12">{s.value}px</span>
                <div className="h-3 rounded-full bg-primary/60" style={{ width: s.value * 3 }} />
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <SectionTitle title="Raio de borda" subtitle="curvas suaves, modernas" />
          <div className="grid grid-cols-4 gap-3">
            {RADII.map(r => (
              <div key={r.token} className="text-center">
                <div className="aspect-square bg-primary/30 border border-primary/60 mx-auto" style={{ borderRadius: r.value }} />
                <p className="font-mono text-[11px] text-muted-foreground mt-2">{r.token} · {r.value}px</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Components */}
      <GlassCard className="mb-6">
        <SectionTitle title="Componentes" subtitle="exemplos prontos para clonar no Figma" />

        <div className="space-y-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Botões</p>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold glow-violet">Primary</button>
              <button className="rounded-xl bg-secondary text-secondary-foreground px-4 py-2.5 text-sm font-semibold">Secondary</button>
              <button className="rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Ghost</button>
              <button className="rounded-xl bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-semibold">Destructive</button>
            </div>
          </div>

          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Cards</p>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="glass rounded-2xl p-4"><p className="text-xs font-mono text-muted-foreground">glass</p><p className="font-semibold mt-1">Card padrão</p></div>
              <div className="glass-strong rounded-2xl p-4"><p className="text-xs font-mono text-muted-foreground">glass-strong</p><p className="font-semibold mt-1">Card de destaque</p></div>
              <div className="rounded-2xl p-4 bg-[image:var(--gradient-primary)] text-primary-foreground glow-violet"><p className="text-xs font-mono opacity-80">gradient</p><p className="font-semibold mt-1">Card de marca</p></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Inputs</p>
            <div className="grid md:grid-cols-2 gap-3">
              <input className="rounded-xl bg-white/5 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary font-mono" placeholder="Texto..." />
              <select className="rounded-xl bg-white/5 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary font-mono">
                <option>Selecione</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Badges / Tags</p>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="rounded-full px-3 py-1 bg-[#2BD9A1]/20 text-[#2BD9A1]">Essencial</span>
              <span className="rounded-full px-3 py-1 bg-[#820432]/30 text-[#FF8FA3]">Não essencial</span>
              <span className="rounded-full px-3 py-1 bg-primary/20 text-[#B388FF]">Investimento</span>
              <span className="rounded-full px-3 py-1 bg-secondary/20 text-secondary">Alerta</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Figma export */}
      <GlassCard>
        <SectionTitle title="Como reproduzir no Figma" subtitle="passo a passo de variáveis e estilos" />
        <ol className="space-y-3 text-sm list-decimal pl-5 marker:text-secondary marker:font-bold">
          <li>Crie uma <strong>Color Collection</strong> chamada <code className="font-mono text-secondary">Finlux/Brand</code> e adicione cada cor da tabela acima como variável (use os mesmos nomes de token).</li>
          <li>Crie uma coleção <code className="font-mono text-secondary">Finlux/Theme</code> com modos <em>Dark</em> (padrão) e <em>Light</em>; mapeie <code className="font-mono">background</code>, <code className="font-mono">foreground</code>, <code className="font-mono">card</code>, <code className="font-mono">muted</code>.</li>
          <li>Adicione as fontes <strong>Poppins</strong> (300/400/500/600/700) e <strong>JetBrains Mono</strong> (400/500/600) ao arquivo.</li>
          <li>Crie <strong>Text Styles</strong> espelhando a tabela de tipografia (Display H1/H2, Heading H3, Body, Mono Caption, Mono Data).</li>
          <li>Crie <strong>Effect Styles</strong>: <code className="font-mono">Glow / Violet</code> (sombra externa #540BD3 70% opac., y=20, blur=60, spread=-20) e <code className="font-mono">Glow / Yellow</code> equivalente.</li>
          <li>Para o glassmorfismo, use <em>Fill</em> linear 135° entre branco 7% e branco 2%, <em>Stroke</em> 1px branco 10% e <em>Background Blur</em> 18.</li>
          <li>Crie variáveis numéricas para <code className="font-mono">spacing</code> e <code className="font-mono">radius</code> com os valores das tabelas acima.</li>
          <li>Monte componentes base: Button (variantes Primary, Secondary, Ghost, Destructive), Card (Glass, Glass-strong, Gradient), Input, Badge e Chart Container.</li>
        </ol>
      </GlassCard>
    </AppShell>
  );
}
