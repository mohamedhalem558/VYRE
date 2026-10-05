import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, message, duration = 3500 }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => toast({ type: "success", title, message }),
    [toast]
  );
  const error = useCallback(
    (message: string, title?: string) => toast({ type: "error", title, message }),
    [toast]
  );
  const info = useCallback(
    (message: string, title?: string) => toast({ type: "info", title, message }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-sm border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              t.type === "success"
                ? "bg-neutral-900/95 border-[#d4af37]/40 text-neutral-100"
                : t.type === "error"
                ? "bg-neutral-900/95 border-rose-500/50 text-neutral-100"
                : "bg-neutral-900/95 border-neutral-700 text-neutral-100"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === "success" && <CheckCircle2 className="h-4 w-4 text-[#d4af37]" />}
              {t.type === "error" && <AlertCircle className="h-4 w-4 text-rose-400" />}
              {t.type === "info" && <Info className="h-4 w-4 text-blue-400" />}
            </div>

            <div className="flex-1 min-w-0">
              {t.title && (
                <div className="text-xs font-bold uppercase tracking-wider text-white">
                  {t.title}
                </div>
              )}
              <div className="text-xs text-neutral-300 mt-0.5 leading-relaxed">{t.message}</div>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-neutral-500 hover:text-white p-0.5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
