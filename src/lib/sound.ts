// Efeitos sonoros modernos/futuristas via Web Audio API.
import checkAsset from "@/assets/check-scribble.mp3.asset.json";
import clickAsset from "@/assets/click-ui.mp3.asset.json";


let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    } catch { return null; }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
  if (typeof window !== "undefined") localStorage.setItem("closefinance:sound", v ? "1" : "0");
}
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("closefinance:sound");
  if (v === null) return true;
  enabled = v === "1";
  return enabled;
}

export type Voice =
  | "click" | "soft" | "success" | "warn" | "complete"
  | "pop"   | "chime" | "tap"     | "open"  | "close"
  | "coin"  | "swoosh" | "nav"    | "notify";

type Cfg = {
  freq: number;      // frequência inicial
  freq2?: number;    // glide
  dur: number;
  type: OscillatorType;
  gain: number;
  lp?: number;       // corte do filtro no ataque
  lp2?: number;      // corte final (sweep)
  detune?: number;   // camada extra desafinada (cents)
  shimmer?: number;  // camada harmônica (multiplicador de freq)
};

// Paleta futurista: senoides/triângulos limpos, glides rápidos e sweeps de filtro.
const VOICES: Record<Voice, Cfg> = {
  tap:      { freq: 1200, freq2: 1500, dur: 0.045, type: "sine",     gain: 0.028, lp: 5200, lp2: 3000 },
  click:    { freq: 900,  freq2: 1400, dur: 0.070, type: "sine",     gain: 0.040, lp: 6000, lp2: 2600, shimmer: 2 },
  nav:      { freq: 660,  freq2: 1320, dur: 0.090, type: "triangle", gain: 0.038, lp: 6500, lp2: 2200, detune: 9 },
  soft:     { freq: 520,  freq2: 780,  dur: 0.110, type: "sine",     gain: 0.036, lp: 4200, lp2: 2000, detune: 7 },
  pop:      { freq: 1040, freq2: 720,  dur: 0.060, type: "sine",     gain: 0.036, lp: 5200, lp2: 2400 },
  open:     { freq: 420,  freq2: 1180, dur: 0.140, type: "triangle", gain: 0.036, lp: 2200, lp2: 6800, detune: 11 },
  close:    { freq: 1180, freq2: 420,  dur: 0.140, type: "triangle", gain: 0.036, lp: 6800, lp2: 1800, detune: 11 },
  notify:   { freq: 1320, freq2: 1760, dur: 0.170, type: "sine",     gain: 0.046, lp: 7000, lp2: 4200, shimmer: 1.5 },
  success:  { freq: 784,  freq2: 1568, dur: 0.180, type: "sine",     gain: 0.046, lp: 6800, lp2: 3600, shimmer: 2, detune: 6 },
  warn:     { freq: 300,  freq2: 190,  dur: 0.190, type: "sawtooth", gain: 0.034, lp: 1600, lp2: 700, detune: 14 },
  complete: { freq: 880,  freq2: 1760, dur: 0.280, type: "sine",     gain: 0.050, lp: 7200, lp2: 4000, shimmer: 3, detune: 8 },
  chime:    { freq: 1568, freq2: 2093, dur: 0.220, type: "sine",     gain: 0.038, lp: 8000, lp2: 5000, shimmer: 2 },
  coin:     { freq: 1760, freq2: 2637, dur: 0.130, type: "triangle", gain: 0.032, lp: 8000, lp2: 6000, shimmer: 1.5 },
  swoosh:   { freq: 1600, freq2: 180,  dur: 0.200, type: "sawtooth", gain: 0.026, lp: 4000, lp2: 500, detune: 18 },
};

function voiceLayer(ac: AudioContext, cfg: Cfg, out: AudioNode, now: number, freq: number, freq2: number, gainScale: number, type: OscillatorType, detune = 0) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.detune.value = detune;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq2), now + cfg.dur * 0.85);

  const peak = Math.max(0.0005, cfg.gain * gainScale);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.dur);

  osc.connect(gain);
  gain.connect(out);
  osc.start(now);
  osc.stop(now + cfg.dur + 0.03);
}

