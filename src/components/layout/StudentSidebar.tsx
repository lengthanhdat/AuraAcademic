"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function StudentSidebar() {
  const pathname = usePathname();
  const t = useTranslations('StudentSidebar');

  const menuItems = [
    { label: t("menu.dashboard"), icon: "dashboard", href: "/student/dashboard" },
    { label: t("menu.exams"), icon: "quiz", href: "/student/exams" },
    { label: t("menu.results"), icon: "assignment_turned_in", href: "/student/results" },
    { label: t("menu.materials"), icon: "menu_book", href: "/student/materials" },
    { label: t("menu.profile"), icon: "manage_accounts", href: "/student/profile" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-[#f2f4f6] dark:bg-[#1f2224] py-8 sticky top-0 border-none shrink-0">
      <div className="px-8 mb-10">
        <h1 className="font-headline font-black text-[#00355f] dark:text-white text-2xl tracking-tight">Aura Academic</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 transition-all active:scale-98 ${
                active 
                  ? "bg-white dark:bg-[#191c1e] text-[#00355f] dark:text-[#ffffff] rounded-l-full ml-4 pl-4 py-3 font-bold shadow-sm" 
                  : "text-[#42474f] dark:text-[#c2c7d1] px-8 py-3 hover:text-[#00355f] dark:hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-8 mt-auto space-y-1 border-t border-outline-variant/10 pt-6">
        <div className="mb-6 p-4 rounded-xl bg-surface-container-highest/30">
          <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">{t("quick_review")}</p>
          <p className="text-[10px] text-on-surface-variant">{t("last_visit")}</p>
        </div>
        
        <Link className="flex items-center gap-3 text-[#42474f] dark:text-[#c2c7d1] py-2 hover:text-primary transition-all" href="#">
          <span className="material-symbols-outlined">help_outline</span>
          <span className="font-label text-sm">{t("support")}</span>
        </Link>
        
        <Link 
          onClick={() => localStorage.removeItem("user")} 
          className="flex items-center gap-3 text-[#42474f] dark:text-[#c2c7d1] py-2 hover:text-error transition-all" 
          href="/login"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label text-sm">{t("logout")}</span>
        </Link>
      </div>
    </aside>
  );
}
