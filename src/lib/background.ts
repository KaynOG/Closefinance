export type BgChoice = "auto" | "teal-orange" | "teal-waves" | "orange-glow" | "lime-stripes";

const KEY = "closefinance:bg";
const listeners = new Set<(b: BgChoice) => void>();
const VALID: BgChoice[] = ["auto", "teal-orange", "teal-waves", "orange-glow", "lime-stripes"];

export function getBg(): BgChoice {
  if (typeof window === "undefined") return "auto";
  const v = localStorage.getItem(KEY) as BgChoice | null;
  return v && VALID.includes(v) ? v : "auto";
}

export function setBg(b: BgChoice) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, b);
  listeners.forEach(l => l(b));
}

export function onBgChange(cb: (b: BgChoice) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
