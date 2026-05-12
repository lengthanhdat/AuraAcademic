"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();
  const [dots, setDots] = useState("...");
  const [tick, setTick] = useState(0);

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "." : prev + ".");
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation tick for gear icon
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(interval);
  }, []);

  // Polling phát hiện bảo trì đã tắt để đưa người dùng quay lại trang cũ
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Gọi thử API, nếu không trả về 503 nghĩa là đã hết bảo trì!
        const res = await fetch("http://localhost:8088/api/materials/published", { headers });
        if (res.status !== 503) {
          const prevPath = localStorage.getItem("prevPath") || "/";
          localStorage.removeItem("prevPath");
          window.location.href = prevPath; // Quay lại trang cũ với đầy đủ context re-load
        }
      } catch {
        // Bỏ qua lỗi kết nối
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00355f] via-[#0f4c81] to-[#1a6ab3] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-white/5 rounded-full" />
        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${4 + (i % 5) * 3}px`,
              height: `${4 + (i % 5) * 3}px`,
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              animation: `float ${3 + (i % 4)}s ease-in-out ${i * 0.4}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          to   { transform: translateY(-18px) rotate(8deg); opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spin-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes slide-up {
          from { transform: translateY(32px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Main card */}
      <div
        className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center"
        style={{ animation: "slide-up 0.7s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        {/* Gear icon animation */}
        <div className="relative inline-flex items-center justify-center w-28 h-28 mb-6">
          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full bg-white/20" style={{ animation: "pulse-ring 2s ease-out infinite" }} />
          <div className="absolute inset-0 rounded-full bg-white/15" style={{ animation: "pulse-ring 2s ease-out 0.7s infinite" }} />

          {/* Outer gear */}
          <span
            className="material-symbols-outlined text-white/40 absolute"
            style={{ fontSize: "80px", animation: "spin-slow 8s linear infinite" }}
          >
            settings
          </span>
          {/* Inner gear */}
          <span
            className="material-symbols-outlined text-white absolute"
            style={{ fontSize: "48px", animation: "spin-rev 5s linear infinite" }}
          >
            settings
          </span>
        </div>

        {/* Title */}
        <h1 className="font-headline text-3xl font-black text-white mb-2 tracking-tight">
          Hệ thống đang bảo trì
        </h1>
        <p className="text-white/70 text-sm font-body mb-1">
          AuraAcademic đang được nâng cấp và cải thiện{dots}
        </p>
        <p className="text-white/50 text-xs font-body mb-8">
          Chúng tôi sẽ trở lại sớm nhất có thể. Xin lỗi vì sự bất tiện này.
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-white/20" />
          <span className="material-symbols-outlined text-white/40 text-base">engineering</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/15 text-left">
            <span className="material-symbols-outlined text-[#a0c9ff] text-xl mb-2 block">schedule</span>
            <p className="text-white/50 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Thời gian</p>
            <p className="text-white text-sm font-bold">Dự kiến ngắn</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/15 text-left">
            <span className="material-symbols-outlined text-[#a0c9ff] text-xl mb-2 block">data_saver_on</span>
            <p className="text-white/50 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Trạng thái</p>
            <p className="text-white text-sm font-bold">Đang xử lý</p>
          </div>
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          className="w-full flex items-center justify-center gap-2 bg-white text-[#00355f] font-bold py-3.5 rounded-2xl hover:bg-[#d2e4ff] active:scale-95 transition-all duration-200 shadow-lg shadow-black/20 text-sm"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Thử lại
        </button>

        {/* Footer note */}
        <p className="text-white/30 text-[10px] mt-5">
          Nếu bạn là quản trị viên,{" "}
          <a
            href="/login"
            className="text-[#a0c9ff] underline underline-offset-2 hover:text-white transition-colors"
          >
            đăng nhập tại đây
          </a>
        </p>
      </div>
    </div>
  );
}
