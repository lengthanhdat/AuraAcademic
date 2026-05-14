"use client";
import { useState, useEffect } from "react";
import { TeacherSidebar } from "@/components/layout/TeacherSidebar";
import { TeacherHeader } from "@/components/layout/TeacherHeader";
import { Toaster } from "sonner";
import AuthGuard from "@/components/layout/AuthGuard";
import { usePathname } from "next/navigation";
import { ChatBox } from "@/components/chat/ChatBox";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Mặc định thu gọn trên thiết bị nhỏ, mở rộng trên desktop
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsCollapsed(false); // Desktop -> Mở rộng
      } else {
        setIsCollapsed(true);  // Mobile -> Thu gọn (ẩn đi)
      }
    };

    handleResize(); // Thiết lập ban đầu

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Tự động đóng trên mobile khi chuyển trang
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  }, [pathname]);

  return (
    <AuthGuard allowedRoles={["teacher"]}>
      <div className="bg-[#F8FAFC] dark:bg-[#051329] text-on-surface font-body antialiased flex min-h-screen relative transition-colors duration-300">
        <TeacherSidebar isCollapsed={isCollapsed} onClose={() => setIsCollapsed(true)} />
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden transition-all duration-300">
          <TeacherHeader onMenuClick={() => setIsCollapsed(prev => !prev)} />
          {children}
        </div>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={5000}
          toastOptions={{
            style: { fontFamily: "inherit" },
          }}
        />
        <ChatBox />
      </div>
    </AuthGuard>
  );
}
