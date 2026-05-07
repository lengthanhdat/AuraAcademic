"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navSections = [
  {
    title: "TỔNG QUAN",
    items: [
      { href: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
      { href: "/admin/analytics", icon: "bar_chart", label: "Thống kê & Báo cáo" },
    ],
  },
  {
    title: "QUẢN LÝ",
    items: [
      { href: "/admin/users", icon: "group", label: "Người dùng" },
      { href: "/admin/roles", icon: "admin_panel_settings", label: "Phân quyền RBAC" },
      { href: "/admin/exams", icon: "quiz", label: "Bài thi" },
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
      { href: "/admin/settings", icon: "settings_suggest", label: "Cấu hình hệ thống" },
      { href: "/admin/notifications", icon: "notifications", label: "Thông báo" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  })();

  return (
    <aside className={`hidden md:flex flex-col h-full ${collapsed ? "w-20" : "w-72"} bg-[#0f172a] transition-all duration-300 flex-shrink-0 border-r border-slate-800`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-6 border-b border-slate-800 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-violet-500/30">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-bold text-base text-white leading-none">AuraAdmin</h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">Control Panel</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-slate-500 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-xl">{collapsed ? "chevron_right" : "chevron_left"}</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">{section.title}</p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group relative
                      ${isActive
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                  >
                    <span className={`material-symbols-outlined text-xl flex-shrink-0 ${isActive ? "" : "group-hover:text-violet-400"}`}
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                    {isActive && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-slate-800 p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.fullName || "Admin"}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email || ""}</p>
            </div>
            <button onClick={handleLogout} title="Đăng xuất" className="text-slate-500 hover:text-red-400 transition-colors">
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} title="Đăng xuất" className="w-full flex justify-center text-slate-500 hover:text-red-400 transition-colors">
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        )}
      </div>
    </aside>
  );
}
