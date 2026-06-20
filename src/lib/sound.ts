// Efeitos sonoros cozy/aconchegantes via Web Audio API.
// Tons curtos, suaves e arredondados — pensados para botões e interações.

let ctx: AudioContext | null = null;
let enabled = true;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
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
  | "coin"  | "swoosh";

type Cfg = { freq: number; freq2?: number; dur: number; type: OscillatorType; gain: number; lp?: number };
const VOICES: Record<Voice, Cfg> = {
  click:    { freq: 520, freq2: 660, dur: 0.10, type: "sine",     gain: 0.06, lp: 2400 },
  soft:     { freq: 360, freq2: 440, dur: 0.14, type: "triangle", gain: 0.05, lp: 1800 },
  success:  { freq: 523, freq2: 784, dur: 0.22, type: "sine",     gain: 0.07, lp: 2800 },
  warn:     { freq: 220, freq2: 180, dur: 0.18, type: "triangle", gain: 0.07, lp: 1400 },
  complete: { freq: 660, freq2: 990, dur: 0.32, type: "sine",     gain: 0.08, lp: 3200 },
  pop:      { freq: 720, freq2: 540, dur: 0.08, type: "sine",     gain: 0.05, lp: 2400 },
  chime:    { freq: 880, freq2: 1320,dur: 0.28, type: "sine",     gain: 0.06, lp: 3600 },
  tap:      { freq: 420,            dur: 0.05, type: "sine",     gain: 0.04, lp: 2000 },
  open:     { freq: 300, freq2: 520, dur: 0.16, type: "triangle", gain: 0.05, lp: 2200 },
  close:    { freq: 520, freq2: 300, dur: 0.16, type: "triangle", gain: 0.05, lp: 2200 },
  coin:     { freq: 988, freq2: 1318,dur: 0.20, type: "square",   gain: 0.04, lp: 3000 },
  swoosh:   { freq: 200, freq2: 80,  dur: 0.22, type: "sawtooth", gain: 0.04, lp: 1200 },
};

export function playTone(voice: Voice = "click") {
  if (!enabled) return;
  const ac = ensureCtx();
  if (!ac) return;
  const cfg = VOICES[voice];
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.value = cfg.lp ?? 2400;
  filter.Q.value = 0.6;

  osc.type = cfg.type;
  osc.frequency.setValueAtTime(cfg.freq, now);
  if (cfg.freq2) osc.frequency.exponentialRampToValueAtTime(cfg.freq2, now + cfg.dur * 0.9);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(cfg.gain, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);

  osc.start(now);
  osc.stop(now + cfg.dur + 0.02);
}

/** Sequência curta de notas (ex.: ao concluir missão). */
export function playSequence(voices: Voice[], spacingMs = 110) {
  voices.forEach((v, i) => setTimeout(() => playTone(v), i * spacingMs));
}

let installed = false;
/** Instala um listener global que toca tons aconchegantes em botões/links. */
export function installGlobalClickSounds() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  isSoundEnabled(); // sync flag
  const handler = (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    const el = t.closest<HTMLElement>("button, a, [role='button'], [data-sound]");
    if (!el) return;
    if (el.hasAttribute("data-no-sound")) return;
    const v = (el.getAttribute("data-sound") as Voice | null) ?? "click";
    playTone(v);
  };
  window.addEventListener("pointerdown", handler, { passive: true });
}
