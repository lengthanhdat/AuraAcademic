import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { StudentHeader } from "@/components/layout/StudentHeader";
import AuthGuard from "@/components/layout/AuthGuard";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
