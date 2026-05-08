"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/layout/NotificationBell";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/analytics": "Thống kê & Báo cáo",
  "/admin/users": "Quản lý người dùng",
  "/admin/roles": "Phân quyền RBAC",
  "/admin/exams": "Quản lý bài thi",
  "/admin/content": "Nội dung & Media",
  "/admin/audit-logs": "Audit Logs",
  "/admin/sessions": "Phiên đăng nhập",
  "/admin/settings": "Cấu hình hệ thống",
  "/admin/notifications": "Thông báo",
};

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const pageTitle = pageTitles[pathname] || "Admin Panel";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-[#0f172a]/90 backdrop-blur-xl border-b border-slate-800">
      {/* Left: Breadcrumb */}
      <div>
        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-widest">Admin / {pageTitle}</p>
        <h2 className="text-lg font-bold text-white leading-tight mt-0.5">{pageTitle}</h2>
      </div>

      {/* Center: Search */}
      <div className="hidden lg:flex flex-1 max-w-sm mx-8">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
            placeholder="Tìm kiếm người dùng, bài thi..."
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Live clock */}
        <div className="hidden xl:flex flex-col items-end mr-3">
          <span className="text-sm font-bold text-white">{timeStr}</span>
          <span className="text-[10px] text-slate-500">{dateStr}</span>
        </div>

        {/* System status */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Online</span>
        </div>

        <NotificationBell />

        {/* Settings */}
        <button onClick={() => router.push("/admin/settings")} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
          <span className="material-symbols-outlined text-xl">settings</span>
        </button>
      </div>
    </header>
  );
}
