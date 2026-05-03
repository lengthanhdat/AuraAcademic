"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function TeacherHeader() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <header className="w-full h-16 sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-8 border-none">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined md:hidden text-on-surface">menu</span>
        <h2 className="text-xl font-black text-blue-900 dark:text-blue-50 font-headline hidden md:block">The Digital Proctor</h2>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-900 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
          <input className="bg-transparent border-none focus:ring-0 text-sm hidden lg:block w-64 placeholder-slate-400 outline-none px-2" placeholder="Tìm kiếm kỳ thi hoặc học sinh..." type="text"/>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:text-blue-700 relative">
            <span className="material-symbols-outlined">notifications_active</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-blue-900 leading-none">{user?.fullName || "Giáo viên"}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Ban Giảng Huấn</p>
            </div>
            <img alt="Giáo viên Profile" className="w-10 h-10 rounded-full object-cover border-2 border-blue-900/10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0pRLjsYNuYnvwUAtnEACdq-Kh3GGr4RXIQ29z1hKdw2IL9Q3KxPqR_zaLEFUB-LhS_5bmuZraE_8zRkSZ0FjUMOC287Q8Zkl54rOHbzGYFF5j0XNeYm0dQF26UPv9UprT-afl1-flyFIBUJ0CS0Mb4duE9PlwEEabSJag1HzkAOOF7b8iqUUoqy44mTWJx19DDBOv9SSz2yOTj06gVOgcvkE71qW2IFuOr23H5Zk9LQfc57GjVZ7O1Mhgm1UcA_lFRb_FzBp9SkQ"/>
          </div>
        </div>
      </div>
    </header>
  );
}
