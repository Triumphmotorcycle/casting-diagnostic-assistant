import * as React from "react";
import { cn } from "@/lib/utils";
type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "destructive" | "outline" };
export function Badge({ className, variant = "default", ...props }: BadgeProps) {
 const styles = { default: "border-transparent bg-teal-700 text-white", secondary: "border-transparent bg-slate-100 text-slate-800", destructive: "border-transparent bg-red-600 text-white", outline: "border-slate-300 text-current" };
 return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", styles[variant], className)} {...props} />;
}
