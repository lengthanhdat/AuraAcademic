"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StudentSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { label: "Bảng điều khiển", icon: "dashboard", href: "/student/dashboard" },
    { label: "Thi trực tuyến", icon: "quiz", href: "/student/exams" },
    { label: "Kết quả thi", icon: "assignment_turned_in", href: "/student/results" },
    { label: "Tài liệu học", icon: "menu_book", href: "/student/materials" },
    { label: "Hồ Sơ Cá Nhân", icon: "manage_accounts", href: "/student/profile" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-[#f2f4f6] dark:bg-[#1f2224] py-8 sticky top-0 border-none shrink-0">
      <div className="px-8 mb-10">
        <h1 className="font-headline font-black text-[#00355f] dark:text-white text-2xl tracking-tight">Aura Academic</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 transition-all active:scale-98 ${
                active 
                  ? "bg-white dark:bg-[#191c1e] text-[#00355f] dark:text-[#ffffff] rounded-l-full ml-4 pl-4 py-3 font-bold shadow-sm" 
                  : "text-[#42474f] dark:text-[#c2c7d1] px-8 py-3 hover:text-[#00355f] dark:hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-8 mt-auto space-y-1 border-t border-outline-variant/10 pt-6">
        <div className="mb-6 p-4 rounded-xl bg-surface-container-highest/30">
          <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Ôn tập nhanh</p>
          <p className="text-[10px] text-on-surface-variant">Lần truy cập trước: 2h</p>
        </div>
        
        <Link className="flex items-center gap-3 text-[#42474f] dark:text-[#c2c7d1] py-2 hover:text-primary transition-all" href="#">
          <span className="material-symbols-outlined">help_outline</span>
          <span className="font-label text-sm">Liên hệ hỗ trợ</span>
        </Link>
        
        <Link 
          onClick={() => localStorage.removeItem("user")} 
          className="flex items-center gap-3 text-[#42474f] dark:text-[#c2c7d1] py-2 hover:text-error transition-all" 
          href="/login"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label text-sm">Đăng xuất</span>
        </Link>
      </div>
    </aside>
  );
}
