import { useEffect, useState } from "react";
import { getAccent, onAccentChange, type Accent } from "@/lib/theme";
import bgTealOrange from "@/assets/bg-teal-orange.png.asset.json";
import bgOrange from "@/assets/bg-orange-glow.png.asset.json";
import bgLime from "@/assets/bg-lime-stripes.png.asset.json";
import bgWaves from "@/assets/bg-teal-waves.png.asset.json";

const MAP: Record<Accent, string> = {
  violet: bgTealOrange.url,
  crimson: bgOrange.url,
  teal: bgLime.url,
  graphite: bgWaves.url,
};

export function ThemedBackground() {
  const [accent, setAccent] = useState<Accent>("violet");
  useEffect(() => {
    setAccent(getAccent());
    return onAccentChange(setAccent);
  }, []);
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundImage: `url(${MAP[accent]})`,
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
