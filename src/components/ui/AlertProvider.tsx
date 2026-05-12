"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type AlertType = "info" | "success" | "warning" | "error" | "confirm";

export interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  autoClose?: boolean;
  duration?: number;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const redirectToMaintenance = () => {
      const path = window.location.pathname;
      const localeMatch = path.match(/^\/(vi|en)(?=\/|$)/);
      const maintenancePath = localeMatch ? `/${localeMatch[1]}/maintenance` : "/maintenance";
      // Dùng includes() để hỗ trợ các đường dẫn đã localization như /vi/maintenance, /en/admin...
      if (!path.includes("/admin") && !path.includes("/maintenance") && !path.includes("/login")) {
        localStorage.setItem("prevPath", path + window.location.search);
        window.location.href = maintenancePath;
      }
    };

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await originalFetch(...args);
      if (response.status === 503) {
        redirectToMaintenance();
      }
      return response;
    };

    // Polling phát hiện bảo trì thời gian thực khi người dùng đang treo máy
    const interval = setInterval(async () => {
      const path = window.location.pathname;
      if (path.includes("/admin") || path.includes("/maintenance") || path.includes("/login")) return;

      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const res = await originalFetch("http://localhost:8088/api/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 503) {
          redirectToMaintenance();
        }
      } catch {
        // Bỏ qua lỗi kết nối tạm thời
      }
    }, 4000);

    return () => {
      window.fetch = originalFetch;
      clearInterval(interval);
    };
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300); // match transition duration
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const type = options?.type || "info";
  const isConfirm = type === "confirm";
  const shouldAutoClose = type === "success" || options?.autoClose;

  useEffect(() => {
    if (isOpen && shouldAutoClose) {
      const duration = options?.duration || 2000;
      const timer = setTimeout(() => {
        if (options?.onConfirm) options.onConfirm();
        setIsOpen(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldAutoClose, options]);

  const showAlert = (alertOptions: AlertOptions) => {
    setOptions(alertOptions);
    setIsOpen(true);
  };

  const closeAlert = () => {
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (options?.onConfirm) options.onConfirm();
    closeAlert();
  };

  const handleCancel = () => {
    if (options?.onCancel) options.onCancel();
    closeAlert();
  };

  const getIcon = () => {
    switch (type) {
      case "success": return (
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90 animate-[spin_1.5s_linear_infinite]">
            <circle
              cx="16"
              cy="16"
              r="14"
              className="stroke-emerald-500/10 fill-none"
              strokeWidth="2"
            />
            <circle
              cx="16"
              cy="16"
              r="14"
              className="stroke-emerald-400 fill-none"
              strokeWidth="2"
              strokeDasharray="88"
              strokeDashoffset="30"
            />
          </svg>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 scale-110" />
        </div>
      );
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "error": return <XCircle className="w-5 h-5 text-rose-400" />;
      case "confirm": return <AlertTriangle className="w-5 h-5 text-primary" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case "success": return "bg-emerald-500/10 border-emerald-500/20 p-0"; // remove padding for success since SVG is styled inside
      case "warning": return "bg-amber-500/10 border-amber-500/20 p-2";
      case "error": return "bg-rose-500/10 border-rose-500/20 p-2";
      case "confirm": return "bg-primary/10 border-primary/20 p-2";
      default: return "bg-blue-500/10 border-blue-500/20 p-2";
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      
      {isRendered && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className={cn(
              "absolute inset-0 bg-surface/60 backdrop-blur-sm transition-opacity duration-300",
              isOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={!isConfirm && !shouldAutoClose ? closeAlert : undefined}
          />

          {/* Modal */}
          <div 
            className={cn(
              "relative w-full max-w-[300px] overflow-hidden rounded-2xl bg-surface-container border border-outline-variant/20 shadow-xl transition-all duration-300 transform",
              isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Top Glow Accent */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-[3px]",
              type === "success" ? "bg-emerald-500" : 
              type === "warning" ? "bg-amber-500" : 
              type === "error" ? "bg-rose-500" : 
              type === "confirm" ? "bg-primary" : "bg-blue-500"
            )} />

            {/* Close Button (for non-confirm and non-autoclose) */}
            {!isConfirm && !shouldAutoClose && (
              <button 
                onClick={closeAlert}
                className="absolute top-2.5 right-2.5 p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="p-5 pb-4 flex flex-col items-center text-center">
              {/* Icon Container */}
              <div className={cn("rounded-full border mb-3 flex items-center justify-center", getIconBg())}>
                {getIcon()}
              </div>

              {/* Typography */}
              <h3 className="text-sm font-bold text-on-surface mb-1 tracking-tight">
                {options?.title}
              </h3>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {options?.message}
              </p>
            </div>

            {/* Actions (Hidden for success / auto-closing modals) */}
            {!shouldAutoClose && (
              <div className="px-5 pb-5 flex gap-2 w-full">
                {isConfirm && (
                  <button 
                    onClick={handleCancel}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-colors"
                  >
                    {options?.cancelText || "Hủy bỏ"}
                  </button>
                )}
                <button 
                  onClick={handleConfirm}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-xs font-bold text-white shadow-md transition-all active:scale-[0.98]",
                    type === "error" ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/10" :
                    options?.type === "success" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10" :
                    "signature-gradient shadow-primary/10 hover:opacity-90"
                  )}
                >
                  {options?.confirmText || "Xác nhận"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
