"use client";

import { useEffect, useState } from "react";
import NotificationBell from "@/components/layout/NotificationBell";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Image from "next/image";

interface HeaderProps {
  onMenuClick?: () => void;
}

const getDisplayName = (user: any, fallback: string) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || fallback;

const getEmail = (user: any) =>
  user?.email || "";

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "HS";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

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
  const displayName = getDisplayName(user, t("guest"));
  const email = getEmail(user);
  const initials = getInitials(displayName);

  return (
    <header className="bg-white/80 backdrop-blur-xl dark:bg-[#0A1F3E]/80 dark:border-cyan-950/40 z-40 min-h-16 flex justify-between items-center gap-4 px-4 sm:px-6 lg:px-8 w-full mx-auto sticky top-0 border-b border-slate-200/60 shadow-[0_1px_2px_rgba(12,46,94,0.03)] transition-colors duration-300">
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
            <Image src="/logoweb.png" alt="AuraAcademic" width={180} height={44} className="h-8 w-auto object-contain dark:hidden" priority />
            <Image src="/logoweb-dark.png" alt="AuraAcademic" width={180} height={44} className="h-8 w-auto object-contain hidden dark:block" priority />
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-5">
        {/* Live Clock Badge */}
        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0C2E5E]/5 border border-[#0C2E5E]/10 dark:bg-cyan-950/40 dark:border-cyan-900/30 text-[#0C2E5E] dark:text-[#E2E8F0] shadow-sm">
          <span className="material-symbols-outlined text-base text-[#00C6FF]">schedule</span>
          <div className="leading-none text-left">
            <p className="text-xs font-black tabular-nums text-[#0C2E5E] dark:text-[#E2E8F0]">{timeStr}</p>
            <p className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">{dateStr}</p>
          </div>
        </div>

        {/* Utility Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <NotificationBell />
        </div>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

        {/* User Profile Dropdown Shell */}
        <div className="flex min-w-0 items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity group">
          <div className="text-right hidden sm:block">
            <p className="max-w-[180px] truncate text-sm font-black text-[#0C2E5E] dark:text-slate-200 tracking-tight group-hover:text-[#00C6FF] transition-colors">{displayName}</p>
            {email && <p className="max-w-[180px] truncate text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">{email}</p>}
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0C2E5E] to-[#00C6FF] rounded-full -m-[2px] p-[2px]"></div>
            {user?.avatarUrl ? (
              <Image 
                alt={displayName} 
                className="h-9 w-9 rounded-full object-cover border border-white dark:border-[#0A1F3E] shadow-md relative z-10 bg-white" 
                src={user.avatarUrl}
                width={36} height={36} unoptimized
              />
            ) : (
              <div className="h-9 w-9 rounded-full border border-white dark:border-[#0A1F3E] shadow-md relative z-10 bg-[#0C2E5E] dark:bg-cyan-950 text-white dark:text-cyan-100 flex items-center justify-center text-xs font-black">
                {initials}
              </div>
            )}
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border border-white dark:border-[#0A1F3E] rounded-full z-20 shadow-sm"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
