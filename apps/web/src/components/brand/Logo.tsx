import React from "react";
import { cn } from "../../utils/cn.js";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  inverted?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className,
  size = "md",
  showTagline = false,
  inverted = false,
}) => {
  const sizeMap = {
    sm: "text-lg tracking-tight font-black",
    md: "text-2xl tracking-tighter font-black sm:text-3xl",
    lg: "text-3xl tracking-tighter font-black sm:text-4xl",
    xl: "text-5xl tracking-tighter font-black sm:text-6xl",
  };

  return (
    <div className={cn("inline-flex flex-col items-start select-none font-heading", className)}>
      <span
        className={cn(
          "font-black uppercase transition-opacity duration-200 hover:opacity-80 leading-none",
          inverted ? "text-white" : "text-black",
          sizeMap[size]
        )}
      >
        VYRE.
      </span>
      {showTagline && (
        <span
          className={cn(
            "text-[9px] uppercase tracking-[0.2em] font-semibold mt-1",
            inverted ? "text-neutral-400" : "text-neutral-500"
          )}
        >
          Built For Your Everyday
        </span>
      )}
    </div>
  );
};
