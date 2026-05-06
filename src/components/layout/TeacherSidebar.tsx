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
    { label: "Nhập Từ File", icon: "upload_file", href: "/teacher/exams/import" },
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
    <aside className="hidden md:flex flex-col h-screen w-64 border-r-0 sticky left-0 top-0 bg-slate-50 dark:bg-slate-900 p-6 space-y-8 z-50 shrink-0">
      <div className="flex items-center space-x-3 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00355f] to-[#0f4c81] flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
        </div>
        <div>
          <h1 className="text-lg font-black text-blue-900 dark:text-blue-100 leading-none tracking-tight">Digital Proctor</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Hội đồng thi</p>
        </div>
      </div>
      
      <Link href="/teacher/exams" className="w-full py-3.5 px-4 bg-[#00355f] text-white rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 hover:bg-[#002a4d] active:scale-95 transition-all">
        <span className="material-symbols-outlined text-[18px]">add_circle</span>
        Tạo Kỳ Thi Mới
      </Link>

      <nav className="flex-1 flex flex-col gap-1.5">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                active 
                  ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-400 font-bold shadow-md shadow-slate-200/50" 
                  : "text-slate-500 dark:text-slate-400 hover:text-blue-900 hover:bg-white/50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? "bg-blue-50 text-blue-900" : "text-slate-400 group-hover:text-blue-600"}`}>
                <span className={`material-symbols-outlined text-[20px] ${active ? "fill-1" : ""}`}>{item.icon}</span>
              </div>
              <span className="font-headline font-semibold tracking-tight text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-slate-200/60 flex flex-col gap-1.5">
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                active 
                  ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-400 font-bold shadow-md shadow-slate-200/50" 
                  : "text-slate-500 dark:text-slate-400 hover:text-blue-900 hover:bg-white/50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? "bg-blue-50 text-blue-900" : "text-slate-400 group-hover:text-blue-600"}`}>
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </div>
              <span className="font-headline font-semibold tracking-tight text-sm">{item.label}</span>
            </Link>
          );
        })}
        <Link 
          onClick={() => { localStorage.removeItem("user"); localStorage.removeItem("accessToken"); }} 
          className="flex items-center space-x-3 px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 rounded-xl transition-all group" 
          href="/login"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 group-hover:text-red-600">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </div>
          <span className="font-headline font-semibold tracking-tight text-sm">Đăng Xuất</span>
        </Link>
      </div>
    </aside>
  );
}
