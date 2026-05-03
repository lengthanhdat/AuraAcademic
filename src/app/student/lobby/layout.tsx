import AuthGuard from "@/components/layout/AuthGuard";

// Trang phòng chờ dùng full-screen layout, không có sidebar/header
export default function LobbyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["student"]}>
      {children}
    </AuthGuard>
  );
}
