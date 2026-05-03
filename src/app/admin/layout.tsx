import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";
import AuthGuard from "@/components/layout/AuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="flex h-screen overflow-hidden selection:bg-primary-fixed-dim selection:text-on-primary-fixed">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <AdminHeader />
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
