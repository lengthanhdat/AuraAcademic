import { TeacherSidebar } from "@/components/layout/TeacherSidebar";
import { TeacherHeader } from "@/components/layout/TeacherHeader";
import { Toaster } from "sonner";
import AuthGuard from "@/components/layout/AuthGuard";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["teacher"]}>
      <div className="bg-surface text-on-surface font-body antialiased flex min-h-screen">
        <TeacherSidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          <TeacherHeader />
          {children}
        </div>
        {/* Toast notifications toan cuc cho khu vuc teacher */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={5000}
          toastOptions={{
            style: { fontFamily: "inherit" },
          }}
        />
      </div>
    </AuthGuard>
  );
}

