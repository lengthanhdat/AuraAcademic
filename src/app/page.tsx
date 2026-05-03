import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-surface">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-headline text-sm flex flex-col gap-6">
        <h1 className="text-4xl font-extrabold text-primary tracking-tight">Aura Academic</h1>
        <p className="text-on-surface-variant text-lg text-center max-w-2xl bg-surface-container-low p-6 rounded-2xl">
          Chào mừng đến với Hệ thống thi trắc nghiệm thông minh tích hợp giám sát AI. Dự án đang trong quá trình phát triển (Phase 1).
        </p>
        
        <div className="flex gap-4 mt-8">
          <Link
            href="/login"
            className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
          >
            Đăng nhập hệ thống
          </Link>
        </div>
      </div>
    </main>
  );
}
