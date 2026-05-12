import AuthGuard from "@/components/layout/AuthGuard";

// Layout riêng cho trang làm bài thi:
// Không có Sidebar, không có Header — chỉ hiển thị nội dung bài thi toàn màn hình.
export default function TakeExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["student"]}>
      <div className="min-h-screen w-full">
        {children}
      </div>
    </AuthGuard>
  );
}
