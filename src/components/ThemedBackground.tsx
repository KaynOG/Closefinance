import bg from "@/assets/bg-geometric-glass.jpg.asset.json";

export function ThemedBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundImage: `url(${bg.url})`,
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
