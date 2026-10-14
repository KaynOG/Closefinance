import bgGlass from "@/assets/bg-geometric-glass.jpg.asset.json";
import bgDarkGreen from "@/assets/bg-dark-green.jpg.asset.json";
import bgLime from "@/assets/bg-lime-stripes.png.asset.json";
import bgOrange from "@/assets/bg-orange-glow.png.asset.json";
import bgTealOrange from "@/assets/bg-teal-orange.png.asset.json";
import bgTealWaves from "@/assets/bg-teal-waves.png.asset.json";
import bgPurpleWaves from "@/assets/bg-purple-waves.jpg.asset.json";
import bgLiquidBlack from "@/assets/bg-liquid-black.jpg";
import bgLiquidSilver from "@/assets/bg-liquid-silver.jpg";
import bgLiquidRed from "@/assets/bg-liquid-red.jpg";
import bgLiquidBlue from "@/assets/bg-liquid-blue.jpg";

export type BgOption = { id: string; name: string; url: string };

export const BACKGROUNDS: BgOption[] = [
  { id: "none", name: "Sem fundo", url: "" },
  { id: "glass", name: "Glass geométrico", url: bgGlass.url },
  { id: "dark-green", name: "Verde profundo", url: bgDarkGreen.url },
  { id: "lime", name: "Lima listrado", url: bgLime.url },
  { id: "orange", name: "Laranja glow", url: bgOrange.url },
  { id: "teal-orange", name: "Teal & laranja", url: bgTealOrange.url },
  { id: "teal-waves", name: "Ondas teal", url: bgTealWaves.url },
  { id: "purple-waves", name: "Ondas roxas", url: bgPurpleWaves.url },
  { id: "liquid-black", name: "Vidro líquido · Preto", url: bgLiquidBlack },
  { id: "liquid-silver", name: "Vidro líquido · Cinza claro", url: bgLiquidSilver },
  { id: "liquid-red", name: "Vidro líquido · Vermelho", url: bgLiquidRed },
  { id: "liquid-blue", name: "Vidro líquido · Azul", url: bgLiquidBlue },
];


const KEY = "closefinance:background";

export function getBackgroundId(): string {
  if (typeof window === "undefined") return "teal-orange";
  return window.localStorage.getItem(KEY) || "teal-orange";
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
