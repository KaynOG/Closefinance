import { useState } from "react";
import { ChevronDown, Search, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type IconOption = { id: string; label: string; icon: LucideIcon; image?: string };

export function IconPicker({ options, value, onChange, compact = false, label = "Escolher ícone" }: {
  options: IconOption[]; value: string; onChange: (value: string) => void; compact?: boolean; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find(option => option.id === value);
  const SelectedIcon = selected?.icon ?? Tag;
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const filtered = options.filter(option => normalize(option.label).includes(normalize(search)));
  const grid = <div className="icon-picker-grid" role="group" aria-label={label}>
    {filtered.map(({ id, label: name, icon: Icon, image }) => <Button key={id} type="button" variant="ghost" size="icon"
      title={name} aria-label={`Usar ícone ${name}`} aria-pressed={value === id}
      className="icon-picker-option" onClick={() => { onChange(id); setOpen(false); }}>{image ? <span className="brand-logo-surface size-8"><img src={image} alt="" className="size-6 object-contain" loading="lazy" /></span> : <Icon />}</Button>)}
    {filtered.length === 0 && <p className="col-span-full py-4 text-center text-sm text-muted-foreground">Nenhum ícone encontrado.</p>}
  </div>;
  if (!compact) return grid;
  return <Dialog open={open} onOpenChange={next => { setOpen(next); if (!next) setSearch(""); }}>
    <DialogTrigger asChild><Button type="button" variant="ghost" size="sm" aria-label={label}
      className="h-7 max-w-full gap-1.5 px-1.5 font-mono text-xs text-muted-foreground hover:text-primary">
      {selected?.image ? <img src={selected.image} alt="" className="size-5 object-contain" /> : <SelectedIcon />}<span className="truncate">{selected?.label ?? "Ícone"}</span><ChevronDown className="size-3" />
    </Button></DialogTrigger>
    <DialogContent className="max-w-md bg-popover text-popover-foreground">
      <DialogHeader><DialogTitle>Escolher ícone</DialogTitle><DialogDescription>{selected?.label ?? "Ícone"}</DialogDescription></DialogHeader>
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input aria-label="Buscar ícone" placeholder="Buscar ícone" value={search} onChange={event => setSearch(event.target.value)}
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none" />
      </div>{grid}
    </DialogContent>
  </Dialog>;
}