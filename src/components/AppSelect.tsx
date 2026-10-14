import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type OptionProps = { value?: string | number; disabled?: boolean; label?: string; children?: ReactNode };
type AppSelectProps = {
  value: string | number;
  onChange: (event: { target: { value: string } }) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
  "aria-label"?: string;
};

// Preserve existing option declarations and callbacks while rendering themed, accessible menus.
function items(children: ReactNode): ReactNode {
  return Children.toArray(children).map((child, index) => {
    if (!isValidElement<OptionProps>(child)) return null;
    if (child.type === Fragment) return <Fragment key={index}>{items(child.props.children)}</Fragment>;
    if (child.type === "optgroup") return <SelectGroup key={index}><SelectLabel>{child.props.label}</SelectLabel>{items(child.props.children)}</SelectGroup>;
    if (child.type !== "option") return null;
    if (child.props.disabled && child.props.value === undefined) return <SelectLabel key={index}>{child.props.children}</SelectLabel>;
    return <SelectItem key={index} value={`option:${child.props.value ?? ""}`} disabled={child.props.disabled}
      className="cursor-pointer rounded-md py-2.5 font-mono text-xs focus:bg-primary/15 focus:text-foreground data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary">{child.props.children}</SelectItem>;
  });
}

export function AppSelect({ value, onChange, children, className, disabled, id, name, required, "aria-label": ariaLabel }: AppSelectProps) {
  return <Select value={`option:${value}`} onValueChange={next => onChange({ target: { value: next.slice(7) } })} disabled={disabled} name={name} required={required}>
    <SelectTrigger id={id} aria-label={ariaLabel} className={cn(className, "min-w-0 gap-2 rounded-md border-border bg-muted/40 text-foreground font-mono hover:bg-muted/60 focus:ring-primary/40 [&>span]:truncate")}><SelectValue /></SelectTrigger>
    <SelectContent className="max-w-[calc(100vw-2rem)] border-border bg-popover text-popover-foreground shadow-[var(--panel-lift-shadow)] motion-reduce:animate-none">{items(children)}</SelectContent>
  </Select>;
}