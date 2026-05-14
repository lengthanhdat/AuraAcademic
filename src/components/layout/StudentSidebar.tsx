"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface SidebarProps {
  isCollapsed?: boolean;
  onClose?: () => void;
}

export function StudentSidebar({ isCollapsed = false, onClose }: SidebarProps) {
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
    <>
      {/* Mobile Backdrop overlay - Only active on mobile when expanded (!isCollapsed) */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-slate-950/30 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          !isCollapsed ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Main Collapsible & Responsive Aside Sidebar */}
      <aside className={`
        fixed md:sticky inset-y-0 left-0 z-50 bg-white/80 dark:bg-[#0A1F3E]/90 backdrop-blur-md py-8 flex flex-col border-r border-slate-200/40 dark:border-cyan-950/40 shrink-0 shadow-[4px_0_24px_-12px_rgba(12,46,94,0.08)]
        transition-all duration-300 ease-in-out
        ${isCollapsed 
          ? "-translate-x-full md:translate-x-0 md:w-[78px] px-3" 
          : "translate-x-0 w-64 px-5"
        }
      `}>
        {/* Logo Section */}
        <div className={`flex items-center mb-8 ${isCollapsed ? "justify-center" : "justify-between px-3"}`}>
          <div className="flex items-center transition-all">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              {isCollapsed ? (
                /* Mini Logo glowing badge when collapsed */
                <div className="w-10 h-10 rounded-xl bg-[#0C2E5E] flex items-center justify-center text-white shadow-lg shadow-[#0C2E5E]/15 dark:shadow-[#00C6FF]/10">
                  <span className="material-symbols-outlined text-xl text-[#00C6FF]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                </div>
              ) : (
                /* Full image logo when expanded */
                <img src="/logoweb.png" alt="AuraAcademic" className="h-9 object-contain transition-opacity duration-200 dark:brightness-110" />
              )}
            </Link>
          </div>
          
          {/* Mobile only X button inside Sidebar */}
          {!isCollapsed && (
            <button 
              onClick={onClose}
              className="md:hidden p-1 text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1.5">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center transition-all duration-300 active:scale-95 ${
                  isCollapsed 
                    ? "justify-center w-12 h-12 rounded-xl mx-auto" 
                    : "gap-3 px-4 py-3.5 rounded-2xl mx-2"
                } ${
                  active 
                    ? "bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] dark:from-[#0A1F3E] dark:to-[#0E3E7A] text-white font-extrabold shadow-lg shadow-[#0C2E5E]/15 dark:shadow-[#00C6FF]/10 border-l-4 border-[#00C6FF]" 
                    : "text-slate-500 dark:text-slate-400 font-semibold hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-[#0C2E5E]/5 dark:hover:bg-cyan-950/40"
                }`}
              >
                <span className={`material-symbols-outlined ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'} transition-transform ${isCollapsed ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                
                {/* Hide text entirely with animation control when collapsed */}
                {!isCollapsed && (
                  <span className="font-label text-sm tracking-wide whitespace-nowrap animate-fadeIn">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Elements Section */}
        <div className={`mt-auto pt-6 border-t border-slate-200/40 dark:border-cyan-950/40 flex flex-col space-y-1.5 ${isCollapsed ? "px-1" : "px-2"}`}>
          
          {/* Review box (Only shown when fully expanded) */}
          {!isCollapsed && (
            <div className="mb-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-cyan-950/30 border border-slate-100 dark:border-cyan-900/30">
              <p className="text-xs font-bold text-[#0C2E5E] dark:text-[#E2E8F0] mb-1 uppercase tracking-wider">{t("quick_review")}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{t("last_visit")}</p>
            </div>
          )}
          
          <Link 
            title={isCollapsed ? t("support") : ""}
            className={`flex items-center text-slate-500 dark:text-slate-400 font-medium hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-slate-100/50 dark:hover:bg-cyan-950/40 transition-all ${
              isCollapsed ? "justify-center w-12 h-12 rounded-xl mx-auto" : "gap-3 py-2.5 px-3 rounded-xl"
            }`}
            href="#"
          >
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">help_outline</span>
            {!isCollapsed && <span className="font-label text-sm tracking-wide">{t("support")}</span>}
          </Link>
          
          <Link 
            title={isCollapsed ? t("logout") : ""}
            onClick={() => localStorage.removeItem("user")} 
            className={`flex items-center text-slate-500 dark:text-slate-400 font-medium hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all ${
              isCollapsed ? "justify-center w-12 h-12 rounded-xl mx-auto" : "gap-3 py-2.5 px-3 rounded-xl"
            }`}
            href="/login"
          >
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">logout</span>
            {!isCollapsed && <span className="font-label text-sm tracking-wide">{t("logout")}</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
