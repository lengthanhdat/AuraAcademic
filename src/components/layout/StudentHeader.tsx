"use client";

import { useEffect, useState } from "react";
import NotificationBell from "@/components/layout/NotificationBell";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function StudentHeader() {
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
    <header className="bg-[#f7f9fb] dark:bg-[#191c1e] z-50 h-16 flex justify-between items-center px-8 w-full mx-auto sticky top-0 border-none">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined md:hidden text-on-surface">menu</span>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00355f] flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-headline font-extrabold text-[#00355f] dark:text-white tracking-tight text-lg leading-none">AuraAcademic</span>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant mt-0.5">Smart Exam Engine</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-primary text-sm">timer</span>
          <span className="text-xs font-bold text-primary">{t("available")}</span>
        </div>
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high text-primary">
            <span className="material-symbols-outlined text-lg">schedule</span>
            <div className="leading-none">
              <p className="text-sm font-black tabular-nums">{timeStr}</p>
              <p className="text-[10px] font-semibold text-on-surface-variant mt-1">{dateStr}</p>
            </div>
          </div>
          <NotificationBell />
          <LanguageSwitcher />
        <div className="h-8 w-[1px] bg-outline-variant/30 hidden sm:block"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#00355f]">{user?.fullName || t("guest")}</p>
            <p className="text-[10px] text-on-surface-variant font-medium">{t("check_in")} {user?.id?.substring(0, 8) || "N/A"}</p>
          </div>
          <div className="relative">
            <img alt="Student profile" className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" src={user?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCZFtG_u-rS3DsADUCJpkoChXS1Rti1_JujgxPM1b3_G51c3VyV3QTNLCYxpt8TJFkI75-qPbFGOjPaoQZLH9Ca6PZN5lDPptIBl5B-yYIu1tafvbKTzCLi8yLm36uPsEML0e0tlqDo-_l6zzJ7G65J0-jXeEnW0eVixYpLmtFYV4GpUovPZrAMReqOMmiBRNKYWVu4pYpvjZ4jpybY1fgLfZcjMEbnGe1d_HEHLy_9wsi-HuRCpxrl9YmjH0LYMKcYQbUP6Mc8rkk"}/>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
