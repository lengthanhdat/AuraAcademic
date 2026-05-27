"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/analytics": "Thống kê & Báo cáo",
  "/admin/users": "Quản lý người dùng",
  "/admin/verifications": "Xác thực giáo viên",
  "/admin/roles": "Phân quyền RBAC",
  "/admin/exams": "Quản lý bài thi",
  "/admin/content": "Nội dung & Media",
  "/admin/audit-logs": "Audit Logs",
  "/admin/sessions": "Phiên đăng nhập",
  "/admin/settings": "Cấu hình hệ thống",
  "/admin/notifications": "Thông báo",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function AdminHeader({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });

  const pageTitle = pageTitles[pathname] || "Admin Panel";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 bg-white/75 dark:bg-[#0A1F3E]/75 backdrop-blur-xl border-b border-slate-200/45 dark:border-cyan-950/45 shadow-[0_1px_2px_rgba(12,46,94,0.02)] transition-colors duration-300">
      <div className="flex items-center gap-4">
        {/* Collapse/Expand toggle always visible on Admin */}
        <span 
          onClick={onMenuClick}
          className="material-symbols-outlined flex text-slate-600 dark:text-slate-400 cursor-pointer hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] p-1.5 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-lg transition-all select-none"
          title="Thu gọn / Mở rộng Sidebar"
        >
          menu
        </span>
        {/* Breadcrumb */}
        <div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-none">Admin / {pageTitle}</p>
          <h2 className="text-base font-black text-[#0C2E5E] dark:text-[#E2E8F0] tracking-tight mt-1 leading-tight">{pageTitle}</h2>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden lg:flex flex-1 max-w-sm mx-8">
        <div className="relative w-full group">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg transition-colors group-focus-within:text-[#0C2E5E] dark:group-focus-within:text-[#00C6FF]">search</span>
          <input
            className="w-full bg-slate-100/80 hover:bg-slate-200/40 dark:bg-cyan-950/30 dark:border-cyan-950/50 border border-slate-200/50 rounded-full pl-10 pr-4 py-2 text-sm text-[#0C2E5E] dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-[#0C2E5E]/10 focus:border-[#0C2E5E]/20 dark:focus:ring-cyan-500/10 dark:focus:border-cyan-500/20 shadow-inner-sm transition-all"
            placeholder="Tìm kiếm người dùng, bài thi..."
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right Side Widgets */}
      <div className="flex items-center gap-3">
        {/* Clock */}
        <div className="hidden xl:flex flex-col items-end text-right mr-2">
          <span className="text-xs font-black text-[#0C2E5E] dark:text-[#E2E8F0] tabular-nums">{timeStr}</span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 tracking-wider leading-none mt-0.5">{dateStr}</span>
        </div>

        {/* Badge online */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-full mr-1 text-emerald-700 dark:text-emerald-400 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">System Online</span>
        </div>

        <ThemeToggle />
        <NotificationBell />

        {/* Settings Shortcut */}
        <button 
          onClick={() => router.push("/admin/settings")} 
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-xl transition-all"
          title="Cấu hình hệ thống"
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </button>
      </div>
    </header>
  );
}
