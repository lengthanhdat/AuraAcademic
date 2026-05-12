import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, BookOpenCheck, Camera, FileText, ShieldCheck } from "lucide-react";

type LogoWordmark = {
  name: string;
  style: CSSProperties;
};

type FeatureCard = {
  title: string;
  Icon: typeof Camera;
  body: string;
};

function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="M 128.005 191.173 C 128.448 156.208 156.93 128 192 128 L 192 64 L 128 64 C 128 99.346 99.346 128 64 128 L 64 192 L 128 192 Z M 192 256 L 64 256 C 28.654 256 0 227.346 0 192 L 0 64 L 64 64 L 64 0 L 192 0 C 227.346 0 256 28.654 256 64 L 256 192 L 192 192 Z" />
    </svg>
  );
}

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
      className="inline-flex items-center gap-3 bg-black text-white text-base md:text-lg font-medium pl-8 pr-2 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200"
    >
      {children}
      <span className="bg-white rounded-full p-2 transition-colors duration-200">
        <ArrowRight className="w-5 h-5 text-black" />
      </span>
    </a>
  );
}

function Navbar() {
  const links = ["Giám sát AI", "Tạo đề", "Phòng thi", "Tài liệu", "Hỗ trợ"];

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
      <div className="max-w-[88rem] mx-auto flex items-center justify-between">
        <a href="#" className="flex items-center gap-3 text-black">
          <LogoIcon className="w-7 h-7" />
          <span className="text-2xl font-medium tracking-tight">AuraAcademic</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a key={link} href="#" className="text-base text-gray-700 hover:text-black font-medium transition-colors duration-200">
              {link}
            </a>
          ))}
        </div>

        <a href="/login" className="bg-black text-white text-base font-medium px-7 py-2.5 rounded-full hover:bg-gray-800 transition-colors duration-200">
          Đăng nhập
        </a>
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
          <span key={`${brand.name}-${index}`} className="mx-7 shrink-0 text-black/60 whitespace-nowrap" style={brand.style}>
            {brand.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_22%,rgba(0,53,95,0.16),transparent_34%),linear-gradient(135deg,#eef5fb_0%,#f8f8f8_45%,#dfeaf4_100%)] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,53,95,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,53,95,0.045)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute right-[8%] top-[18%] hidden lg:block w-[34rem] h-[34rem] rounded-full border border-black/10 animate-[spin_60s_linear_infinite]" />
      
      <style>{`
        @keyframes float3d {
          0%, 100% { transform: rotateX(15deg) rotateY(-20deg) translateZ(0) translateY(0); }
          50% { transform: rotateX(15deg) rotateY(-20deg) translateZ(30px) translateY(-20px); }
        }
        @keyframes floatImg {
          0%, 100% { transform: translateZ(80px) translateY(0); }
          50% { transform: translateZ(80px) translateY(-15px); }
        }
        .perspective-container {
          perspective: 1200px;
          transform-style: preserve-3d;
        }
        .hero-3d-grid {
          animation: float3d 8s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        .card-3d {
          transform-style: preserve-3d;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .card-3d:hover {
          transform: translateZ(50px) scale(1.05);
          box-shadow: -20px 20px 50px rgba(0,0,0,0.15);
        }
        .card-content-3d {
          transform: translateZ(30px);
        }
      `}</style>
      
      <div className="absolute right-[11%] top-[20%] hidden lg:block perspective-container w-[32rem]">
        <div className="grid grid-cols-2 gap-6 hero-3d-grid relative">
          {heroFeatures.map(({ title, Icon, body }, idx) => (
            <div key={title} className="card-3d rounded-[2rem] bg-white/80 backdrop-blur-xl border border-white p-7 shadow-2xl shadow-slate-400/20"
                 style={{ animationDelay: `${idx * 0.15}s` }}>
              <div className="card-content-3d">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-6 shadow-inner">
                  <Icon className="w-7 h-7 text-slate-800" />
                </div>
                <p className="text-xl font-bold text-slate-900 tracking-tight">{title}</p>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
          <div className="absolute -right-12 -bottom-12 opacity-95" style={{ animation: 'floatImg 6s ease-in-out infinite', transformStyle: 'preserve-3d' }}>
            <img src="/logoweb.png" alt="" className="w-36 h-36 object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.25)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="flex-1 px-6 pt-20 pb-6 flex items-end">
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 96px)" }}>
        <HeroVisual />
        <div className="relative z-10 flex flex-col items-start justify-start h-full p-8 md:p-12 pt-32 md:pt-36">
          <h1 className="text-black text-5xl md:text-6xl font-medium leading-tight max-w-xl mb-4" style={{ letterSpacing: "-0.04em" }}>
            Thi trực tuyến<br />thông minh
          </h1>
          <p
            className="text-black/70 text-base md:text-lg max-w-md mb-8 leading-relaxed"
            style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
          >
            Nền tảng tạo đề, tổ chức phòng thi và giám sát AI giúp kỳ thi trực tuyến minh bạch, an toàn và dễ vận hành.
          </p>
          <PillButton>Vào hệ thống</PillButton>
          <HeroMarquee />
        </div>
      </div>
    </section>
  );
}

function InfoSection() {
  return (
    <section className="bg-[#F5F5F5] px-6 py-24 relative overflow-hidden">
      <div className="max-w-[88rem] mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-start">
          <div>
            <h2 className="text-black text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-8" style={{ letterSpacing: "-0.03em" }}>
              Gặp gỡ<br/>AuraAcademic.
            </h2>
            <PillButton>Khám phá hệ sinh thái</PillButton>
          </div>
          <p className="text-black/70 text-2xl md:text-3xl leading-relaxed font-light">
            Nền tảng kết nối giáo viên, học sinh và quản trị viên trong một quy trình thi số liền mạch: từ ngân hàng câu hỏi đến báo cáo vi phạm AI.
          </p>
        </div>

        <style>{`
          .tilt-card {
            transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.6s;
            transform-style: preserve-3d;
          }
          .tilt-card:hover {
            transform: translateY(-10px) rotateX(4deg) rotateY(-4deg);
            box-shadow: 25px 25px 50px rgba(0,0,0,0.1);
            z-index: 10;
          }
          .tilt-content {
            transform: translateZ(35px);
          }
        `}</style>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 perspective-container">
          <article className="lg:col-span-2 tilt-card rounded-[2rem] overflow-hidden bg-[radial-gradient(circle_at_78%_22%,rgba(255,255,255,0.95),transparent_20%),linear-gradient(135deg,#dbeafe_0%,#f8fafc_48%,#b6d4f1_100%)] border border-white shadow-xl shadow-blue-900/5">
            <div className="p-10 min-h-[24rem] flex flex-col justify-between tilt-content h-full">
              <div>
                <div className="w-16 h-16 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-slate-900 text-3xl font-bold leading-snug mb-4" style={{ letterSpacing: "-0.02em" }}>
                  Đề thi được tạo nhanh bằng AI
                </h3>
                <p className="text-slate-600 text-lg max-w-sm">
                  Tải tài liệu, trích xuất câu hỏi hoặc dùng AI để biên soạn bộ đề có cấu trúc rõ ràng trong vài giây.
                </p>
              </div>
            </div>
          </article>

          <article className="tilt-card bg-slate-900 rounded-[2rem] p-10 min-h-[24rem] flex flex-col justify-between shadow-xl shadow-slate-900/20 border border-slate-800 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="tilt-content relative z-10 h-full flex flex-col justify-between">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-white text-3xl font-bold leading-snug mb-4" style={{ letterSpacing: "-0.02em" }}>
                  Phòng thi<br />kiểm soát.
                </h3>
                <p className="text-white/60 text-lg">
                  Theo dõi trạng thái học sinh và lượt nộp bài realtime.
                </p>
              </div>
            </div>
          </article>

          <article className="tilt-card bg-slate-900 rounded-[2rem] p-10 min-h-[24rem] flex flex-col justify-between shadow-xl shadow-slate-900/20 border border-slate-800 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="tilt-content relative z-10 h-full flex flex-col justify-between">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-white text-3xl font-bold leading-snug mb-4" style={{ letterSpacing: "-0.02em" }}>
                  Giám sát<br />tự động
                </h3>
                <p className="text-white/60 text-lg">
                  AI phát hiện hành vi bất thường tự động 100%.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function BackedBySection() {
  return (
    <section className="bg-[#F5F5F5] px-6">
      <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 items-center overflow-hidden">
        <p className="text-black/70 text-base leading-relaxed whitespace-pre-line">
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
              <span key={`${brand.name}-${index}`} className="mx-10 shrink-0 text-black/50 whitespace-nowrap" style={brand.style}>
                {brand.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section className="bg-[#F5F5F5] px-6 py-24">
      <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="md:pr-12 md:pt-2">
          <p className="text-black/60 text-sm mb-2 font-bold tracking-widest uppercase">Vận hành thực tế</p>
          <h2 className="text-5xl md:text-6xl font-medium leading-none mb-6" style={{ letterSpacing: "-0.04em" }}>
            Luồng sử dụng
          </h2>
          <p className="text-black/60 text-lg leading-relaxed max-w-sm mb-8">
            Từ tạo đề, phát mã phòng, giám sát bài làm đến xuất kết quả, AuraAcademic giúp các kỳ thi trực tuyến gọn hơn mà vẫn giữ tiêu chuẩn kiểm soát.
          </p>
          <a href="/login" className="group inline-flex items-center gap-3 text-black text-lg font-medium">
            <span className="w-12 h-12 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-black/20">
              <ArrowRight className="w-5 h-5 text-white" />
            </span>
            Trải nghiệm ngay
          </a>
        </div>

        <div className="relative w-full aspect-square md:aspect-auto md:h-[650px] perspective-container">
          <style>{`
            .showcase-3d {
              transform: rotateY(-15deg) rotateX(10deg);
              transform-style: preserve-3d;
              animation: floatShowcase 12s ease-in-out infinite;
            }
            @keyframes floatShowcase {
              0%, 100% { transform: rotateY(-15deg) rotateX(10deg) translateY(0); box-shadow: 30px 40px 60px rgba(0,0,0,0.1); }
              50% { transform: rotateY(-10deg) rotateX(5deg) translateY(-25px); box-shadow: 20px 50px 80px rgba(0,50,150,0.15); }
            }
            .glass-panel-3d {
              transform: translateZ(60px);
              transform-style: preserve-3d;
            }
            .floating-stats-3d {
              transform: translateZ(90px);
            }
            .stat-card-3d {
              transition: transform 0.4s;
            }
            .stat-card-3d:hover {
              transform: translateZ(20px) translateY(-5px);
            }
          `}</style>
          
          <div className="w-full h-full rounded-[3rem] overflow-hidden showcase-3d relative bg-[radial-gradient(circle_at_65%_16%,rgba(255,255,255,0.95),transparent_22%),linear-gradient(145deg,#e8f2fb_0%,#f7f7f7_44%,#c8d9e8_100%)] border border-white/60">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,50,150,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,50,150,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
            
            <div className="absolute inset-8 lg:inset-10 glass-panel-3d bg-white/50 backdrop-blur-lg rounded-[2rem] border border-white shadow-2xl flex flex-col justify-between p-8 md:p-12">
               <div>
                 <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-600/30">
                   <ShieldCheck className="w-8 h-8 text-white" />
                 </div>
                 <h3 className="text-4xl md:text-5xl font-bold leading-tight mb-4 tracking-tight text-slate-900">
                   Phòng thi<br/>trực tiếp
                 </h3>
                 <p className="text-slate-600 text-lg max-w-sm font-medium leading-relaxed">
                   Giáo viên mở phòng, học sinh vào chờ, hệ thống tự động bắt đầu và theo dõi sĩ số tức thời.
                 </p>
               </div>
               
               <div className="grid grid-cols-3 gap-4 floating-stats-3d">
                 {["Chờ thi", "Đang làm", "Đã nộp"].map((label, index) => (
                   <div key={label} className="stat-card-3d rounded-2xl bg-white shadow-xl shadow-slate-200/60 p-5 md:p-6 border border-slate-100/50 flex flex-col items-center text-center">
                     <p className="text-3xl md:text-4xl font-black text-blue-600 mb-1">{[24, 18, 42][index]}</p>
                     <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="flex flex-col bg-[#F5F5F5]">
      <div className="h-screen flex flex-col overflow-hidden bg-[#F5F5F5]">
        <Navbar />
        <HeroSection />
      </div>
      <InfoSection />
      <BackedBySection />
      <UseCasesSection />
    </main>
  );
}
