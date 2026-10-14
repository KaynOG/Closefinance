import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ColorPicker({ value, onChange, className }: { value: string; onChange: (color: string) => void; className?: string }) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  function change(color: string) { setDraft(color); onChange(color); }
  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) setDraft(value); }}>
      <PopoverAnchor asChild>
        <Button type="button" variant="outline" size="icon" aria-label="Escolher cor personalizada" title="Escolher cor personalizada" onClick={(event) => { event.preventDefault(); setDraft(value); setOpen(!open); }} className={cn("shrink-0 rounded-lg border-border bg-muted", className)}>
          <Palette />
        </Button>
      </PopoverAnchor>
      <PopoverContent align="start" className="color-picker w-64 max-w-[calc(100vw-2rem)] rounded-lg border-border bg-popover p-4 text-popover-foreground">
        <p className="mb-3 text-sm font-semibold">Cor personalizada</p>
        <HexColorPicker color={value} onChange={change} />
        <label className="mt-4 block text-xs font-mono text-muted-foreground">
          Código da cor
          <input aria-label="Código da cor" value={draft} maxLength={7} spellCheck={false} onChange={(event) => { const color = event.target.value; setDraft(color); if (/^#[0-9a-f]{6}$/i.test(color)) onChange(color); }} onBlur={() => setDraft(value)} className="mt-1.5 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
        </label>
      </PopoverContent>
    </Popover>
  );
}