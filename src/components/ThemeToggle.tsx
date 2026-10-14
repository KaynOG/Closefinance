import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTheme, toggleTheme, onThemeChange, type Theme } from "@/lib/theme";

export function ThemeToggle(_props: { compact?: boolean } = {}) {
  const [t, setT] = useState<Theme>("dark");
  useEffect(() => { setT(getTheme()); return onThemeChange(setT); }, []);
  const isDark = t === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => toggleTheme()}
      data-sound="soft"
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label="Alternar tema"
      className="floating-control size-9 rounded-xl border border-border hover:bg-muted hover:text-foreground"
    >
      {isDark ? <Sun className="size-4 text-secondary" /> : <Moon className="size-4 text-primary" />}
    </Button>
  );
}
