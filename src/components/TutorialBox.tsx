import { useEffect, useState } from "react";
import { GraduationCap, ChevronDown, ChevronUp, X } from "lucide-react";
import { areTutorialsEnabled, onTutorialsChange } from "@/lib/tutorials";

interface Props {
  title: string;
  steps: string[];
  storageKey: string; // identificador para lembrar se está retraído
  tip?: string;
}

export function TutorialBox({ title, steps, storageKey, tip }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setEnabled(areTutorialsEnabled());
    const off = onTutorialsChange(() => setEnabled(areTutorialsEnabled()));
    setHidden(window.localStorage.getItem(`cf_tut_hidden_${storageKey}`) === "1");
    setOpen(window.localStorage.getItem(`cf_tut_open_${storageKey}`) !== "0");
    return off;
  }, [storageKey]);

  if (!enabled || hidden) return null;

  function toggle() {
    const n = !open;
    setOpen(n);
    window.localStorage.setItem(`cf_tut_open_${storageKey}`, n ? "1" : "0");
  }
  function dismiss() {
    setHidden(true);
    window.localStorage.setItem(`cf_tut_hidden_${storageKey}`, "1");
  }

  return (
    <div className="mb-4 rounded-2xl border border-secondary/30 bg-secondary/8 backdrop-blur p-4">
      <div className="flex items-center justify-between gap-3">
        <button onClick={toggle} className="flex items-center gap-2 text-left flex-1 min-w-0">
          <div className="size-8 rounded-lg grid place-items-center bg-secondary/20 text-secondary shrink-0">
            <GraduationCap className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-secondary">Tutorial rápido</p>
            <p className="text-sm font-semibold truncate">{title}</p>
          </div>
          <span className="ml-auto size-7 rounded-lg grid place-items-center bg-white/5 hover:bg-white/10 transition">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </span>
        </button>
        <button onClick={dismiss} aria-label="Dispensar tutorial"
          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
          <X className="size-4" />
        </button>
      </div>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <ol className="space-y-2 text-sm pl-1">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="size-5 shrink-0 rounded-full bg-secondary/20 text-secondary text-[11px] font-mono grid place-items-center mt-0.5">{i + 1}</span>
                <span className="text-foreground/90">{s}</span>
              </li>
            ))}
          </ol>
          {tip && (
            <p className="mt-3 text-[11px] font-mono text-muted-foreground border-l-2 border-secondary/40 pl-2">
              💡 {tip}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
