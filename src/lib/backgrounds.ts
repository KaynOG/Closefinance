import bgGlass from "@/assets/bg-geometric-glass.jpg.asset.json";
import bgDarkGreen from "@/assets/bg-dark-green.jpg.asset.json";
import bgLime from "@/assets/bg-lime-stripes.png.asset.json";
import bgOrange from "@/assets/bg-orange-glow.png.asset.json";
import bgTealOrange from "@/assets/bg-teal-orange.png.asset.json";
import bgTealWaves from "@/assets/bg-teal-waves.png.asset.json";

export type BgOption = { id: string; name: string; url: string };

export const BACKGROUNDS: BgOption[] = [
  { id: "glass", name: "Glass geométrico", url: bgGlass.url },
  { id: "dark-green", name: "Verde profundo", url: bgDarkGreen.url },
  { id: "lime", name: "Lima listrado", url: bgLime.url },
  { id: "orange", name: "Laranja glow", url: bgOrange.url },
  { id: "teal-orange", name: "Teal & laranja", url: bgTealOrange.url },
  { id: "teal-waves", name: "Ondas teal", url: bgTealWaves.url },
];

const KEY = "closefinance:background";

export function getBackgroundId(): string {
  if (typeof window === "undefined") return "glass";
  return window.localStorage.getItem(KEY) || "glass";
}

export function getBackgroundUrl(): string {
  const id = getBackgroundId();
  return (BACKGROUNDS.find(b => b.id === id) ?? BACKGROUNDS[0]).url;
}

export function setBackgroundId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, id);
  window.dispatchEvent(new Event("cf:bg-changed"));
}

export function onBackgroundChange(cb: () => void) {
  const l = () => cb();
  window.addEventListener("cf:bg-changed", l);
  window.addEventListener("storage", l);
  return () => {
    window.removeEventListener("cf:bg-changed", l);
    window.removeEventListener("storage", l);
  };
}
