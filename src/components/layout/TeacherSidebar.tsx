"use client";

import { Link, usePathname } from "@/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

interface SidebarProps {
  isCollapsed?: boolean;
  onClose?: () => void;
}

export function TeacherSidebar({ isCollapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const t = useTranslations('Sidebar');

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const menuItems = [
    { label: t("menu.dashboard"), icon: "dashboard", href: "/teacher/dashboard" },
    { label: t("menu.exams"), icon: "magic_button", href: "/teacher/exams" },
    { label: t("menu.materials"), icon: "menu_book", href: "/teacher/materials" },
    { label: t("menu.monitoring"), icon: "videocam", href: "/teacher/monitoring" },
    { label: t("menu.reports"), icon: "assessment", href: "/teacher/reports" },
  ];

  const bottomItems = [
    { label: t("bottom.support"), icon: "help", href: "/teacher/support" },
    { label: t("bottom.profile"), icon: "manage_accounts", href: "/teacher/profile" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Backdrop overlay - Only active on mobile when expanded (!isCollapsed) */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-slate-950/30 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          !isCollapsed ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Main Aside Sidebar */}
      <aside className={`
        fixed md:sticky inset-y-0 left-0 z-50 bg-white/80 dark:bg-[#0A1F3E]/90 backdrop-blur-md py-8 flex flex-col border-r border-slate-200/40 dark:border-cyan-950/40 shrink-0 shadow-[4px_0_24px_-12px_rgba(12,46,94,0.08)]
        transition-all duration-300 ease-in-out
        ${isCollapsed 
          ? "-translate-x-full md:translate-x-0 md:w-[78px] !px-2.5" 
          : "translate-x-0 w-64 px-5"
        }
        space-y-6
      `}>
        
        {/* Logo Section */}
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between px-3 mb-2"}`}>
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            {isCollapsed ? (
              <div className="w-10 h-10 rounded-xl bg-[#0C2E5E] flex items-center justify-center text-white shadow-lg shadow-[#0C2E5E]/15 dark:shadow-[#00C6FF]/10">
                <span className="material-symbols-outlined text-xl text-[#00C6FF]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              </div>
            ) : (
              <img src="/logoweb.png" alt="AuraAcademic" className="h-9 object-contain transition-opacity duration-200 dark:brightness-110" />
            )}
          </Link>
          
          {/* Close button (Mobile view only) */}
          {!isCollapsed && (
            <button 
              onClick={onClose}
              className="md:hidden p-1 text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
        
        {/* Primary Action "Tạo đề thi" */}
        <div className={isCollapsed ? "px-0" : "px-1"}>
          <Link 
            href="/teacher/exams" 
            title={isCollapsed ? t("create_exam") : ""}
            className={`bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] dark:from-[#0A1F3E] dark:to-[#0E3E7A] text-white shadow-lg shadow-[#0C2E5E]/15 dark:shadow-[#00C6FF]/10 hover:shadow-cyan-400/10 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 border-l-4 border-[#00C6FF] font-bold text-sm flex items-center justify-center ${
              isCollapsed 
                ? "w-12 h-12 rounded-xl mx-auto p-0" 
                : "w-full py-3.5 px-4 rounded-2xl gap-2"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            {!isCollapsed && <span>{t("create_exam")}</span>}
          </Link>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center transition-all duration-300 group relative active:scale-95 ${
                  isCollapsed 
                    ? "justify-center w-12 h-12 rounded-xl mx-auto" 
                    : "space-x-3 px-4 py-3.5 rounded-2xl mx-1"
                } ${
                  active 
                    ? "bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] dark:from-[#0A1F3E] dark:to-[#0E3E7A] text-white font-extrabold shadow-lg shadow-[#0C2E5E]/10 dark:shadow-[#00C6FF]/10 border-l-4 border-[#00C6FF]" 
                    : "text-slate-500 dark:text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-[#0C2E5E]/5 dark:hover:bg-cyan-950/40"
                }`}
              >
                <div className={`transition-all duration-300 flex items-center justify-center ${
                  isCollapsed ? "" : "w-8 h-8"
                } ${
                  active ? "scale-110 text-white" : "group-hover:scale-110 text-slate-400 group-hover:text-[#0C2E5E] dark:group-hover:text-[#00C6FF] dark:text-slate-500"
                }`}>
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                    {item.icon}
                  </span>
                </div>
                
                {!isCollapsed && (
                  <span className="text-sm font-semibold tracking-wide whitespace-nowrap animate-fadeIn">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Language Switcher Container (Only visible when fully expanded) */}
        {!isCollapsed && (
          <div className="px-2 pt-2 transition-opacity duration-200">
            <div className="p-1 bg-slate-100/50 border border-slate-200/30 dark:bg-cyan-950/30 dark:border-cyan-950/40 rounded-xl">
              <LanguageSwitcher />
            </div>
          </div>
        )}

        {/* Bottom Utility Items */}
        <div className={`pt-4 border-t border-slate-200/40 dark:border-cyan-950/40 flex flex-col gap-1.5 ${isCollapsed ? "px-0" : "px-1"}`}>
          {bottomItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center transition-all duration-300 group active:scale-95 ${
                  isCollapsed 
                    ? "justify-center w-12 h-12 rounded-xl mx-auto" 
                    : "space-x-3 px-4 py-3 rounded-xl"
                } ${
                  active 
                    ? "bg-slate-100 dark:bg-[#051329]/60 text-[#0C2E5E] dark:text-slate-200 font-extrabold border-l-2 border-[#0C2E5E] dark:border-[#00C6FF]" 
                    : "text-slate-500 dark:text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-slate-50 dark:hover:bg-cyan-950/30"
                }`}
              >
                <div className={`transition-all duration-300 flex items-center justify-center ${
                  isCollapsed ? "" : "w-8 h-8"
                } group-hover:scale-110`}>
                  <span className={`material-symbols-outlined text-[22px] ${active ? 'text-[#0C2E5E] dark:text-slate-200' : 'text-slate-400 group-hover:text-[#0C2E5E] dark:group-hover:text-[#00C6FF] dark:text-slate-500'}`} style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                    {item.icon}
                  </span>
                </div>
                {!isCollapsed && (
                  <span className="text-sm font-semibold tracking-wide whitespace-nowrap animate-fadeIn">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
          
          <Link 
            title={isCollapsed ? t("bottom.logout") : ""}
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("accessToken");
            }} 
            className={`flex items-center text-slate-500 dark:text-slate-400 font-semibold hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 group mt-1 active:scale-95 ${
              isCollapsed 
                ? "justify-center w-12 h-12 rounded-xl mx-auto" 
                : "space-x-3 px-4 py-3 rounded-xl"
            }`} 
            href="/login"
          >
            <div className={`transition-transform duration-300 flex items-center justify-center ${
              isCollapsed ? "" : "w-8 h-8"
            } group-hover:scale-110`}>
              <span className="material-symbols-outlined text-[22px] text-slate-400 dark:text-slate-500 group-hover:text-red-500">logout</span>
            </div>
            {!isCollapsed && (
              <span className="text-sm tracking-wide whitespace-nowrap animate-fadeIn">
                {t("bottom.logout")}
              </span>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
