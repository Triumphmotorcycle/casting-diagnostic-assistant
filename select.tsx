import * as React from "react";
import { cn } from "@/lib/utils";

type SelectItemData = { value: string; label: string };
type SelectContextValue = { value?: string; onValueChange?: (value: string) => void };
const SelectContext = React.createContext<SelectContextValue>({});

function collectItems(node: React.ReactNode): SelectItemData[] {
  const items: SelectItemData[] = [];
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      const props = child.props as { value: string; children?: React.ReactNode };
      const label = typeof props.children === "string" ? props.children : String(props.value);
      items.push({ value: props.value, label });
    } else {
      const props = child.props as { children?: React.ReactNode };
      if (props.children) items.push(...collectItems(props.children));
    }
  });
  return items;
}

export function Select({ value, defaultValue, onValueChange, children, disabled }: { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; children: React.ReactNode; disabled?: boolean }) {
  const items = collectItems(children);
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const selected = value ?? internalValue;
  return <SelectContext.Provider value={{ value: selected, onValueChange: (next) => { if (value === undefined) setInternalValue(next); onValueChange?.(next); } }}>
    <select aria-label="Choose an option" disabled={disabled} value={selected} onChange={(event) => { if (value === undefined) setInternalValue(event.target.value); onValueChange?.(event.target.value); }} className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50">
      {items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
  </SelectContext.Provider>;
}
export function SelectTrigger({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("hidden", className)} {...props}>{children}</div>; }
export function SelectContent({ children }: { children?: React.ReactNode }) { return <>{children}</>; }
export function SelectItem(_props: { value: string; children: React.ReactNode }) { return null; }
export function SelectValue(_props: { placeholder?: string }) { return null; }
