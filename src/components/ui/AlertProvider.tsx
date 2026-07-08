"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_ORIGIN } from "@/lib/api";

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
      const requestUrl = typeof args[0] === "string" ? args[0] : args[0] instanceof Request ? args[0].url : String(args[0]);
      const url = new URL(requestUrl, window.location.origin);
      const backendOrigin = new URL(API_ORIGIN, window.location.origin).origin;

      if (response.status === 503 && url.origin === backendOrigin) {
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
        const res = await originalFetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/users/me", {
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
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300); // match transition duration
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
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
        </div>
      );
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "error": return <XCircle className="w-5 h-5 text-rose-400" />;
      case "confirm": return <AlertTriangle className="w-5 h-5 text-primary" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getAlertTheme = () => {
    switch (type) {
      case "success":
        return { color: "#34d399", gradient: "linear-gradient(to bottom, #22c55e, #14b8a6, #2eadff)" };
      case "warning":
        return { color: "#fbbf24", gradient: "linear-gradient(to bottom, #f59e0b, #f97316, #ef4444)" };
      case "error":
        return { color: "#fb7185", gradient: "linear-gradient(to bottom, #fb7185, #ef4444, #be123c)" };
      case "confirm":
        return { color: "#a78bfa", gradient: "linear-gradient(to bottom, #2eadff, #7c3aed, #a855f7)" };
      default:
        return { color: "#32a6ff", gradient: "linear-gradient(to bottom, #2eadff, #3d83ff, #7e61ff)" };
    }
  };

  const alertTheme = getAlertTheme();

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      
      {isRendered && (
        <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] justify-end sm:right-6 sm:top-6 sm:w-auto">
          <div
            className={cn(
              "pointer-events-auto group isolate relative min-h-24 w-full max-w-[17rem] overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_18px_45px_-22px_rgba(12,46,94,0.45)] backdrop-blur-2xl transition-all duration-300 dark:border-white/10 dark:bg-slate-950/65 dark:shadow-[0_18px_45px_-20px_rgba(0,0,0,0.75)]",
              isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-3 scale-95"
            )}
            style={{
              "--alert-gradient": alertTheme.gradient,
              "--alert-color": alertTheme.color,
            } as React.CSSProperties}
            role={isConfirm ? "dialog" : "status"}
            aria-live={isConfirm ? undefined : "polite"}
          >
            <div className="absolute bottom-2 left-1.5 top-2 z-[4] w-1 rounded-full bg-[image:var(--alert-gradient)] transition-transform duration-300 group-hover:translate-x-0.5" />
            <div className="absolute inset-0 z-[1] bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.24)_45%,rgba(255,255,255,0.08))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05)_45%,rgba(255,255,255,0.02))]" />
            <div className="absolute inset-px z-[2] rounded-[0.9375rem] border border-white/40 bg-white/40 dark:border-white/10 dark:bg-slate-950/35" />
            <div className="absolute -left-20 -top-24 z-[3] h-56 w-56 rounded-full bg-[radial-gradient(circle_closest-side_at_center,white,transparent)] opacity-40 blur-sm transition-opacity duration-300 group-hover:opacity-60 dark:opacity-10 dark:group-hover:opacity-20" />
            <div className="absolute -bottom-28 right-0 z-[3] h-64 w-64 rounded-full bg-[radial-gradient(circle_closest-side_at_center,var(--alert-color),transparent)] opacity-10 transition-opacity duration-300 group-hover:opacity-20 dark:opacity-15 dark:group-hover:opacity-25" />

            {!isConfirm && !shouldAutoClose && (
              <button
                onClick={closeAlert}
                className="absolute right-3 top-3 z-[6] grid h-7 w-7 place-items-center rounded-full text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="relative z-[5] flex min-h-24 flex-col px-4 py-3 pl-7">
              <div className="mb-2 flex items-center gap-2.5 transition-transform duration-300 group-hover:translate-x-0.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/60 bg-white/45 text-[var(--alert-color)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/10 dark:bg-white/[0.06]">
                  {getIcon()}
                </div>
                <h3 className="min-w-0 pr-6 text-sm font-semibold leading-snug text-[var(--alert-color)]">
                  {options?.title}
                </h3>
              </div>
              <p className="pr-2 text-xs font-semibold leading-5 text-slate-600 transition-transform duration-300 group-hover:translate-x-1 dark:text-slate-300">
                {options?.message}
              </p>

              {!shouldAutoClose && (
                <div className="mt-4 flex gap-2">
                  {isConfirm && (
                    <button
                      onClick={handleCancel}
                      className="flex-1 rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                    >
                      {options?.cancelText || "Hủy bỏ"}
                    </button>
                  )}
                  <button
                    onClick={handleConfirm}
                    className="flex-1 rounded-xl bg-[image:var(--alert-gradient)] px-3 py-2 text-xs font-bold text-white shadow-lg transition-opacity hover:opacity-90"
                  >
                    {options?.confirmText || "Xác nhận"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
