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

export function StudentHeader({ onMenuClick }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [now, setNow] = useState(new Date());
  const t = useTranslations('StudentHeader');

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

  return (
    <header className="bg-white/70 backdrop-blur-lg dark:bg-[#0A1F3E]/70 dark:border-cyan-950/40 z-40 h-16 flex justify-between items-center px-8 w-full mx-auto sticky top-0 border-b border-slate-200/40 shadow-[0_1px_2px_rgba(12,46,94,0.02)] transition-colors duration-300">
      <div className="flex items-center gap-4">
        {/* Hamburger button visible on ALL screens to collapse/expand */}
        <span 
          onClick={onMenuClick}
          className="material-symbols-outlined flex text-slate-600 dark:text-slate-400 cursor-pointer hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] p-1.5 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-lg transition-all select-none"
          title="Thu gọn / Mở rộng Sidebar"
        >
          menu
        </span>
        <div className="flex items-center gap-3 md:hidden">
          <Link href="/">
            <img src="/logoweb.png" alt="AuraAcademic" className="h-8 object-contain dark:brightness-110" />
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Available Badge */}
        <div className="hidden lg:flex items-center gap-2 bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50 px-3.5 py-1.5 rounded-full text-emerald-700 dark:text-emerald-400 shadow-sm">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-extrabold tracking-wide">{t("available")}</span>
        </div>

        {/* Live Clock Badge */}
        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0C2E5E]/5 border border-[#0C2E5E]/10 dark:bg-cyan-950/40 dark:border-cyan-900/30 text-[#0C2E5E] dark:text-[#E2E8F0] shadow-sm">
          <span className="material-symbols-outlined text-base text-[#00C6FF]">schedule</span>
          <div className="leading-none text-left">
            <p className="text-xs font-black tabular-nums text-[#0C2E5E] dark:text-[#E2E8F0]">{timeStr}</p>
            <p className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">{dateStr}</p>
          </div>
        </div>

        {/* Utility Items */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <NotificationBell />
          <LanguageSwitcher />
        </div>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

        {/* User Profile Dropdown Shell */}
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-[#0C2E5E] dark:text-slate-200 tracking-tight group-hover:text-[#00C6FF] transition-colors">{user?.fullName || t("guest")}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">{t("check_in")} {user?.id?.substring(0, 8) || "N/A"}</p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0C2E5E] to-[#00C6FF] rounded-full -m-[2px] p-[2px]"></div>
            <img 
              alt="Student profile" 
              className="h-9 w-9 rounded-full object-cover border border-white dark:border-[#0A1F3E] shadow-md relative z-10 bg-white" 
              src={user?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCZFtG_u-rS3DsADUCJpkoChXS1Rti1_JujgxPM1b3_G51c3VyV3QTNLCYxpt8TJFkI75-qPbFGOjPaoQZLH9Ca6PZN5lDPptIBl5B-yYIu1tafvbKTzCLi8yLm36uPsEML0e0tlqDo-_l6zzJ7G65J0-jXeEnW0eVixYpLmtFYV4GpUovPZrAMReqOMmiBRNKYWVu4pYpvjZ4jpybY1fgLfZcjMEbnGe1d_HEHLy_9wsi-HuRCpxrl9YmjH0LYMKcYQbUP6Mc8rkk"}
            />
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border border-white dark:border-[#0A1F3E] rounded-full z-20 shadow-sm"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
