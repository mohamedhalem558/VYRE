import React from "react";
import { cn } from "../../utils/cn.js";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99] select-none";

    const variants = {
      primary: "bg-black text-white hover:bg-neutral-800 font-semibold shadow-xs",
      secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-200",
      outline:
        "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 hover:border-neutral-900",
      ghost: "text-neutral-600 hover:text-black hover:bg-neutral-100",
      gold: "bg-black text-white font-bold hover:bg-neutral-800 shadow-sm",
      destructive: "bg-rose-600 text-white hover:bg-rose-700",
    };

    const sizes = {
      sm: "h-9 px-3.5 text-xs rounded-xs gap-1.5",
      md: "h-11 px-5 py-2.5 text-xs rounded-xs gap-2",
      lg: "h-12 px-8 text-sm rounded-xs gap-2.5 font-semibold",
      icon: "h-10 w-10 p-0 rounded-xs",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
