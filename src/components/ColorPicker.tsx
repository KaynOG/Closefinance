import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ColorPicker({ value, onChange, className }: { value: string; onChange: (color: string) => void; className?: string }) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  function change(color: string) { setDraft(color); onChange(color); }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <Button type="button" variant="outline" size="icon" aria-label="Escolher cor personalizada" title="Escolher cor personalizada" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setDraft(value); setOpen(true); }} className={cn("shrink-0 rounded-lg border-border bg-muted", className)}>
          <Palette />
        </Button>
      <DialogContent aria-describedby={undefined} onClick={event => event.stopPropagation()} className="color-picker max-w-xs rounded-lg border-border bg-popover p-5 text-popover-foreground">
        <DialogTitle>Cor personalizada</DialogTitle>
        <HexColorPicker color={value} onChange={change} />
        <label className="mt-4 block text-xs font-mono text-muted-foreground">
          Código da cor
          <input aria-label="Código da cor" value={draft} maxLength={7} spellCheck={false} onChange={(event) => { const color = event.target.value; setDraft(color); if (/^#[0-9a-f]{6}$/i.test(color)) onChange(color); }} onBlur={() => setDraft(value)} className="mt-1.5 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
        </label>
      </DialogContent>
    </Dialog>
  );
}