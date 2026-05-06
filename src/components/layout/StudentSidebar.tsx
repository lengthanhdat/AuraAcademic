"use client";

import Link from "next/link";
import Image from "next/image";

export function StudentSidebar() {
  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-[#f2f4f6] dark:bg-[#1f2224] py-8 sticky top-0 border-none shrink-0">
      <div className="px-8 mb-10">
        <h1 className="font-headline font-black text-[#00355f] dark:text-white text-2xl tracking-tight">Aura Academic</h1>
      </div>
      <div className="flex-1 space-y-1">
        {/* Active State: Dashboard */}
        <Link className="flex items-center gap-3 bg-white dark:bg-[#191c1e] text-[#00355f] dark:text-[#ffffff] rounded-l-full ml-4 pl-4 py-3 font-bold shadow-sm transition-all active:scale-98" href="/student/dashboard">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label text-sm">Bảng điều khiển</span>
        </Link>
        <Link className="flex items-center gap-3 text-[#42474f] dark:text-[#c2c7d1] px-8 py-3 hover:text-[#00355f] dark:hover:text-white transition-all active:scale-98" href="/student/exams">
          <span className="material-symbols-outlined">quiz</span>
          <span className="font-label text-sm">Thi trực tuyến</span>
        </Link>
        <Link className="flex items-center gap-3 text-[#42474f] dark:text-[#c2c7d1] px-8 py-3 hover:text-[#00355f] dark:hover:text-white transition-all active:scale-98" href="/student/results">
          <span className="material-symbols-outlined">assignment_turned_in</span>
          <span className="font-label text-sm">Kết quả thi</span>
        </Link>
        <Link className="flex items-center gap-3 text-[#42474f] dark:text-[#c2c7d1] px-8 py-3 hover:text-[#00355f] dark:hover:text-white transition-all active:scale-98" href="/student/materials">
          <span className="material-symbols-outlined">menu_book</span>
          <span className="font-label text-sm">Tài liệu học</span>
        </Link>
        <Link className="flex items-center gap-3 text-[#42474f] dark:text-[#c2c7d1] px-8 py-3 hover:text-[#00355f] dark:hover:text-white transition-all active:scale-98" href="/student/profile">
          <span className="material-symbols-outlined">manage_accounts</span>
          <span className="font-label text-sm">Ho So Ca Nhan</span>
        </Link>
      </div>
      <div className="px-8 mt-auto space-y-1 border-t border-outline-variant/10 pt-6">
        <div className="mb-6 p-4 rounded-xl bg-surface-container-highest/30">
          <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Ôn tập nhanh</p>
          <p className="text-[10px] text-on-surface-variant">Lần truy cập trước: 2h</p>
        </div>
        <Link className="flex items-center gap-3 text-[#42474f] dark:text-[#c2c7d1] py-2 hover:text-primary transition-all" href="#">
          <span className="material-symbols-outlined">help_outline</span>
          <span className="font-label text-sm">Lên hệ hỗ trợ</span>
        </Link>
        <Link onClick={() => localStorage.removeItem("user")} className="flex items-center gap-3 text-[#42474f] dark:text-[#c2c7d1] py-2 hover:text-error transition-all" href="/login">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label text-sm">Đăng xuất</span>
        </Link>
      </div>
    </aside>
  );
}
