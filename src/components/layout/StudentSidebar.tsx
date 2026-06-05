"use client";

import { Link, usePathname } from "@/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";

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
    { label: t("menu.classrooms"), icon: "school", href: "/student/classrooms" },
    { label: t("menu.exam_bank"), icon: "local_library", href: "/student/exam-bank" },
    { label: t("menu.materials"), icon: "menu_book", href: "/student/materials" },
    { label: t("menu.notifications"), icon: "notifications", href: "/student/notifications" },
    { label: t("menu.profile"), icon: "manage_accounts", href: "/student/profile" },
  ];

  const isActive = (href: string) => {
    if (href === "/student/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

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
        fixed md:sticky top-0 h-screen left-0 z-50 bg-white/80 dark:bg-[#0A1F3E]/90 backdrop-blur-md py-6 flex flex-col border-r border-slate-200/40 dark:border-cyan-950/40 shrink-0 shadow-[4px_0_24px_-12px_rgba(12,46,94,0.08)]
        transition-all duration-300 ease-in-out
        ${isCollapsed 
          ? "-translate-x-full md:translate-x-0 md:w-[78px] px-3" 
          : "translate-x-0 w-64 px-5"
        }
      `}>
        {/* Logo Section */}
        <div className={`relative flex items-center mb-6 shrink-0 ${isCollapsed ? "justify-center px-2" : "justify-center px-6 w-full"}`}>
          <Link href="/student/dashboard" className="group flex flex-col items-center justify-center transition-all duration-300">
            {isCollapsed ? (
              <div className="w-12 h-12 flex items-center justify-center hover:scale-105 transition-all">
                <Image src="/logoweb.png" width={180} height={44} alt="AuraAcademic Logo" className="h-5 w-auto object-contain dark:hidden" priority />
                <Image src="/logoweb-dark.png" width={180} height={44} alt="AuraAcademic Logo" className="h-5 w-auto object-contain hidden dark:block" priority />
              </div>
            ) : (
              /* Center and scale up the vertical logo in a premium card */
              <div className="flex flex-col items-center justify-center py-2 w-full transition-all duration-300">
                <Image 
                  src="/logoweb.png" 
                  alt="AuraAcademic" 
                  width={180} height={44}
                  className="h-16 w-auto object-contain transition-all duration-300 group-hover:scale-[1.04] dark:hidden" 
                  priority
                />
                <Image 
                  src="/logoweb-dark.png" 
                  alt="AuraAcademic" 
                  width={180} height={44}
                  className="h-16 w-auto object-contain transition-all duration-300 group-hover:scale-[1.04] hidden dark:block" 
                  priority
                />
              </div>
            )}
          </Link>
          
          {/* Mobile only floating X button inside Sidebar */}
          {!isCollapsed && (
            <button 
              onClick={onClose}
              className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center transition-all duration-300 active:scale-95 ${
                  isCollapsed 
                    ? "justify-center w-11 h-11 rounded-xl mx-auto" 
                    : "gap-3 px-4 py-2.5 rounded-xl mx-1"
                } ${
                  active 
                    ? "bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] dark:from-[#0A1F3E] dark:to-[#0E3E7A] text-white font-extrabold shadow-lg shadow-[#0C2E5E]/15 dark:shadow-[#00C6FF]/10 border-l-4 border-[#00C6FF]" 
                    : "text-slate-500 dark:text-slate-400 font-semibold hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-[#0C2E5E]/5 dark:hover:bg-cyan-950/40"
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'} transition-transform ${isCollapsed ? 'scale-105' : ''}`}>
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
        <div className={`mt-2 shrink-0 pt-4 border-t border-slate-200/40 dark:border-cyan-950/40 flex flex-col gap-1.5 ${isCollapsed ? "px-1" : "px-2"}`}>
          

          
          <Link 
            title={isCollapsed ? t("logout") : ""}
            onClick={() => localStorage.removeItem("user")} 
            className={`flex items-center text-slate-500 dark:text-slate-400 font-medium hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all ${
              isCollapsed ? "justify-center w-10 h-10 rounded-xl mx-auto" : "gap-3 py-2 px-3 rounded-xl"
            }`}
            href="/login"
          >
            <span className="material-symbols-outlined text-[20px] text-slate-400 dark:text-slate-500">logout</span>
            {!isCollapsed && <span className="font-label text-sm tracking-wide">{t("logout")}</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
