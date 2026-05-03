"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function TeacherSidebar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 border-r-0 sticky left-0 top-0 bg-slate-50 dark:bg-slate-900 p-4 space-y-6 z-50 shrink-0">
      <div className="flex items-center space-x-3 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00355f] to-[#0f4c81] flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-blue-900 dark:text-blue-100 leading-none">Digital Proctor</h1>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Hội đồng thi</p>
        </div>
      </div>
      
      <Link href="/teacher/exams" className="w-full py-3 px-4 bg-gradient-to-br from-[#00355f] to-[#0f4c81] text-white rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-transform">
        <span className="material-symbols-outlined text-sm">add_circle</span>
        Tạo Kỳ Thi Mới
      </Link>

      <nav className="flex-1 space-y-1">
        {/* Active: Dashboard */}
        <Link className="flex items-center space-x-3 px-4 py-3 bg-white dark:bg-slate-700 text-blue-900 dark:text-white font-bold shadow-sm rounded-lg transition-colors duration-200" href="/teacher/dashboard">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-headline font-semibold tracking-tight text-sm">Bảng Điều Khiển</span>
        </Link>
        <Link className="flex items-center space-x-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 rounded-lg" href="/teacher/exams">
          <span className="material-symbols-outlined">magic_button</span>
          <span className="font-headline font-semibold tracking-tight text-sm">Thiet Ke De Thi</span>
        </Link>
        <Link className="flex items-center space-x-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 rounded-lg" href="/teacher/exams/import">
          <span className="material-symbols-outlined">upload_file</span>
          <span className="font-headline font-semibold tracking-tight text-sm">Nhap Tu File</span>
        </Link>
        <Link className="flex items-center space-x-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 rounded-lg" href="/teacher/monitoring">
          <span className="material-symbols-outlined">videocam</span>
          <span className="font-headline font-semibold tracking-tight text-sm">Giám Sát Trực Tiếp</span>
        </Link>
        <Link className="flex items-center space-x-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 rounded-lg" href="/teacher/reports">
          <span className="material-symbols-outlined">assessment</span>
          <span className="font-headline font-semibold tracking-tight text-sm">Báo Cáo Phân Tích</span>
        </Link>
      </nav>

      <div className="pt-6 border-t border-slate-200/60 space-y-1">
        <Link className="flex items-center space-x-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 rounded-lg" href="/teacher/support">
          <span className="material-symbols-outlined">help</span>
          <span className="font-headline font-semibold tracking-tight text-sm">Hỗ Trợ</span>
        </Link>
        <Link className="flex items-center space-x-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 rounded-lg" href="/teacher/profile">
          <span className="material-symbols-outlined">manage_accounts</span>
          <span className="font-headline font-semibold tracking-tight text-sm">Ho So Ca Nhan</span>
        </Link>
        <Link onClick={() => localStorage.removeItem("user")} className="flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 rounded-lg" href="/login">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-headline font-semibold tracking-tight text-sm">Đăng Xuất</span>
        </Link>
      </div>
    </aside>
  );
}
