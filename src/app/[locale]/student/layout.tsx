"use client";
import { useState, useEffect } from "react";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { StudentHeader } from "@/components/layout/StudentHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const ChatBox = dynamic(
  () => import("@/components/chat/ChatBox").then(m => ({ default: m.ChatBox })),
  { ssr: false, loading: () => null }
);

const KatexStyles = dynamic(() => import("@/components/KatexStyles"), { ssr: false });

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTakingExam = pathname.includes("/exams/take");
  
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

    // Thiết lập trạng thái ban đầu
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Tự động đóng sidebar trên Mobile khi thay đổi URL (chuyển trang)
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  }, [pathname]);

  if (isTakingExam) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-[#051329] transition-colors duration-300">
          {children}
          <KatexStyles />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <div className="flex min-h-screen w-full flex-1 relative bg-[#f8fafc] dark:bg-[#051329] transition-colors duration-300">
        <StudentSidebar isCollapsed={isCollapsed} onClose={() => setIsCollapsed(true)} />
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <StudentHeader onMenuClick={() => setIsCollapsed(prev => !prev)} />
          {children}
        </div>
        <KatexStyles />
        <ChatBox />
      </div>
    </AuthGuard>
  );
}
