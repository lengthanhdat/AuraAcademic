"use client";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { StudentHeader } from "@/components/layout/StudentHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import { usePathname } from "next/navigation";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTakingExam = pathname.includes("/exams/take");

  if (isTakingExam) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <div className="w-full min-h-screen bg-[#f8fafc]">
          {children}
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <div className="flex min-h-screen w-full flex-1">
        <StudentSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <StudentHeader />
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
