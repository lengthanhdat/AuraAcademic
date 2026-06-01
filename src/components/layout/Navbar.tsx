"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-6 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(12,46,94,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-full px-6 sm:px-8 py-3 flex items-center justify-between transition-all duration-300 hover:shadow-[0_12px_40px_rgba(12,46,94,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <Link href="/" className="flex items-center gap-1 group">
          <img src="/logoweb.png" alt="AuraAcademic Logo" className="h-9 sm:h-11 object-contain group-hover:scale-105 transition-transform duration-300 dark:hidden" />
          <img src="/logoweb-dark.png" alt="AuraAcademic Logo" className="h-9 sm:h-11 object-contain group-hover:scale-105 transition-transform duration-300 hidden dark:block" />
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="text-[#0C2E5E]/85 dark:text-slate-350 hover:text-[#00C6FF] dark:hover:text-white text-xs sm:text-sm font-extrabold px-4 sm:px-5 py-2.5 rounded-full transition-all duration-300">
              Đăng nhập
            </Link>
            <Link href="/register" className="bg-gradient-to-r from-[#0C2E5E] via-[#0E3E7A] to-[#00C6FF] text-white text-xs sm:text-sm font-extrabold px-5 sm:px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-[#00C6FF]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 shadow-[0_4px_15px_rgba(0,198,255,0.2)]">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
