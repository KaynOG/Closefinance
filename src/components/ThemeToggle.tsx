import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getTheme, toggleTheme, onThemeChange, type Theme } from "@/lib/theme";

export function ThemeToggle(_props: { compact?: boolean } = {}) {
  const [t, setT] = useState<Theme>("dark");
  useEffect(() => { setT(getTheme()); return onThemeChange(setT); }, []);
  const isDark = t === "dark";
  return (
    <button
      onClick={() => toggleTheme()}
      data-sound="soft"
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label="Alternar tema"
      className="inline-flex items-center justify-center rounded-xl border border-border transition active:scale-95 hover:bg-white/5 p-2"
    >
      {isDark ? <Sun className="size-4 text-secondary" /> : <Moon className="size-4 text-primary" />}
    </button>
  );
}
