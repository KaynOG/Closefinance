import { useEffect, useState } from "react";
import { getBackgroundUrl, onBackgroundChange } from "@/lib/backgrounds";

export function ThemedBackground() {
  const [url, setUrl] = useState<string>(() => getBackgroundUrl());
  useEffect(() => {
    setUrl(getBackgroundUrl());
    return onBackgroundChange(() => setUrl(getBackgroundUrl()));
  }, []);
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none transition-[background-image] duration-500"
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--background) 60%, transparent), color-mix(in oklab, var(--background) 78%, transparent))",
        }}
      />
    </div>
  );
}
