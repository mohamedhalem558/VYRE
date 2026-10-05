import React from "react";
import { cn } from "../../utils/cn.js";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "destructive"
    | "gold"
    | "sale"
    | "new"
    | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-neutral-100 text-neutral-800 border-neutral-200",
    secondary: "bg-neutral-50 text-neutral-600 border-neutral-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    destructive: "bg-rose-50 text-rose-800 border-rose-200",
    gold: "bg-black text-white border-black font-bold",
    sale: "bg-black text-white font-bold border-black uppercase tracking-wider",
    new: "bg-neutral-100 text-neutral-900 font-bold border-neutral-300 uppercase tracking-wider",
    outline: "bg-transparent text-neutral-700 border-neutral-300",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xs border px-2 py-0.5 text-[10px] font-semibold tracking-wider transition-colors select-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
