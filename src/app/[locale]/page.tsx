"use client";

import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, BookOpenCheck, Camera, FileText, ShieldCheck } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type LogoWordmark = {
  name: string;
  style: CSSProperties;
};

type FeatureCard = {
  title: string;
  Icon: typeof Camera;
  body: string;
};

const heroBrands: LogoWordmark[] = [
  { name: "AI Proctoring", style: { fontFamily: "Georgia, serif", fontWeight: 700, letterSpacing: "-0.02em", fontSize: "15px" } },
  { name: "Live Exams", style: { fontFamily: "Arial, sans-serif", fontWeight: 900, letterSpacing: "0.08em", fontSize: "13px", textTransform: "uppercase" } },
  { name: "Smart Grading", style: { fontFamily: "Trebuchet MS, sans-serif", fontWeight: 600, letterSpacing: "0.01em", fontSize: "15px", fontStyle: "italic" } },
  { name: "Secure Sessions", style: { fontFamily: "Courier New, monospace", fontWeight: 700, letterSpacing: "0.12em", fontSize: "13px", textTransform: "uppercase" } },
  { name: "Question Bank", style: { fontFamily: "Palatino, 'Book Antiqua', serif", fontWeight: 400, letterSpacing: "-0.01em", fontSize: "16px" } },
  { name: "Teacher Studio", style: { fontFamily: "Impact, 'Arial Narrow', sans-serif", fontWeight: 400, letterSpacing: "0.04em", fontSize: "14px" } },
  { name: "Audit Logs", style: { fontFamily: "Verdana, sans-serif", fontWeight: 700, letterSpacing: "-0.03em", fontSize: "13px" } },
];

const partners: LogoWordmark[] = [
  { name: "Schools", style: { fontFamily: "'Times New Roman', serif", fontWeight: 400, letterSpacing: "0.02em", fontSize: "14px" } },
  { name: "Universities", style: { fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, letterSpacing: "0.08em", fontSize: "16px" } },
  { name: "Training Centers", style: { fontFamily: "Impact, sans-serif", fontWeight: 700, letterSpacing: "0.05em", fontSize: "18px" } },
  { name: "Teachers", style: { fontFamily: "Georgia, serif", fontWeight: 600, letterSpacing: "-0.02em", fontSize: "17px" } },
  { name: "Students", style: { fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 700, letterSpacing: "-0.01em", fontSize: "15px" } },
  { name: "Exam Boards", style: { fontFamily: "Verdana, sans-serif", fontWeight: 700, letterSpacing: "0.06em", fontSize: "14px", textTransform: "uppercase" } },
  { name: "Admins", style: { fontFamily: "Courier New, monospace", fontWeight: 700, letterSpacing: "0.18em", fontSize: "14px" } },
  { name: "Institutions", style: { fontFamily: "Palatino, serif", fontWeight: 500, letterSpacing: "0.03em", fontSize: "15px" } },
];

const heroFeatures: FeatureCard[] = [
  { title: "AI Camera", Icon: Camera, body: "Nhận diện bất thường trong lúc làm bài" },
  { title: "Exam Builder", Icon: FileText, body: "Tạo đề từ tài liệu hoặc ngân hàng câu hỏi" },
  { title: "Secure Room", Icon: ShieldCheck, body: "Quản lý phiên thi, mã phòng và trạng thái" },
  { title: "Auto Report", Icon: BookOpenCheck, body: "Tổng hợp kết quả và vi phạm sau kỳ thi" },
];

