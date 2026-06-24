import { useEffect, useState } from "react";
import { getAccent, onAccentChange, type Accent } from "@/lib/theme";
import { getBg, onBgChange, type BgChoice } from "@/lib/background";
import bgTealOrange from "@/assets/bg-teal-orange.png.asset.json";
import bgOrange from "@/assets/bg-orange-glow.png.asset.json";
import bgLime from "@/assets/bg-lime-stripes.png.asset.json";
import bgWaves from "@/assets/bg-teal-waves.png.asset.json";

const ACCENT_MAP: Record<Accent, BgChoice> = {
  violet: "teal-orange",
  crimson: "orange-glow",
  teal: "lime-stripes",
  graphite: "teal-waves",
};

const URL_MAP: Record<Exclude<BgChoice, "auto">, string> = {
  "teal-orange": bgTealOrange.url,
  "orange-glow": bgOrange.url,
  "lime-stripes": bgLime.url,
  "teal-waves": bgWaves.url,
};

export function ThemedBackground() {
  const [accent, setAccent] = useState<Accent>("violet");
  const [bg, setBgState] = useState<BgChoice>("auto");
  useEffect(() => {
    setAccent(getAccent());
    setBgState(getBg());
    const off1 = onAccentChange(setAccent);
    const off2 = onBgChange(setBgState);
    return () => { off1(); off2(); };
  }, []);
  const choice: Exclude<BgChoice, "auto"> = bg === "auto" ? ACCENT_MAP[accent] : bg;
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundImage: `url(${URL_MAP[choice]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.28,
        filter: "saturate(115%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--background) 55%, transparent), color-mix(in oklab, var(--background) 78%, transparent))",
        }}
      />
    </div>
  );
}
