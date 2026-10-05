import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center flex-wrap gap-1.5 text-xs text-neutral-500">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-black transition-colors"
            title="Home"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-neutral-400 shrink-0" />
              {isLast || !item.href ? (
                <span className="font-semibold text-black truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-black transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