function PillButton({ children, href = "/login" }: { children: ReactNode; href?: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-3 bg-gradient-to-r from-[#0C2E5E] via-[#0E3E7A] to-[#00C6FF] text-white text-base md:text-lg font-bold pl-8 pr-2 py-2.5 rounded-full hover:shadow-[0_10px_30px_rgba(0,198,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group"
    >
      <span className="tracking-tight">{children}</span>
      <span className="bg-white/95 text-[#0C2E5E] rounded-full p-2 group-hover:scale-110 transition-transform duration-300">
        <ArrowRight className="w-5 h-5" />
      </span>
    </a>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-6 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(12,46,94,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-full px-6 sm:px-8 py-3 flex items-center justify-between transition-all duration-300 hover:shadow-[0_12px_40px_rgba(12,46,94,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <a href="#" className="flex items-center gap-1 group">
          <img src="/logoweb.png" alt="AuraAcademic Logo" className="h-9 sm:h-11 object-contain group-hover:scale-105 transition-transform duration-300 dark:hidden" />
          <img src="/logoweb-dark.png" alt="AuraAcademic Logo" className="h-9 sm:h-11 object-contain group-hover:scale-105 transition-transform duration-300 hidden dark:block" />
        </a>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex items-center gap-2.5">
            <a href="/login" className="text-[#0C2E5E]/85 dark:text-slate-350 hover:text-[#00C6FF] dark:hover:text-white text-xs sm:text-sm font-extrabold px-4 sm:px-5 py-2.5 rounded-full transition-all duration-300">
              Đăng nhập
            </a>
            <a href="/register" className="bg-gradient-to-r from-[#0C2E5E] via-[#0E3E7A] to-[#00C6FF] text-white text-xs sm:text-sm font-extrabold px-5 sm:px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-[#00C6FF]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 shadow-[0_4px_15px_rgba(0,198,255,0.2)]">
              Đăng ký ngay
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroMarquee() {
  return (
    <div className="mt-24 w-full max-w-md overflow-hidden">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 22s linear infinite;
        }
      `}</style>
      <div className="marquee-track">
        {[...heroBrands, ...heroBrands].map((brand, index) => (
          <span key={`${brand.name}-${index}`} className="mx-7 shrink-0 text-black/60 dark:text-white/60 whitespace-nowrap" style={brand.style}>
            {brand.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(0,198,255,0.22),transparent_38%),radial-gradient(circle_at_50%_80%,rgba(220,168,55,0.08),transparent_45%),linear-gradient(135deg,#f0f8ff_0%,#ffffff_40%,#e6eff8_100%)] dark:bg-[radial-gradient(circle_at_85%_20%,rgba(0,198,255,0.15),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(12,46,94,0.3),transparent_50%),linear-gradient(135deg,#030712_0%,#080f1c_40%,#02060f_100%)] overflow-hidden transition-all duration-500">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(12,46,94,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(12,46,94,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem]" />
      
      {/* Brand Glowing Orbs in Bg */}
      <div className="absolute -right-20 top-20 w-96 h-96 bg-[#00C6FF]/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse" />
      <div className="absolute right-1/4 top-1/3 w-80 h-80 bg-[#DCA837]/10 dark:bg-[#DCA837]/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animation-delay-2000" />

      <div className="absolute right-[6%] top-[15%] hidden lg:block w-[38rem] h-[38rem] rounded-full border border-[#00C6FF]/10 dark:border-[#00C6FF]/5 animate-[spin_90s_linear_infinite] opacity-80" />
      <div className="absolute right-[10%] top-[19%] hidden lg:block w-[30rem] h-[30rem] rounded-full border border-dashed border-[#DCA837]/20 dark:border-[#DCA837]/10 animate-[spin_60s_linear_infinite_reverse] opacity-60" />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="flex-1 px-4 sm:px-6 pt-32 pb-6 flex flex-col relative min-h-screen">
      <style>{`
        @keyframes float3d {
          0%, 100% { transform: rotateX(18deg) rotateY(-22deg) translateZ(0) translateY(0); }
          50% { transform: rotateX(20deg) rotateY(-18deg) translateZ(40px) translateY(-25px); }
        }
        @keyframes floatImg {
          0%, 100% { transform: translateZ(110px) translateY(0) rotate(0deg); }
          50% { transform: translateZ(110px) translateY(-20px) rotate(3deg); }
        }
        .perspective-container {
          perspective: 1400px;
          transform-style: preserve-3d;
        }
        .hero-3d-grid {
          animation: float3d 8s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        .card-3d {
          transform-style: preserve-3d;
          transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
          border: 1px solid rgba(255, 255, 255, 0.8);
        }
        .card-3d:hover {
          transform: translateZ(60px) scale(1.06);
          box-shadow: -30px 30px 60px rgba(12,46,94,0.18);
          border-color: rgba(0, 198, 255, 0.4);
        }
        .card-content-3d {
          transform: translateZ(35px);
        }
      `}</style>
      <div className="relative w-full rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(12,46,94,0.15)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border border-white/30 dark:border-white/10 flex flex-col lg:flex-row flex-1">
        <HeroVisual />
        
        {/* Left Column: Text content */}
        <div className="relative z-10 flex flex-col items-start justify-center p-8 md:p-12 lg:p-16 w-full lg:w-1/2">
          <ScrollReveal variant="fade-up" delay={50}>
            <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-[#00C6FF]/30 dark:border-[#00C6FF]/20 shadow-sm mb-6">
              <span className="w-2 h-2 bg-[#00C6FF] rounded-full animate-ping"></span>
              <span className="text-xs font-bold text-[#0C2E5E] dark:text-[#00C6FF] tracking-wider uppercase">Hệ thống Giáo dục AI Thế hệ Mới</span>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={200}>
            <h1 className="text-[#0C2E5E] dark:text-white text-5xl lg:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
              Thi trực tuyến<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0C2E5E] via-[#00C6FF] to-[#DCA837] dark:from-white dark:via-[#00C6FF] dark:to-[#DCA837] drop-shadow-[0_2px_20px_rgba(0,198,255,0.15)]">Thông minh đột phá</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={350}>
            <p className="text-slate-600 dark:text-slate-200 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium">
              Nền tảng tạo đề, tổ chức phòng thi và tích hợp trí tuệ nhân tạo giám sát bảo mật tối đa, kiến tạo sự công bằng hoàn hảo.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={500}>
            <div className="flex flex-wrap gap-4">
               <PillButton href="/login">Khám phá ngay</PillButton>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={650}>
            <HeroMarquee />
          </ScrollReveal>
        </div>

        {/* Right Column: 3D Grid */}
        <div className="relative z-10 w-full lg:w-1/2 p-8 md:p-12 lg:p-16 flex items-center justify-center">
          <div className="hidden lg:block perspective-container w-full max-w-lg relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 hero-3d-grid relative w-full">
              {heroFeatures.map(({ title, Icon, body }, idx) => (
                <ScrollReveal key={title} variant="zoom-in" delay={idx * 150 + 200} className="flex">
                  <div className="card-3d w-full h-full min-h-[14rem] rounded-[2rem] bg-white/85 dark:bg-slate-950/60 backdrop-blur-2xl p-4 lg:p-6 shadow-[0_25px_60px_-15px_rgba(12,46,94,0.12)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white dark:border-white/10 hover:border-[#00C6FF]/45 dark:hover:border-[#00C6FF]/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                    <div className="card-content-3d flex flex-col justify-between h-full relative z-10">
                      <div>
                        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-white to-[#eef6ff] dark:from-slate-900 dark:to-slate-950 flex items-center justify-center mb-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_2px_6px_rgba(255,255,255,0.02)] border border-white dark:border-white/10 shrink-0">
                          <Icon className="w-6 h-6 lg:w-7 lg:h-7 text-[#0C2E5E] dark:text-[#00C6FF] group-hover:text-[#00C6FF] transition-colors" />
                        </div>
                        <p className="text-lg lg:text-xl font-extrabold text-[#0C2E5E] dark:text-white tracking-tight">{title}</p>
                        <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium leading-relaxed">{body}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
              {/* Centered logo with warm radiant glow */}
              <div className="absolute -right-8 -bottom-8 lg:-right-14 lg:-bottom-14 opacity-95 pointer-events-none z-20" style={{ animation: 'floatImg 7s ease-in-out infinite', transformStyle: 'preserve-3d' }}>
                <div className="relative">
                  <div className="absolute inset-0 bg-[#DCA837]/40 rounded-full blur-[40px] -z-10 animate-pulse"></div>
                  <img src="/logoweb.png" alt="Glowing Icon" className="w-28 h-28 lg:w-36 lg:h-36 object-contain drop-shadow-[0_25px_30px_rgba(12,46,94,0.35)] dark:hidden" />
                  <img src="/logoweb-dark.png" alt="Glowing Icon" className="w-28 h-28 lg:w-36 lg:h-36 object-contain drop-shadow-[0_25px_30px_rgba(12,46,94,0.35)] hidden dark:block" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoSection() {
  return (
    <section className="bg-[#F8FAFC] dark:bg-[#030712] px-6 py-32 relative overflow-hidden border-t border-slate-200/50 dark:border-white/5 transition-colors duration-500">
      {/* Dynamic mesh elements background */}
      <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-[#00C6FF]/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-[#DCA837]/5 rounded-full blur-[100px] -z-10"></div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20 items-end">

          <ScrollReveal variant="fade-up" delay={100}>
            <div>
              <h2 className="text-[#0C2E5E] dark:text-white text-4xl md:text-6xl font-black leading-tight mb-8 tracking-tight">
                Kiến tạo hệ sinh thái<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C6FF] to-[#0C2E5E]">AuraAcademic.</span>
              </h2>
              <PillButton href="/register">Gia nhập ngay</PillButton>
            </div>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={250}>
            <p className="text-slate-600 dark:text-slate-300 text-xl md:text-2xl leading-relaxed font-medium border-l-4 border-[#00C6FF] pl-8 py-2">
              Sự giao thoa đỉnh cao giữa tri thức truyền thống và công nghệ giám sát AI tự động, tối ưu hóa quy trình từ tạo ngân hàng câu hỏi đến thống kê vi phạm.
            </p>
          </ScrollReveal>
        </div>

        <style>{`
          .tilt-card {
            transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.6s, border-color 0.4s;
            transform-style: preserve-3d;
            border: 1px solid rgba(255, 255, 255, 1);
          }
          .tilt-card:hover {
            transform: translateY(-12px) rotateX(3deg) rotateY(-3deg);
            box-shadow: 0 30px 70px rgba(12,46,94,0.12);
            z-index: 10;
          }
          .tilt-content {
            transform: translateZ(40px);
          }
        `}</style>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 perspective-container">
          <ScrollReveal variant="fade-up" delay={50} className="lg:col-span-2">
            <article className="lg:col-span-2 tilt-card rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-white via-[#f8fbff] to-[#e0f2fe] dark:from-slate-900/80 dark:via-slate-900/40 dark:to-[#0A1F3E]/40 shadow-[0_15px_40px_rgba(12,46,94,0.05)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white dark:border-white/10 hover:border-[#00C6FF]/30 dark:hover:border-[#00C6FF]/35 transition-all">
              <div className="p-12 min-h-[26rem] flex flex-col justify-between tilt-content h-full relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#00C6FF]/10 rounded-full blur-3xl -z-10"></div>
                <div>
                  <div className="w-16 h-16 bg-[#0C2E5E] rounded-2xl flex items-center justify-center mb-10 shadow-lg shadow-[#0C2E5E]/20">
                    <FileText className="w-8 h-8 text-[#00C6FF]" />
                  </div>
                  <h3 className="text-[#0C2E5E] dark:text-white text-4xl font-extrabold leading-tight mb-6 tracking-tight">
                    Biên Soạn Đề Thi<br />Tự Động Siêu Tốc
                  </h3>
                  <p className="text-slate-600 dark:text-slate-350 text-lg font-medium leading-relaxed max-w-sm">
                    Trích xuất thông minh tài liệu từ DOCX, PDF hoặc ra lệnh cho AI sinh đề cấu trúc phân hóa chỉ trong một lần chạm.
                  </p>
                </div>
              </div>
            </article>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={200}>
            <article className="tilt-card bg-[#0C2E5E] dark:bg-slate-950/60 rounded-[2.5rem] p-10 min-h-[26rem] flex flex-col justify-between shadow-xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border-[#0C2E5E]/80 dark:border-white/10 relative overflow-hidden group hover:border-[#DCA837]/45 transition-all h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00C6FF]/20 to-[#DCA837]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="tilt-content relative z-10 h-full flex flex-col justify-between">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/20">
                  <ShieldCheck className="w-8 h-8 text-[#00C6FF]" />
                </div>
                <div>
                  <h3 className="text-white text-3xl font-black leading-tight mb-4 tracking-tight">
                    Phòng Thi<br />Khép Kín.
                  </h3>
                  <p className="text-white/70 text-base font-medium leading-relaxed">
                    Môi trường bảo mật tuyệt đối, ghi nhận sự cố mất kết nối và theo dõi màn hình thí sinh thời gian thực.
                  </p>
                </div>
              </div>
            </article>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={350}>
            <article className="tilt-card bg-gradient-to-b from-[#0A192F] to-[#0C2E5E] dark:from-slate-950/80 dark:to-slate-900/60 rounded-[2.5rem] p-10 min-h-[26rem] flex flex-col justify-between shadow-xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border-[#0C2E5E]/80 dark:border-white/10 relative overflow-hidden group hover:border-[#00C6FF]/45 transition-all h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00C6FF]/30 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="tilt-content relative z-10 h-full flex flex-col justify-between">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/20">
                  <Camera className="w-8 h-8 text-[#DCA837]" />
                </div>
                <div>
                  <h3 className="text-white text-3xl font-black leading-tight mb-4 tracking-tight">
                    Proctoring AI<br />Đỉnh Cao
                  </h3>
                  <p className="text-white/70 text-base font-medium leading-relaxed">
                    Nhận diện đa nhân diện, phát hiện đổi người, rời khỏi camera hoặc có tạp âm lạ chính xác tuyệt đối.
                  </p>
                </div>
              </div>
            </article>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function BackedBySection() {
  return (
    <section className="bg-[#F5F5F5] dark:bg-slate-950 px-6 py-6 border-y border-slate-200/50 dark:border-white/5 transition-colors duration-500">
      <ScrollReveal variant="fade-up" delay={50}>
        <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 items-center overflow-hidden">
          <p className="text-black/70 dark:text-white/70 text-base leading-relaxed whitespace-pre-line font-semibold">
            Xây dựng cho nhà trường,{"\n"}giảng viên và đội ngũ vận hành thi.
          </p>
          <div className="md:col-span-3 overflow-hidden">
            <style>{`
              @keyframes backers-marquee {
                from { transform: translateX(0); }
                to { transform: translateX(-50%); }
              }
              .backers-track {
                display: flex;
                width: max-content;
                animation: backers-marquee 30s linear infinite;
              }
            `}</style>
            <div className="backers-track">
              {[...partners, ...partners].map((brand, index) => (
                <span key={`${brand.name}-${index}`} className="mx-10 shrink-0 text-black/50 dark:text-white/50 whitespace-nowrap" style={brand.style}>
                  {brand.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section className="bg-[#F8FAFC] dark:bg-[#030712] px-6 py-32 transition-colors duration-500">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <ScrollReveal variant="fade-right" delay={100}>
          <div className="lg:pr-12">
            <p className="text-[#00C6FF] text-sm mb-4 font-black tracking-[0.2em] uppercase">Vận hành chuyên nghiệp</p>
            <h2 className="text-[#0C2E5E] dark:text-white text-5xl md:text-7xl font-black leading-[1.05] mb-8 tracking-tight">
              Quy trình khép kín
            </h2>
            <p className="text-slate-600 dark:text-slate-350 text-lg leading-relaxed mb-10 font-medium">
              Tích hợp xuyên suốt từ bước chuẩn bị đề bài, quản lý tài liệu đến phát mã phòng và tổng hợp báo cáo phổ điểm cuối kỳ thi.
            </p>
            <a href="/login" className="group inline-flex items-center gap-4 text-[#0C2E5E] dark:text-[#00C6FF] text-xl font-extrabold">
              <span className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-[#00C6FF]/30 dark:shadow-[#00C6FF]/10 animate-pulse">
                <ArrowRight className="w-6 h-6 text-white" />
              </span>
              Trải nghiệm ứng dụng ngay
            </a>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fade-left" delay={250}>
          <div className="relative w-full aspect-[4/3] lg:h-[700px] perspective-container mt-12 lg:mt-0">
            <style>{`
              .showcase-3d {
                transform: rotateY(-18deg) rotateX(12deg);
                transform-style: preserve-3d;
                animation: floatShowcase 12s ease-in-out infinite;
              }
              @keyframes floatShowcase {
                0%, 100% { transform: rotateY(-18deg) rotateX(12deg) translateY(0); box-shadow: 40px 60px 100px rgba(12,46,94,0.15); }
                50% { transform: rotateY(-12deg) rotateX(6deg) translateY(-30px); box-shadow: 25px 75px 120px rgba(0,198,255,0.25); }
              }
              .glass-panel-3d {
                transform: translateZ(70px);
                transform-style: preserve-3d;
                border: 1px solid rgba(255, 255, 255, 0.7);
              }
              .floating-stats-3d {
                transform: translateZ(100px);
              }
              .stat-card-3d {
                transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                border: 1px solid rgba(255, 255, 255, 0.8);
              }
              .stat-card-3d:hover {
                transform: translateZ(25px) translateY(-8px);
                box-shadow: 0 25px 50px rgba(12,46,94,0.15);
                border-color: rgba(0, 198, 255, 0.3);
              }
            `}</style>
            
            <div className="w-full h-full rounded-[3.5rem] overflow-hidden showcase-3d relative bg-[radial-gradient(circle_at_60%_10%,rgba(255,255,255,0.95),transparent_25%),linear-gradient(145deg,#eaf6ff_0%,#ffffff_45%,#cbe5f9_100%)] dark:bg-[radial-gradient(circle_at_60%_10%,rgba(15,23,42,0.95),transparent_25%),linear-gradient(145deg,#030712_0%,#0f172a_45%,#0b1528_100%)] border border-white/70 dark:border-white/10">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,198,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,198,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
              
              <div className="absolute inset-8 lg:inset-12 glass-panel-3d bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl rounded-[3rem] shadow-[0_30px_80px_rgba(12,46,94,0.1)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.5)] flex flex-col justify-between p-10 md:p-14">
                 <div>
                   <div className="w-16 h-16 bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] rounded-3xl flex items-center justify-center mb-10 shadow-xl shadow-[#00C6FF]/30 dark:shadow-[#00C6FF]/15">
                     <ShieldCheck className="w-8 h-8 text-white" />
                   </div>
                   <h3 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight text-[#0C2E5E] dark:text-white">
                     Trung Tâm<br/>Theo Dõi
                   </h3>
                   <p className="text-slate-600 dark:text-slate-350 text-lg font-medium leading-relaxed max-w-md">
                     Bảng điều khiển giám sát trung tâm giúp quản trị viên phát hiện sự cố và duy trì tính chính trực của bài thi.
                   </p>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-5 floating-stats-3d">
                   {["Chờ thi", "Đang làm", "Đã nộp"].map((label, index) => (
                     <div key={label} className="stat-card-3d rounded-2xl bg-white dark:bg-slate-900/65 shadow-[0_20px_50px_-10px_rgba(12,46,94,0.08)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.4)] p-6 border border-slate-100 dark:border-white/10 flex flex-col items-center text-center">
                       <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] mb-2">{[24, 18, 42][index]}</p>
                       <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="flex flex-col bg-[#F8FAFC] dark:bg-[#030712] transition-colors duration-500">
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#030712]">
        <Navbar />
        <HeroSection />
      </div>
      <InfoSection />
      <BackedBySection />
      <UseCasesSection />
    </main>
  );
}
