"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function TeacherSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const menuItems = [
    { label: "Bảng Điều Khiển", icon: "dashboard", href: "/teacher/dashboard" },
    { label: "Thiết Kế Đề Thi", icon: "magic_button", href: "/teacher/exams" },
    { label: "Tài Liệu Giảng Dạy", icon: "menu_book", href: "/teacher/materials" },
    { label: "Giám Sát Trực Tiếp", icon: "videocam", href: "/teacher/monitoring" },
    { label: "Báo Cáo Phân Tích", icon: "assessment", href: "/teacher/reports" },
  ];

  const bottomItems = [
    { label: "Hỗ Trợ", icon: "help", href: "/teacher/support" },
    { label: "Hồ Sơ Cá Nhân", icon: "manage_accounts", href: "/teacher/profile" },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 sticky left-0 top-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-5 space-y-6 z-50 shrink-0">
      {/* Logo Section */}
      <div className="flex items-center space-x-3 px-3 py-2">
        <div className="w-10 h-10 rounded-xl bg-[#00355f] flex items-center justify-center text-white shadow-lg shadow-blue-900/10 shrink-0">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
        </div>
        <div className="overflow-hidden">
          <h1 className="text-base font-black text-[#00355f] dark:text-blue-100 leading-tight tracking-tight truncate">Digital Proctor</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mt-0.5">Hội đồng thi</p>
        </div>
      </div>
      
      {/* Primary Action */}
      <div className="px-1">
        <Link href="/teacher/exams" className="w-full py-3.5 px-4 bg-[#00355f] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 hover:bg-[#002a4d] hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Tạo Kỳ Thi Mới
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-1">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                active 
                  ? "bg-blue-50/80 dark:bg-blue-900/20 text-[#00355f] dark:text-blue-400 font-bold" 
                  : "text-slate-500 dark:text-slate-400 hover:text-[#00355f] hover:bg-slate-50"
              }`}
            >
              {/* Active Indicator Line */}
              {active && (
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#00355f] rounded-r-full" />
              )}
              
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                active ? "scale-110" : "group-hover:scale-110"
              }`}>
                <span className={`material-symbols-outlined text-[22px] transition-colors ${
                  active ? "text-[#00355f] dark:text-blue-400" : "text-slate-400 group-hover:text-[#00355f]"
                }`} style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
              </div>
              <span className="text-sm tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1 px-1">
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                active 
                  ? "bg-blue-50/80 dark:bg-blue-900/20 text-[#00355f] dark:text-blue-400 font-bold" 
                  : "text-slate-500 dark:text-slate-400 hover:text-[#00355f] hover:bg-slate-50"
              }`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                <span className="material-symbols-outlined text-[22px] text-slate-400 group-hover:text-[#00355f]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
              </div>
              <span className="text-sm tracking-tight">{item.label}</span>
            </Link>
          );
        })}
        
        <Link 
          onClick={() => { localStorage.removeItem("user"); localStorage.removeItem("accessToken"); }} 
          className="flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all group mt-2" 
          href="/login"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <span className="material-symbols-outlined text-[22px]">logout</span>
          </div>
          <span className="text-sm font-bold tracking-tight">Đăng Xuất</span>
        </Link>
      </div>
    </aside>
  );
}
