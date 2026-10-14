import { useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { HexColorPicker } from "react-colorful";
import { Check, Palette, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Seletor de cor com rascunho local: a roda e o código editam apenas a prévia.
 * A cor só é aplicada ao pressionar "Confirmar cor".
 */
export function ColorPicker({ value, onChange, className }: { value: string; onChange: (color: string) => void; className?: string }) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const lastValid = useRef(HEX.test(value) ? value : "#000000");

  const valid = HEX.test(draft);
  const shown = valid ? draft : lastValid.current;

  function openDialog(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (HEX.test(value)) lastValid.current = value;
    setDraft(value);
    setOpen(true);
  }

  function confirm(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!HEX.test(draft)) return;
    const color = draft.toLowerCase();
    lastValid.current = color;
    onChange(color);
    setOpen(false);
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") confirm();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="icon" aria-label="Escolher cor personalizada" title="Escolher cor personalizada" onClick={openDialog} className={cn("shrink-0 rounded-lg border-border bg-muted", className)}>
        <Palette />
      </Button>
      <DialogContent aria-describedby={undefined} onClick={event => event.stopPropagation()} className="color-picker max-w-xs rounded-lg border-border bg-popover p-5 text-popover-foreground">
        <DialogTitle>Cor personalizada</DialogTitle>
        <HexColorPicker color={shown} onChange={color => { setDraft(color); if (HEX.test(color)) lastValid.current = color; }} />
        <div className="mt-3 flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5">
          <span aria-hidden="true" className="size-9 shrink-0 rounded-md border border-border" style={{ background: shown }} />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Prévia</span>
            <span className="block truncate font-mono text-sm text-foreground">{shown.toUpperCase()}</span>
          </span>
        </div>
        <label className="mt-3 block text-xs font-mono text-muted-foreground">
          Código da cor
          <input aria-label="Código da cor" value={draft} maxLength={7} spellCheck={false} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!valid) setDraft(lastValid.current); }} onKeyDown={keyDown}
            className={cn("mt-1.5 w-full rounded-md border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring", valid ? "border-input" : "border-destructive")} />
        </label>
        <p className="mt-2 text-[11px] font-mono text-muted-foreground">A cor só entra em uso depois que você confirmar.</p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="rounded-md font-mono text-xs">
            <X /> Cancelar
          </Button>
          <Button type="button" size="sm" onClick={confirm} disabled={!valid} data-sound="success" className="rounded-md font-mono text-xs">
            <Check /> Confirmar cor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
