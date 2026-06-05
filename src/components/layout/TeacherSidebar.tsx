"use client";

import { Link, usePathname, useRouter } from "@/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface SidebarProps {
  isCollapsed?: boolean;
  onClose?: () => void;
}

export function TeacherSidebar({ isCollapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
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
    { label: t("menu.exam_templates"), icon: "folder_special", href: "/teacher/exam-templates" },
    { label: t("menu.my_exams"), icon: "assignment", href: "/teacher/my-exams" },
    { label: t("menu.classrooms"), icon: "school", href: "/teacher/classrooms" },
    { label: t("menu.exam_bank"), icon: "local_library", href: "/teacher/exam-bank" },
    { label: t("menu.materials"), icon: "menu_book", href: "/teacher/materials" },
    { label: t("menu.reports"), icon: "assessment", href: "/teacher/reports" },
    { label: t("menu.notifications"), icon: "notifications", href: "/teacher/notifications" },
  ];

  const bottomItems = [
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
        fixed md:sticky top-0 h-screen left-0 z-50 bg-white/80 dark:bg-[#0A1F3E]/90 backdrop-blur-md py-6 flex flex-col border-r border-slate-200/40 dark:border-cyan-950/40 shrink-0 shadow-[4px_0_24px_-12px_rgba(12,46,94,0.08)]
        transition-all duration-300 ease-in-out
        ${isCollapsed 
          ? "-translate-x-full md:translate-x-0 md:w-[78px] !px-2.5" 
          : "translate-x-0 w-64 px-4"
        }
      `}>
        
        {/* Logo Section */}
        <div className={`relative flex items-center mb-6 shrink-0 ${isCollapsed ? "justify-center px-2" : "justify-center px-6 w-full"}`}>
          <Link href="/teacher/dashboard" className="group flex flex-col items-center justify-center transition-all duration-300">
            {isCollapsed ? (
              <div className="w-12 h-12 flex items-center justify-center hover:scale-105 transition-all">
                <Image src="/logoweb.png" width={180} height={44} alt="AuraAcademic Logo" className="h-5 w-auto object-contain dark:hidden" priority />
                <Image src="/logoweb-dark.png" width={180} height={44} alt="AuraAcademic Logo" className="h-5 w-auto object-contain hidden dark:block" priority />
              </div>
            ) : (
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
          
          {/* Close button (Mobile view only) */}
          {!isCollapsed && (
            <button 
              onClick={onClose}
              className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>


        {/* Main Navigation Links */}
        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : ""}
                 className={`flex items-center transition-all duration-300 group relative active:scale-95 ${
                  isCollapsed 
                    ? "justify-center w-11 h-11 rounded-xl mx-auto" 
                    : "space-x-3 px-4 py-2.5 rounded-xl mx-1"
                } ${
                  active 
                    ? "bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] dark:from-[#0A1F3E] dark:to-[#0E3E7A] text-white font-extrabold shadow-lg shadow-[#0C2E5E]/10 dark:shadow-[#00C6FF]/10 border-l-4 border-[#00C6FF]" 
                    : "text-slate-500 dark:text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-[#0C2E5E]/5 dark:hover:bg-cyan-950/40"
                }`}
              >
                <div className={`transition-all duration-300 flex items-center justify-center ${
                  isCollapsed ? "" : "w-7 h-7"
                } ${
                  active ? "scale-105 text-white" : "group-hover:scale-105 text-slate-400 group-hover:text-[#0C2E5E] dark:group-hover:text-[#00C6FF] dark:text-slate-500"
                }`}>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
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



        {/* Bottom Utility Items */}
        <div className={`pt-4 mt-2 shrink-0 border-t border-slate-200/40 dark:border-cyan-950/40 flex flex-col gap-1.5 ${isCollapsed ? "px-0" : "px-1"}`}>
          {bottomItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : ""}
                 className={`flex items-center transition-all duration-300 group active:scale-95 ${
                  isCollapsed 
                    ? "justify-center w-10 h-10 rounded-xl mx-auto" 
                    : "space-x-3 px-3 py-2 rounded-xl"
                } ${
                  active 
                    ? "bg-slate-100 dark:bg-[#051329]/60 text-[#0C2E5E] dark:text-slate-200 font-extrabold border-l-2 border-[#0C2E5E] dark:border-[#00C6FF]" 
                    : "text-slate-500 dark:text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-slate-50 dark:hover:bg-cyan-950/30"
                }`}
              >
                <div className={`transition-all duration-300 flex items-center justify-center ${
                  isCollapsed ? "" : "w-6 h-6"
                } group-hover:scale-105`}>
                   <span className={`material-symbols-outlined text-[18px] ${active ? 'text-[#0C2E5E] dark:text-slate-200' : 'text-slate-400 group-hover:text-[#0C2E5E] dark:group-hover:text-[#00C6FF] dark:text-slate-500'}`} style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
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
             className={`flex items-center text-slate-500 dark:text-slate-400 font-semibold hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 group mt-0.5 active:scale-95 ${
              isCollapsed 
                ? "justify-center w-10 h-10 rounded-xl mx-auto" 
                : "space-x-3 px-3 py-2 rounded-xl"
            }`} 
            href="/login"
          >
            <div className={`transition-transform duration-300 flex items-center justify-center ${
              isCollapsed ? "" : "w-6 h-6"
            } group-hover:scale-105`}>
              <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-500 group-hover:text-red-500">logout</span>
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
