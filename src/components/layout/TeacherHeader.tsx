"use client";

import { useEffect, useState } from "react";
import NotificationBell from "@/components/layout/NotificationBell";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface HeaderProps {
  onMenuClick?: () => void;
}

const getDisplayName = (user: any, fallback: string) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || fallback;

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "GV";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

export function TeacherHeader({ onMenuClick }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [now, setNow] = useState(new Date());
  const t = useTranslations("Header");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    loadUser();
    window.addEventListener("user-updated", loadUser);
    window.addEventListener("storage", loadUser);

    return () => {
      clearInterval(timer);
      window.removeEventListener("user-updated", loadUser);
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
  const displayName = getDisplayName(user, t("teacher_default"));
  const email = user?.email || "";
  const initials = getInitials(displayName);

  return (
    <header className="w-full h-16 sticky top-0 z-40 bg-white/70 backdrop-blur-lg dark:bg-[#0A1F3E]/70 dark:border-cyan-950/40 flex items-center justify-between px-8 border-b border-slate-200/40 shadow-[0_1px_2px_rgba(12,46,94,0.02)] transition-colors duration-300">
      <div className="flex items-center gap-4">
        <span
          onClick={onMenuClick}
          className="material-symbols-outlined flex text-slate-600 dark:text-slate-400 cursor-pointer hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] p-1.5 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-lg transition-all select-none"
          title="Toggle sidebar"
        >
          menu
        </span>
        <div className="flex items-center gap-3 md:hidden">
          <Link href="/">
            <img src="/logoweb.png" alt="AuraAcademic" className="h-8 object-contain dark:hidden" />
            <img src="/logoweb-dark.png" alt="AuraAcademic" className="h-8 object-contain hidden dark:block" />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0C2E5E]/5 border border-[#0C2E5E]/10 dark:bg-cyan-950/40 dark:border-cyan-900/30 text-[#0C2E5E] dark:text-[#E2E8F0] shadow-sm">
            <span className="material-symbols-outlined text-base text-[#00C6FF]">schedule</span>
            <div className="leading-none text-left">
              <p className="text-xs font-black tabular-nums text-[#0C2E5E] dark:text-[#E2E8F0]">{timeStr}</p>
              <p className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">{dateStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />
            <LanguageSwitcher />
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity group">
            <div className="text-right hidden sm:block">
              <p className="max-w-[180px] truncate text-sm font-black text-[#0C2E5E] dark:text-slate-200 tracking-tight group-hover:text-[#00C6FF] transition-colors">{displayName}</p>
              {email && <p className="max-w-[180px] truncate text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">{email}</p>}
            </div>
            <div className="relative">
              {user?.verificationStatus === "VERIFIED" ? (
                <div className="absolute inset-0 bg-gradient-to-tr from-[#00C6FF] via-[#0072FF] to-[#00F2FE] rounded-full -m-[3px] p-[3px] shadow-[0_0_10px_rgba(0,198,255,0.5)] animate-pulse"></div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0C2E5E] to-[#00C6FF] rounded-full -m-[2px] p-[2px]"></div>
              )}
              {user?.avatarUrl ? (
                <img
                  alt={displayName}
                  className="w-9 h-9 rounded-full object-cover border border-white dark:border-[#0A1F3E] shadow-md relative z-10 bg-white"
                  src={user.avatarUrl}
                />
              ) : (
                <div className="w-9 h-9 rounded-full border border-white dark:border-[#0A1F3E] shadow-md relative z-10 bg-[#0C2E5E] dark:bg-cyan-950 text-white dark:text-cyan-100 flex items-center justify-center text-xs font-black">
                  {initials}
                </div>
              )}
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border border-white dark:border-[#0A1F3E] rounded-full z-20 shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
