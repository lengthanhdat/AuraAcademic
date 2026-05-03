"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function StudentHeader() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  return (
    <header className="bg-[#f7f9fb] dark:bg-[#191c1e] z-50 h-16 flex justify-between items-center px-8 w-full mx-auto sticky top-0 border-none">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined md:hidden text-on-surface">menu</span>
        <span className="font-headline font-extrabold text-[#00355f] dark:text-[#0f4c81] uppercase tracking-widest text-lg">Aura Academic</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-primary text-sm">timer</span>
          <span className="text-xs font-bold text-primary">Có thể thi: 59:00</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-on-surface-variant hover:bg-[#f2f4f6] p-2 rounded-full transition-colors duration-200">notifications</button>
          <button className="material-symbols-outlined text-on-surface-variant hover:bg-[#f2f4f6] p-2 rounded-full transition-colors duration-200">schedule</button>
        </div>
        <div className="h-8 w-[1px] bg-outline-variant/30 hidden sm:block"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#00355f]">{user?.fullName || "Khách"}</p>
            <p className="text-[10px] text-on-surface-variant font-medium">Báo danh: {user?.id?.substring(0, 8) || "N/A"}</p>
          </div>
          <div className="relative">
            <img alt="Student profile" className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZFtG_u-rS3DsADUCJpkoChXS1Rti1_JujgxPM1b3_G51c3VyV3QTNLCYxpt8TJFkI75-qPbFGOjPaoQZLH9Ca6PZN5lDPptIBl5B-yYIu1tafvbKTzCLi8yLm36uPsEML0e0tlqDo-_l6zzJ7G65J0-jXeEnW0eVixYpLmtFYV4GpUovPZrAMReqOMmiBRNKYWVu4pYpvjZ4jpybY1fgLfZcjMEbnGe1d_HEHLy_9wsi-HuRCpxrl9YmjH0LYMKcYQbUP6Mc8rkk"/>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
