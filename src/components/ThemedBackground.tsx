import { useEffect, useState } from "react";
import { getBackgroundUrl, onBackgroundChange } from "@/lib/backgrounds";

export function ThemedBackground() {
  const [url, setUrl] = useState<string>(() => getBackgroundUrl());
  useEffect(() => {
    setUrl(getBackgroundUrl());
    return onBackgroundChange(() => setUrl(getBackgroundUrl()));
  }, []);
  const hasBg = !!url;
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none transition-[background-image] duration-500"
      style={{
        backgroundColor: hasBg ? undefined : "var(--background)",
        backgroundImage: hasBg ? `url(${url})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {hasBg && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--background) 40%, transparent), color-mix(in oklab, var(--background) 55%, transparent))",
          }}
        />
      )}
    </div>
  );
}
