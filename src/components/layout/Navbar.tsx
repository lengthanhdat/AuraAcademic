"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Link, usePathname, useRouter } from "@/navigation";
import { useLocale } from "next-intl";

export function Navbar() {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLangChange = (newLocale: "en" | "vi") => {
    setIsLangOpen(false);
    router.replace(pathname, { locale: newLocale });
  };
  
  const isEn = locale === 'en';

  return (
    <nav className="fixed top-6 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(12,46,94,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-full px-6 sm:px-8 py-3 flex items-center justify-between transition-all duration-300 hover:shadow-[0_12px_40px_rgba(12,46,94,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <Link href="/" className="flex items-center gap-1 group">
          <img src="/logoweb.png" alt="AuraAcademic Logo" className="h-9 sm:h-11 object-contain group-hover:scale-105 transition-transform duration-300 dark:hidden" />
          <img src="/logoweb-dark.png" alt="AuraAcademic Logo" className="h-9 sm:h-11 object-contain group-hover:scale-105 transition-transform duration-300 hidden dark:block" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isEn ? (
                <svg viewBox="0 0 30 20" className="w-5 sm:w-6 h-3.5 sm:h-4 rounded-sm object-cover shrink-0 shadow-sm"><rect width="30" height="20" fill="#00247d"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#ffffff" strokeWidth="4"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#cf142b" strokeWidth="1.5"/><path d="M15,0 V20 M0,10 H30" stroke="#ffffff" strokeWidth="6"/><path d="M15,0 V20 M0,10 H30" stroke="#cf142b" strokeWidth="3.6"/></svg>
              ) : (
                <svg viewBox="0 0 30 20" className="w-5 sm:w-6 h-3.5 sm:h-4 rounded-sm object-cover shrink-0 shadow-sm"><rect width="30" height="20" fill="#da251d"/><polygon points="15,4 16.18,7.63 20,7.63 16.91,9.88 18.09,13.51 15,11.25 11.91,13.51 13.09,9.88 10,7.63 13.82,7.63" fill="#ffff00"/></svg>
              )}
            </button>

            {isLangOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <button
                    onClick={() => handleLangChange('vi')}
                    className={`w-full px-4 py-2 text-sm font-bold flex items-center gap-3 transition-colors ${!isEn ? 'bg-slate-50 dark:bg-cyan-950/40 text-[#00C6FF]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyan-950/20'}`}
                  >
                    <svg viewBox="0 0 30 20" className="w-5 h-3.5 rounded-sm object-cover shrink-0"><rect width="30" height="20" fill="#da251d"/><polygon points="15,4 16.18,7.63 20,7.63 16.91,9.88 18.09,13.51 15,11.25 11.91,13.51 13.09,9.88 10,7.63 13.82,7.63" fill="#ffff00"/></svg>
                    Tiếng Việt
                  </button>
                  <button
                    onClick={() => handleLangChange('en')}
                    className={`w-full px-4 py-2 text-sm font-bold flex items-center gap-3 transition-colors ${isEn ? 'bg-slate-50 dark:bg-cyan-950/40 text-[#00C6FF]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyan-950/20'}`}
                  >
                    <svg viewBox="0 0 30 20" className="w-5 h-3.5 rounded-sm object-cover shrink-0"><rect width="30" height="20" fill="#00247d"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#ffffff" strokeWidth="4"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#cf142b" strokeWidth="1.5"/><path d="M15,0 V20 M0,10 H30" stroke="#ffffff" strokeWidth="6"/><path d="M15,0 V20 M0,10 H30" stroke="#cf142b" strokeWidth="3.6"/></svg>
                    English
                  </button>
                </div>
              </>
            )}
          </div>

          <ThemeToggle />
          
          <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 border-l border-slate-200 dark:border-slate-800/50 pl-2 sm:pl-4">
            <Link href="/login" className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 rounded-full border border-slate-200/80 dark:border-slate-800/80 hover:border-[#00C6FF]/50 dark:hover:border-[#00C6FF]/50 hover:bg-[#00C6FF]/5 dark:hover:bg-[#00C6FF]/10 hover:text-[#00C6FF] dark:hover:text-white transition-all duration-300 whitespace-nowrap">
              {isEn ? "Sign in" : "Đăng nhập"}
            </Link>
            
            <Link href="/register" className="group relative px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] shadow-[0_4px_20px_rgba(0,198,255,0.3)] hover:shadow-[0_6px_25px_rgba(0,198,255,0.45)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden whitespace-nowrap">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative z-10 flex items-center gap-1.5">
                {isEn ? "Sign up" : "Đăng ký ngay"}
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
