"use client";
import { Link, usePathname } from "@/navigation";
import { useRouter } from "next/navigation";

const navSections = [
  {
    title: "TỔNG QUAN",
    items: [
      { href: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
      { href: "/admin/analytics", icon: "bar_chart", label: "Thống kê & Báo cáo" },
      { href: "/admin/chat", icon: "forum", label: "Hỗ trợ trực tuyến" },
    ],
  },
  {
    title: "QUẢN LÝ",
    items: [
      { href: "/admin/users", icon: "group", label: "Người dùng" },
      { href: "/admin/verifications", icon: "verified", label: "Xác thực giáo viên" },
      { href: "/admin/roles", icon: "admin_panel_settings", label: "Phân quyền RBAC" },
      { href: "/admin/exams", icon: "quiz", label: "Quản lý Bài thi" },
      { href: "/admin/my-exams", icon: "magic_button", label: "Thiết kế & Kho đề cá nhân" },
      { href: "/admin/exam-bank", icon: "folder_special", label: "Ngân hàng chuyên đề" },
      { href: "/admin/folders", icon: "create_new_folder", label: "Quản lý Chuyên đề" },
      { href: "/admin/materials", icon: "menu_book", label: "Tài liệu hệ thống" },
      { href: "/admin/content", icon: "article", label: "Nội dung & Media" },
    ],
  },
  {
    title: "BẢO MẬT",
    items: [
      { href: "/admin/audit-logs", icon: "policy", label: "Audit Logs" },
      { href: "/admin/sessions", icon: "devices", label: "Phiên đăng nhập" },
    ],
  },
  {
    title: "HỆ THỐNG",
    items: [
      { href: "/admin/ai-tokens", icon: "smart_toy", label: "Cấu hình AI Hub" },
      { href: "/admin/settings", icon: "settings_suggest", label: "Cấu hình hệ thống" },
      { href: "/admin/notifications", icon: "notifications", label: "Thông báo" },
    ],
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isCollapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  })();

  return (
    <>
      {/* Mobile Backdrop overlay - Triggers automatically if not collapsed on responsive viewport */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-slate-950/30 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          !isCollapsed ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside className={`
        fixed lg:sticky top-0 h-screen left-0 z-50 bg-white/80 dark:bg-[#0A1F3E]/90 backdrop-blur-md flex flex-col shrink-0 border-r border-slate-200/40 dark:border-cyan-950/40 shadow-[4px_0_24px_-12px_rgba(12,46,94,0.08)]
        transition-all duration-300 ease-in-out py-6
        ${isCollapsed 
          ? "-translate-x-full lg:translate-x-0 lg:w-[78px] px-2" 
          : "translate-x-0 w-64 px-4"
        }
      `}>
        {/* Logo Area */}
        <div className={`relative flex items-center mb-6 border-b border-slate-200/40 dark:border-cyan-950/40 pb-5 ${isCollapsed ? "justify-center px-2" : "justify-center px-6 w-full"}`}>
          <Link href="/admin/dashboard" className="group flex flex-col items-center justify-center transition-all duration-300">
            {isCollapsed ? (
              /* Glowing Shield/Lock badge in Navy for collapsed Admin */
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0C2E5E] to-[#0E3E7A] dark:from-[#0A1F3E] dark:to-[#0E3E7A] shadow-lg shadow-[#0C2E5E]/20 dark:shadow-[#00C6FF]/10 flex items-center justify-center text-white hover:scale-105 transition-all">
                <span className="material-symbols-outlined text-[22px] text-[#00C6FF]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
              </div>
            ) : (
              /* Center and scale up the vertical logo in a premium card */
              <div className="flex flex-col items-center justify-center py-2 w-full transition-all duration-300">
                <img 
                  src="/logoweb.png" 
                  alt="AuraAcademic" 
                  className="h-20 w-auto object-contain transition-all duration-300 group-hover:scale-[1.04] dark:hidden" 
                />
                <img 
                  src="/logoweb-dark.png" 
                  alt="AuraAcademic" 
                  className="h-20 w-auto object-contain transition-all duration-300 group-hover:scale-[1.04] hidden dark:block" 
                />
              </div>
            )}
          </Link>

          {/* Close mobile only */}
          {!isCollapsed && (
            <button onClick={onClose} className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-lg transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Main Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-5 px-1 scrollbar-none hover:scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-cyan-950">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-3">{section.title}</p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : ""}
                      className={`flex items-center transition-all duration-200 group active:scale-[0.98] ${
                        isCollapsed 
                          ? "justify-center w-12 h-12 rounded-xl mx-auto" 
                          : "space-x-3 px-3.5 py-2.5 rounded-xl mx-0.5"
                      } ${
                        isActive
                          ? "bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] dark:from-[#0A1F3E] dark:to-[#0E3E7A] text-white font-extrabold shadow-md shadow-[#0C2E5E]/10 dark:shadow-[#00C6FF]/10 border-l-[3px] border-[#00C6FF]"
                          : "text-slate-500 dark:text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-[#0C2E5E]/5 dark:hover:bg-cyan-950/40 font-semibold text-sm"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[21px] flex-shrink-0 transition-transform ${
                        isActive ? "" : "text-slate-400 dark:text-slate-500 group-hover:text-[#0C2E5E] dark:group-hover:text-[#00C6FF] group-hover:scale-110"
                      }`}
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                        {item.icon}
                      </span>
                      
                      {!isCollapsed && (
                        <span className="truncate tracking-wide text-[13.5px]">{item.label}</span>
                      )}
                      
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00C6FF] shadow-sm" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Area & Log out footer */}
        <div className="border-t border-slate-200/40 dark:border-cyan-950/40 pt-4 mt-2 flex flex-col gap-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-cyan-950/30 border border-slate-100 dark:border-cyan-900/30 p-3 rounded-2xl">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0C2E5E] to-[#00C6FF] p-[1.5px] flex-shrink-0 relative shadow-sm">
                <div className="w-full h-full bg-white dark:bg-[#051329] rounded-full flex items-center justify-center text-[#0C2E5E] dark:text-slate-200 font-black text-xs border border-white dark:border-cyan-950">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-[#0C2E5E] dark:text-[#E2E8F0] truncate tracking-tight leading-tight">{user?.fullName || "Administrator"}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-bold uppercase tracking-widest mt-0.5">Super Admin</p>
              </div>
              <button 
                onClick={handleLogout} 
                title="Đăng xuất" 
                className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-red-950/20 p-1 rounded-lg transition-colors shadow-inner-sm"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            /* Simplified logout when collapsed */
            <button 
              onClick={handleLogout} 
              title="Đăng xuất khỏi hệ thống" 
              className="w-12 h-12 rounded-xl mx-auto flex justify-center items-center text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
