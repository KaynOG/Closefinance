import { useRef, useState, type CSSProperties } from "react";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppSelect } from "@/components/AppSelect";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  type?: "date" | "month";
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
};

const months = Array.from({ length: 12 }, (_, i) => format(new Date(2020, i, 1), "MMMM", { locale: ptBR }));
const parse = (value?: string) => {
  if (!value) return undefined;
  const date = parseISO(value.length === 7 ? `${value}-01` : value);
  return isValid(date) ? date : undefined;
};

// Keep local ISO values and existing callbacks; only the date-selection surface changes.
export function AppDatePicker({ value, onChange, type = "date", min, max, required, disabled, id, name, className, style, "aria-label": label }: Props) {
  const [open, setOpen] = useState(false);
  const selected = parse(value);
  const [visible, setVisible] = useState(selected ?? new Date());
  const trigger = useRef<HTMLButtonElement>(null);
  const start = parse(min);
  const end = parse(max);
  const firstYear = start?.getFullYear() ?? 1900;
  const lastYear = end?.getFullYear() ?? Math.max(2100, new Date().getFullYear() + 50);
  const year = visible.getFullYear();
  const years = Array.from({ length: Math.max(1, lastYear - firstYear + 1) }, (_, i) => firstYear + i);
  function choose(next: string) {
    if ((min && next < min) || (max && next > max)) return;
    onChange({ target: { value: next } });
    setOpen(false);
  }
  return (
    <Popover open={open} onOpenChange={next => {
      if (next) setVisible(selected ?? new Date());
      setOpen(next);
    }}>
      <input type="text" className="sr-only" tabIndex={-1} aria-hidden="true" name={name} value={value} required={required} disabled={disabled}
        onChange={() => {}} onInvalid={event => { event.preventDefault(); trigger.current?.focus(); setOpen(true); }} />
      <PopoverTrigger asChild>
        <Button ref={trigger} id={id} type="button" variant="outline" disabled={disabled} aria-label={label} aria-required={required}
          data-date-picker={type} style={style}
          className={cn("h-auto min-h-10 w-full min-w-0 justify-between gap-2 rounded-md border-border bg-muted/40 px-3 py-2.5 text-left font-mono text-sm font-normal text-foreground hover:bg-muted/60", className)}>
          <span className="min-w-0 truncate">{selected ? format(selected, type === "month" ? "MMMM 'de' yyyy" : "dd/MM/yyyy", { locale: ptBR }) : type === "month" ? "Selecionar mês" : "Selecionar data"}</span>
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="pointer-events-auto w-auto max-w-[calc(100vw-2rem)] rounded-lg border-border bg-popover p-0 font-mono text-popover-foreground shadow-[var(--panel-lift-shadow)]">
        {type === "month" ? (
          <div className="w-72 max-w-full p-3">
            <AppSelect aria-label="Ano" value={year} onChange={event => setVisible(new Date(Number(event.target.value), visible.getMonth(), 1))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </AppSelect>
            <div className="mt-3 grid grid-cols-3 gap-1">
              {months.map((month, index) => {
                const next = `${year}-${String(index + 1).padStart(2, "0")}`;
                return <Button key={month} type="button" size="sm" variant={value === next ? "default" : "ghost"} className="capitalize" disabled={Boolean((min && next < min) || (max && next > max))} onClick={() => choose(next)}>{month.slice(0, 3)}</Button>;
              })}
            </div>
          </div>
        ) : (
          <Calendar locale={ptBR} mode="single" selected={selected} month={visible} onMonthChange={setVisible} captionLayout="dropdown" startMonth={new Date(firstYear, 0)} endMonth={new Date(lastYear, 11)}
            disabled={date => Boolean((start && date < start) || (end && date > end))} onSelect={date => { if (date) choose(format(date, "yyyy-MM-dd")); }} autoFocus className="pointer-events-auto rounded-lg bg-popover p-3"
            components={{ Dropdown: ({ options, value: current, onChange: change, "aria-label": ariaLabel }) => (
              <AppSelect aria-label={ariaLabel} value={current ?? ""} onChange={event => change?.({ target: { value: event.target.value } } as React.ChangeEvent<HTMLSelectElement>)} className="h-8 w-auto max-w-36 border-transparent px-2 py-1 text-xs">
                {options?.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
              </AppSelect>
            ) }} />
        )}
        <div className="flex justify-between border-t border-border p-2">
          <Button type="button" size="sm" variant="ghost" disabled={Boolean((min && format(new Date(), type === "month" ? "yyyy-MM" : "yyyy-MM-dd") < min) || (max && format(new Date(), type === "month" ? "yyyy-MM" : "yyyy-MM-dd") > max))} onClick={() => choose(format(new Date(), type === "month" ? "yyyy-MM" : "yyyy-MM-dd"))}>Hoje</Button>
          {!required && <Button type="button" size="sm" variant="ghost" onClick={() => { onChange({ target: { value: "" } }); setOpen(false); }}>Limpar</Button>}
        </div>
      </PopoverContent>
    </Popover>
  );
}