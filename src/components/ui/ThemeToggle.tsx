"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Cần mounted check để chống chênh lệch dữ liệu HTML render trên server và client
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse opacity-50"></div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-9 h-9 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-slate-100 dark:hover:bg-[#0A1F3E]/60 rounded-full border border-transparent hover:border-slate-200/50 dark:hover:border-cyan-950/40 transition-all duration-300 shadow-sm active:scale-90 group overflow-hidden"
      title={isDark ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
      aria-label="Theme Toggle"
    >
      {/* Background ambient glowing behind the button for Dark Mode */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0C2E5E]/0 to-[#00C6FF]/0 group-hover:from-[#0C2E5E]/5 group-hover:to-[#00C6FF]/10 dark:group-hover:from-cyan-950/30 dark:group-hover:to-[#00C6FF]/10 transition-all duration-500"></div>

      <span 
        className={`material-symbols-outlined text-[21px] absolute transition-all duration-500 ease-in-out ${
          isDark 
            ? "rotate-[90deg] scale-0 opacity-0" 
            : "rotate-0 scale-100 opacity-100"
        }`}
        style={{ fontVariationSettings: "'FILL' 0" }}
      >
        light_mode
      </span>
      
      <span 
        className={`material-symbols-outlined text-[20px] absolute transition-all duration-500 ease-in-out ${
          isDark 
            ? "rotate-0 scale-100 opacity-100" 
            : "-rotate-[90deg] scale-0 opacity-0"
        }`}
        style={{ fontVariationSettings: "'FILL' 1", color: isDark ? "#00C6FF" : "" }}
      >
        dark_mode
      </span>
    </button>
  );
}
