import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button.js";
import { cn } from "../../utils/cn.js";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  actionLink,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-16 text-center rounded-lg border border-neutral-200 bg-neutral-50/50",
        className
      )}
    >
      <div className="h-16 w-16 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 mb-4 shadow-xs">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight text-neutral-900 mb-2">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && actionLink ? (
        <Link to={actionLink}>
          <Button variant="primary" size="md">
            {actionText}
          </Button>
        </Link>
      ) : actionText && onAction ? (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      ) : null}
    </div>
  );
};
