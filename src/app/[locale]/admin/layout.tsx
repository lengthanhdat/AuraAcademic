"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Tự động thu gọn khi kích thước dọc, mở rộng trên desktop
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // Dùng lg làm mốc đối với Admin Dashboard phức tạp
        setIsCollapsed(false);
      } else {
        setIsCollapsed(true);
      }
    };

    handleResize(); // Thiết lập ban đầu

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Đóng hẳn trên Mobile khi chuyển trang
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  }, [pathname]);

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#051329] relative antialiased font-sans transition-colors duration-300">
        <AdminSidebar isCollapsed={isCollapsed} onClose={() => setIsCollapsed(true)} />
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 overflow-y-auto">
          <AdminHeader onMenuClick={() => setIsCollapsed(prev => !prev)} />
          <main className="flex-1 p-6 md:p-8 space-y-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
