"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const STATUS_MESSAGES = [
    "Khởi động lõi thông minh Aura AI...",
    "Thiết lập kênh truyền mã hóa lượng tử...",
    "Đồng bộ hóa phiên làm việc bảo mật...",
    "Chuyển hướng đến cổng đăng nhập chính thức..."
  ];

  // Rotate status messages during intro
  useEffect(() => {
    if (!showIntro) return;

    const interval = setInterval(() => {
      setStatusIdx(prev => (prev < STATUS_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 700);

    return () => clearInterval(interval);
  }, [showIntro]);

  // Handle smooth progress bar simulation
  useEffect(() => {
    if (!showIntro) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            router.push("/login");
          }, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [showIntro, router]);

  const handleStartIntro = () => {
    setShowIntro(true);
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-[#001c37] flex flex-col items-center justify-center relative overflow-hidden font-body">
        {/* Particle / Aura glow effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Main glowing aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00355f]/40 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#a0c9ff]/10 blur-[80px] rounded-full" />

          {/* Abstract background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

          {/* Moving light streaks */}
          <div className="absolute top-0 left-1/4 w-[2px] h-[150px] bg-gradient-to-b from-[#a0c9ff]/0 via-[#a0c9ff]/30 to-[#a0c9ff]/0 animate-streak" />
          <div className="absolute bottom-0 right-1/4 w-[2px] h-[150px] bg-gradient-to-b from-[#a0c9ff]/0 via-[#a0c9ff]/30 to-[#a0c9ff]/0 animate-streak" style={{ animationDelay: "1s" }} />
        </div>

        <style>{`
          @keyframes streak {
            0% { transform: translateY(-150px); }
            100% { transform: translateY(100vh); }
          }
          .animate-streak {
            animation: streak 3s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
          }
          @keyframes spin-outer {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes spin-inner {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
          .animate-spin-slow {
            animation: spin-outer 12s linear infinite;
          }
          .animate-spin-rev {
            animation: spin-inner 8s linear infinite;
          }
          @keyframes float-center {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-10px) scale(1.02); }
          }
          .animate-floating {
            animation: float-center 4s ease-in-out infinite;
          }
        `}</style>

        {/* Content Card */}
        <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center animate-floating">
          {/* Animated Futuristic Hologram Core */}
          <div className="relative w-40 h-40 mb-10 flex items-center justify-center">
            {/* Outer dotted rings */}
            <div className="absolute inset-0 border-2 border-dashed border-[#a0c9ff]/20 rounded-full animate-spin-slow" />
            <div className="absolute inset-4 border border-[#a0c9ff]/10 rounded-full" />

            {/* Middle glowing orbit */}
            <div className="absolute inset-8 border-2 border-t-[#a0c9ff] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin-rev" />
            <div className="absolute inset-8 border border-b-[#a0c9ff]/40 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-rev" />

            {/* Pulse rings */}
            <div className="absolute inset-12 bg-[#a0c9ff]/10 rounded-full animate-ping opacity-60" style={{ animationDuration: "2s" }} />

            {/* Neural core symbol with Logo */}
            <div className="absolute w-20 h-20 bg-white rounded-full border border-white/20 shadow-2xl flex items-center justify-center backdrop-blur-md overflow-hidden p-2.5 animate-pulse">
              <img src="/logo.png" alt="Aura Academic Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Brand & Loading Status */}
          <h2 className="font-headline text-3xl font-black text-white mb-2 tracking-wider uppercase">
            Aura Academic
          </h2>
          <div className="h-6 mb-8 flex items-center justify-center">
            <p className="text-[#a0c9ff] text-xs font-medium uppercase tracking-widest transition-all duration-300">
              {STATUS_MESSAGES[statusIdx]}
            </p>
          </div>

          {/* Sleek Progress Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3 border border-white/5 relative">
            <div
              className="h-full bg-gradient-to-r from-[#a0c9ff] via-[#d2e4ff] to-white rounded-full transition-all duration-100 ease-out shadow-[0_0_8px_rgba(160,201,255,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between w-full text-[10px] font-bold text-white/40 tracking-widest uppercase">
            <span>Securing handshake</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-[#f7f9fb] via-white to-[#eceef0]">
      {/* Premium decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#d2e4ff]/40 blur-[130px] rounded-full" />
        <div className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-[#eceef0]/60 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00355f03_1px,transparent_1px),linear-gradient(to_bottom,#00355f03_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>

      <style>{`
        @keyframes reveal-card {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-reveal {
          animation: reveal-card 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>

      {/* Main card container */}
      <div className="z-10 max-w-2xl w-full text-center flex flex-col items-center gap-8 p-12 bg-white/70 backdrop-blur-xl border border-white rounded-[40px] shadow-2xl shadow-slate-200/50 animate-reveal">
        {/* Futuristic Icon/Branding */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-xl shadow-[#00355f]/10 transform hover:rotate-12 transition-all duration-300 overflow-hidden border border-slate-100 p-2">
          <img src="/logo.png" alt="Aura Academic Logo" className="w-full h-full object-contain" />
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl font-black text-[#00355f] tracking-tight font-headline">
            Aura Academic
          </h1>
          <p className="text-[#4f6076] text-xs font-black uppercase tracking-[0.2em]">
            Smart Exam Engine & AI Proctoring
          </p>
        </div>

        <p className="text-[#4f6076] text-sm leading-relaxed max-w-lg bg-[#f2f4f6]/60 p-6 rounded-2xl border border-white font-body">
          Chào mừng đến với Hệ thống thi trắc nghiệm thông minh tích hợp giám sát AI. Dự án đang trong quá trình phát triển (Phase 1).
        </p>

        <div className="flex gap-4 w-full max-w-xs mt-2">
          <button
            onClick={handleStartIntro}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00355f] to-[#0f4c81] text-white font-black rounded-2xl shadow-xl shadow-[#00355f]/20 hover:shadow-2xl hover:shadow-[#00355f]/30 hover:scale-[1.03] active:scale-95 transition-all duration-300 text-sm tracking-wide"
          >
            Đăng nhập hệ thống
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>
  );
}
