"use client";
import { useEffect, useState } from "react";
import NotificationBell from "@/components/layout/NotificationBell";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function TeacherHeader() {
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
    <header className="w-full h-16 sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-8 border-none">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined md:hidden text-on-surface">menu</span>
        <div className="hidden md:flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00355f] flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-blue-900 dark:text-blue-50 font-headline leading-none">AuraAcademic</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mt-1">Smart Exam Engine</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-900 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
          <input className="bg-transparent border-none focus:ring-0 text-sm hidden lg:block w-64 placeholder-slate-400 outline-none px-2" placeholder={t('search_placeholder')} type="text"/>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-blue-900 dark:text-blue-50">
            <span className="material-symbols-outlined text-lg text-blue-600">schedule</span>
            <div className="leading-none">
              <p className="text-sm font-black tabular-nums">{timeStr}</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">{dateStr}</p>
            </div>
          </div>
          <NotificationBell />
          <LanguageSwitcher />
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-blue-900 leading-none">{user?.fullName || t('teacher_default')}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">{t('role_teacher')}</p>
            </div>
            <img alt="Giáo viên Profile" className="w-10 h-10 rounded-full object-cover border-2 border-blue-900/10" src={user?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuA0pRLjsYNuYnvwUAtnEACdq-Kh3GGr4RXIQ29z1hKdw2IL9Q3KxPqR_zaLEFUB-LhS_5bmuZraE_8zRkSZ0FjUMOC287Q8Zkl54rOHbzGYFF5j0XNeYm0dQF26UPv9UprT-afl1-flyFIBUJ0CS0Mb4duE9PlwEEabSJag1HzkAOOF7b8iqUUoqy44mTWJx19DDBOv9SSz2yOTj06gVOgcvkE71qW2IFuOr23H5Zk9LQfc57GjVZ7O1Mhgm1UcA_lFRb_FzBp9SkQ"}/>
          </div>
        </div>
      </div>
    </header>
  );
}
