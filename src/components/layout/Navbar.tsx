"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";

export function Navbar() {
  const t = useTranslations("Navbar");

  return (
    <nav className="fixed top-6 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(12,46,94,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-full px-6 sm:px-8 py-3 flex items-center justify-between transition-all duration-300 hover:shadow-[0_12px_40px_rgba(12,46,94,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <Link href="/" className="flex items-center gap-1 group">
          <Image src="/logoweb.png" width={180} height={44} alt="AuraAcademic Logo" className="h-9 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform duration-300 dark:hidden" priority />
          <Image src="/logoweb-dark.png" width={180} height={44} alt="AuraAcademic Logo" className="h-9 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform duration-300 hidden dark:block" priority />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />

          <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 border-l border-slate-200 dark:border-slate-800/50 pl-2 sm:pl-4">
            <Link href="/login" className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 rounded-full border border-slate-200/80 dark:border-slate-800/80 hover:border-[#00C6FF]/50 dark:hover:border-[#00C6FF]/50 hover:bg-[#00C6FF]/5 dark:hover:bg-[#00C6FF]/10 hover:text-[#00C6FF] dark:hover:text-white transition-all duration-300 whitespace-nowrap">
              {t("sign_in")}
            </Link>

            <Link href="/register" className="group relative px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] shadow-[0_4px_20px_rgba(0,198,255,0.3)] hover:shadow-[0_6px_25px_rgba(0,198,255,0.45)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden whitespace-nowrap">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative z-10 flex items-center gap-1.5">
                {t("sign_up")}
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
