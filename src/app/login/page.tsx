"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8088/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Email hoặc mật khẩu không đúng");
      } else {
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.user?.role === "admin") {
          router.push("/admin/dashboard");
        } else if (data.user?.role === "teacher") {
          router.push("/teacher/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ. Hãy chắc chắn rằng Backend đang chạy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center bg-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <span className="text-xl font-extrabold text-primary tracking-tight">Digital Proctor</span>
        </div>
        <div className="flex gap-4 pointer-events-auto">
          <button className="p-2 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md shadow-sm hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-primary">help_outline</span>
          </button>
          <button className="p-2 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md shadow-sm hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-primary">language</span>
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row min-h-screen">
        {/* Left Panel: The Document Layer/Branding */}
        <section className="hidden md:flex md:w-1/2 signature-gradient relative items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0 opacity-20 ai-pulse scale-150"></div>
          <div className="relative z-10 max-w-lg space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                <span className="text-primary-fixed-dim text-sm font-semibold tracking-wider uppercase">Bảo mật đa tầng</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                Hệ thống Thi Trực tuyến & Giám sát AI an toàn
              </h1>
              <p className="text-primary-fixed-dim text-xl font-medium leading-relaxed opacity-90">
                Đảm bảo tính minh bạch và công bằng tuyệt đối cho mọi kỳ thi với công nghệ nhận diện và phân tích hành vi thông minh.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/5">
                <span className="material-symbols-outlined text-white mb-4 text-3xl">psychology</span>
                <h3 className="text-white font-bold text-lg">Giám sát AI</h3>
                <p className="text-primary-fixed-dim/70 text-sm mt-2">Phát hiện gian lận bằng trí tuệ nhân tạo thời gian thực.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/5">
                <span className="material-symbols-outlined text-white mb-4 text-3xl">shield</span>
                <h3 className="text-white font-bold text-lg">Bảo mật Dữ liệu</h3>
                <p className="text-primary-fixed-dim/70 text-sm mt-2">Mã hóa đầu cuối bảo vệ tuyệt đối thông tin thí sinh.</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] opacity-10 rotate-12 pointer-events-none">
            <img className="w-full h-full object-contain" alt="Abstract digital network visualization" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1wQU1_5JaGL5yUrnjfLOk2yd0Ig6_YkehO-ZtSe6PYTMDWiAs48UXK6w0Z90EMnGHmVn4PqbXmiqEAuyaSjtKgGSY123DNY7NLj361uXNLbKnZ7BiO7AxOEcrvSEpHsJZZ1YYhE4USYJHst3itrbox9z9c6RUsXvWHvXxktZLTZSoAr50vNcB_mwbKugxdHXZ5TWEGNw8djuJZyoFu4j1RhO-uT8tL3zCpro9MqB0KvH7M1VxjVTORsOroiBZbGw3ZU7_Th-us90" />
          </div>
        </section>

        {/* Right Panel: The Intelligence Layer/Login */}
        <section className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-surface relative z-10">
          <div className="w-full max-w-[440px] space-y-8">
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Chào mừng trở lại</h2>
              <p className="text-on-surface-variant font-medium">Vui lòng đăng nhập để tiếp tục vào phòng thi.</p>
            </div>

            <div className="space-y-4">
              <button className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-surface-container-lowest text-on-surface font-semibold shadow-sm hover:bg-surface-container-low transition-all duration-200 border border-outline-variant/10">
                <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkETuhCwUCO3LlSI5x4rYD7wYPqvAMv18XbXfFiHLHjVCg6bGa-gwY51G_UK0YcpB-UhLLooCBK4kZrGeh2bWtK_ETldfE2GU6UO6r9XCcd5FWZ0H5i8Q03Ra50jUUcNufe_KCccQXJi7cNO3GFXqIQJ1u5VObcyNzs8oF5vcljG9iism0tNnz4l9Z425Syek5L5-QlTFspdEFQgafPxtVyLFoTQ0kE-hWMyC4VxgHJDht5irqG5FlO_8yg3B-BfbOzs6lZI2NXRc" />
                <span>Tiếp tục với Google</span>
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="flex-grow h-[1px] bg-outline-variant/20"></div>
                <span className="text-xs font-bold text-on-surface-variant/60 tracking-widest uppercase">HOẶC</span>
                <div className="flex-grow h-[1px] bg-outline-variant/20"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">{error}</div>}
              
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant ml-1">Email</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors">person</span>
                    <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container-highest/30 border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none" placeholder="example@domain.com" type="email" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Mật khẩu</label>
                    <a className="text-xs font-bold text-primary hover:underline transition-all" href="#">Quên mật khẩu?</a>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors">lock</span>
                    <input value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-surface-container-highest/30 border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none" placeholder="••••••••" type="password" required />
                  </div>
                </div>

                <div className="pt-2">
                  <button disabled={loading} type="submit" className="w-full signature-gradient text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
                    {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                  </button>
                </div>
              </form>
            </div>

            <div className="text-center">
              <p className="text-on-surface-variant text-sm font-medium">
                Bạn là người mới? <Link className="text-primary font-bold hover:underline" href="/register">Đăng Ký</Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full bg-surface-container-low/50 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-on-surface-variant font-body text-sm opacity-80">
            © 2024 Digital Proctor Academic Systems. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a className="text-on-surface-variant text-sm font-medium hover:text-primary transition-all opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant text-sm font-medium hover:text-primary transition-all opacity-80 hover:opacity-100" href="#">Terms of Service</a>
            <a className="text-on-surface-variant text-sm font-medium hover:text-primary transition-all opacity-80 hover:opacity-100" href="#">Institutional Security</a>
            <a className="text-on-surface-variant text-sm font-medium hover:text-primary transition-all opacity-80 hover:opacity-100" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