export function playTone(voice: Voice = "click") {
  if (!enabled) return;
  const ac = ensureCtx();
  if (!ac || !master) return;
  const cfg = VOICES[voice];
  const now = ac.currentTime;

  // filtro com sweep (sensação digital/futurista)
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 1.1;
  filter.frequency.setValueAtTime(cfg.lp ?? 5000, now);
  filter.frequency.exponentialRampToValueAtTime(Math.max(200, cfg.lp2 ?? cfg.lp ?? 3000), now + cfg.dur);

  // eco curtíssimo — dá o brilho "sci-fi" sem poluir
  const delay = ac.createDelay(0.3);
  delay.delayTime.value = 0.055;
  const fb = ac.createGain();
  fb.gain.value = 0.18;
  const wet = ac.createGain();
  wet.gain.value = 0.22;
  filter.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  wet.connect(master);
  filter.connect(master);

  const f2 = cfg.freq2 ?? cfg.freq;
  voiceLayer(ac, cfg, filter, now, cfg.freq, f2, 1, cfg.type);
  if (cfg.detune) voiceLayer(ac, cfg, filter, now, cfg.freq, f2, 0.5, cfg.type, cfg.detune);
  if (cfg.shimmer) voiceLayer(ac, cfg, filter, now, cfg.freq * cfg.shimmer, f2 * cfg.shimmer, 0.28, "sine");

  setTimeout(() => { try { wet.disconnect(); fb.disconnect(); delay.disconnect(); filter.disconnect(); } catch { /* noop */ } }, (cfg.dur + 0.6) * 1000);
}

/** Sequência curta de notas (ex.: ao concluir missão). */
export function playSequence(voices: Voice[], spacingMs = 110) {
  voices.forEach((v, i) => setTimeout(() => playTone(v), i * spacingMs));
}

/** Som de ganho — arpejo digital ascendente e limpo. */
export function playCashRegister() {
  playSequence(["tap", "coin", "chime"], 70);
}

/** Som de gasto — descida digital curta. */
export function playExpense() {
  playSequence(["pop", "swoosh"], 55);
}

/** Som de missão concluída — arpejo brilhante ascendente. */
export function playMissionComplete() {
  playSequence(["notify", "chime", "complete"], 95);
}

/** Notificação padrão do app. */
export function playNotify() {
  playSequence(["notify", "tap"], 80);
}

/** Troca de aba. */
export function playNav() {
  playTone("nav");
}

/** Som de marcar caixinha (rabisco de lápis). */
let checkAudio: HTMLAudioElement | null = null;
export function playCheck() {
  if (!enabled || typeof window === "undefined") return;
  try {
    if (!checkAudio) {
      checkAudio = new Audio(checkAsset.url);
      checkAudio.volume = 0.5;
      checkAudio.preload = "auto";
    }
    checkAudio.currentTime = 0;
    void checkAudio.play().catch(() => {});
  } catch { /* noop */ }
}

/** Som de clique padrão do app (sample curto). */
let clickPool: HTMLAudioElement[] = [];
let clickIdx = 0;
export function playClick() {
  if (!enabled || typeof window === "undefined") return;
  try {
    if (clickPool.length === 0) {
      clickPool = Array.from({ length: 3 }, () => {
        const a = new Audio(clickAsset.url);
        a.volume = 0.35;
        a.preload = "auto";
        return a;
      });
    }
    const a = clickPool[clickIdx % clickPool.length];
    clickIdx++;
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch { /* noop */ }
}

let installed = false;
/** Instala um listener global que toca tons futuristas em botões/links. */
export function installGlobalClickSounds() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  isSoundEnabled(); // sync flag
  const handler = (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    if (t instanceof HTMLInputElement && t.type === "checkbox") return;
    const el = t.closest<HTMLElement>("button, a, [role='button'], [data-sound]");
    if (!el) return;
    if (el.hasAttribute("data-no-sound")) return;
    if (el.getAttribute("data-sound") === "check") { playCheck(); return; }
    const v = (el.getAttribute("data-sound") as Voice | null) ?? "click";
    playTone(v);
  };
  window.addEventListener("pointerdown", handler, { passive: true });

  // Qualquer checkbox marcado toca o som de rabisco
  window.addEventListener("change", (e) => {
    const t = e.target as HTMLElement | null;
    if (t instanceof HTMLInputElement && t.type === "checkbox") playCheck();
  }, { passive: true });
}

