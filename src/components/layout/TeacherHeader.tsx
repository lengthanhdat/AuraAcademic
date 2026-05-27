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

export function TeacherHeader({ onMenuClick }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [now, setNow] = useState(new Date());
  const t = useTranslations('Header');

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
    <header className="w-full h-16 sticky top-0 z-40 bg-white/70 backdrop-blur-lg dark:bg-[#0A1F3E]/70 dark:border-cyan-950/40 flex items-center justify-between px-8 border-b border-slate-200/40 shadow-[0_1px_2px_rgba(12,46,94,0.02)] transition-colors duration-300">
      <div className="flex items-center gap-4">
        {/* Collapse/Expand toggle always visible */}
        <span 
          onClick={onMenuClick}
          className="material-symbols-outlined flex text-slate-600 dark:text-slate-400 cursor-pointer hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] p-1.5 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-lg transition-all select-none"
          title="Thu gọn / Mở rộng Sidebar"
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
        {/* Search Pill */}
        <div className="hidden md:flex items-center bg-slate-100/70 hover:bg-slate-200/40 focus-within:bg-white dark:bg-cyan-950/30 dark:border-cyan-950/50 focus-within:dark:bg-[#0A1F3E]/80 border border-slate-200/50 focus-within:border-[#0C2E5E]/20 rounded-full px-4 py-1.5 shadow-inner-sm transition-all duration-300">
          <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg">search</span>
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm hidden lg:block w-64 placeholder-slate-400 dark:placeholder-slate-500 outline-none px-2 font-medium text-slate-600 dark:text-slate-200" 
            placeholder={t('search_placeholder')} 
            type="text"
          />
        </div>
        
        <div className="flex items-center gap-5">
          {/* Live Clock Badge */}
          <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0C2E5E]/5 border border-[#0C2E5E]/10 dark:bg-cyan-950/40 dark:border-cyan-900/30 text-[#0C2E5E] dark:text-[#E2E8F0] shadow-sm">
            <span className="material-symbols-outlined text-base text-[#00C6FF]">schedule</span>
            <div className="leading-none text-left">
              <p className="text-xs font-black tabular-nums text-[#0C2E5E] dark:text-[#E2E8F0]">{timeStr}</p>
              <p className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">{dateStr}</p>
            </div>
          </div>

          {/* Utilities */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />
            <LanguageSwitcher />
          </div>
          
          {/* Avatar & User Info Dropdown */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-[#0C2E5E] dark:text-slate-200 tracking-tight group-hover:text-[#00C6FF] transition-colors leading-none">{user?.fullName || t('teacher_default')}</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1.5 uppercase font-extrabold tracking-wider">{t('role_teacher')}</p>
            </div>
            <div className="relative">
              {user?.verificationStatus === "VERIFIED" ? (
                <div className="absolute inset-0 bg-gradient-to-tr from-[#00C6FF] via-[#0072FF] to-[#00F2FE] rounded-full -m-[3px] p-[3px] shadow-[0_0_10px_rgba(0,198,255,0.5)] animate-pulse"></div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0C2E5E] to-[#00C6FF] rounded-full -m-[2px] p-[2px]"></div>
              )}
              <img 
                alt="Giáo viên Profile" 
                className="w-9 h-9 rounded-full object-cover border border-white dark:border-[#0A1F3E] shadow-md relative z-10 bg-white" 
                src={user?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuA0pRLjsYNuYnvwUAtnEACdq-Kh3GGr4RXIQ29z1hKdw2IL9Q3KxPqR_zaLEFUB-LhS_5bmuZraE_8zRkSZ0FjUMOC287Q8Zkl54rOHbzGYFF5j0XNeYm0dQF26UPv9UprT-afl1-flyFIBUJ0CS0Mb4duE9PlwEEabSJag1HzkAOOF7b8iqUUoqy44mTWJx19DDBOv9SSz2yOTj06gVOgcvkE71qW2IFuOr23H5Zk9LQfc57GjVZ7O1Mhgm1UcA_lFRb_FzBp9SkQ"}
              />
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border border-white dark:border-[#0A1F3E] rounded-full z-20 shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
