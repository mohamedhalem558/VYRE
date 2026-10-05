import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "../../utils/cn.js";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
  className?: string;
  centered?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  viewAllLink,
  viewAllText = "View All",
  className,
  centered = false,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200/80 pb-4 mb-8",
        centered && "text-center items-center",
        className
      )}
    >
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
          {title}
        </h2>
        {subtitle && <p className="text-xs sm:text-sm text-neutral-500 max-w-xl">{subtitle}</p>}
      </div>

      {viewAllLink && (
        <Link
          to={viewAllLink}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-neutral-900 hover:text-neutral-600 transition-colors group shrink-0"
        >
          <span>{viewAllText}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
};
