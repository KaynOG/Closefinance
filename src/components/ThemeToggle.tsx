import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getTheme, toggleTheme, onThemeChange, type Theme } from "@/lib/theme";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [t, setT] = useState<Theme>("dark");
  useEffect(() => { setT(getTheme()); const off = onThemeChange(setT); return () => { off; }; }, []);
  const isDark = t === "dark";
  return (
    <button
      onClick={() => toggleTheme()}
      data-sound="soft"
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label="Alternar tema"
      className={`inline-flex items-center gap-2 rounded-xl border border-border transition active:scale-95 hover:bg-white/5 ${compact ? "p-2" : "px-3 py-2 text-xs font-mono"}`}
    >
      {isDark ? <Sun className="size-4 text-secondary" /> : <Moon className="size-4 text-primary" />}
      {!compact && <span>{isDark ? "Modo claro" : "Modo escuro"}</span>}
    </button>
  );
}
