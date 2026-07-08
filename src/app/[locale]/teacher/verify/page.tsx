"use client";
import { useState } from "react";
import { useRouter } from "@/navigation";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api";

export default function TeacherVerifyPage() {
  const router = useRouter();
  const [proofType, setProofType] = useState<"LINK" | "DOCUMENT">("LINK");
  const [proofUrl, setProofUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const benefits = [
    { icon: "school", text: "Tạo không giới hạn lớp học" },
    { icon: "library_books", text: "Truy cập Ngân hàng đề thi chung" },
    { icon: "verified", text: "Huy hiệu Giáo viên Xác thực" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!proofUrl.trim()) {
      setError("Vui lòng cung cấp liên kết hoặc mô tả chứng minh.");
      return;
    }
    if (proofType === "LINK" && !proofUrl.startsWith("http")) {
      setError("Liên kết không hợp lệ. Vui lòng bắt đầu bằng https://");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/users/verification-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ proofType, proofUrl: proofUrl.trim(), description }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/teacher/dashboard");
      } else {
        setError(data.error || "Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-start justify-center p-8 pt-12">
      <div className="w-full max-w-2xl space-y-6">

        {/* Back Button */}
        <button
          onClick={() => router.push("/teacher/dashboard")}
          className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-slate-200 transition-colors text-sm font-medium"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay về Dashboard
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface dark:text-slate-200 font-headline tracking-tight">
                Xác thực Tài khoản Giáo viên
              </h1>
              <p className="text-sm text-on-surface-variant dark:text-slate-400">Mở khóa toàn bộ tính năng của AuraAcademic</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {benefits.map((b) => (
            <div key={b.icon} className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-[#0A1F3E] border border-outline-variant/10 dark:border-cyan-950/40">
              <span className="material-symbols-outlined text-lg text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
              <span className="text-sm font-medium text-on-surface dark:text-slate-300">{b.text}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#0A1F3E] rounded-2xl border border-outline-variant/10 dark:border-cyan-950/40 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 dark:border-cyan-950/40">
            <h2 className="text-lg font-bold text-on-surface dark:text-slate-200">Gửi Bằng chứng Xác thực</h2>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">
              Cung cấp liên kết hoạt động giảng dạy công khai hoặc mô tả kinh nghiệm của bạn.
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Proof Type Selector */}
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Phương thức xác thực
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "LINK", icon: "link", label: "Liên kết công khai", desc: "Facebook, Youtube, LinkedIn..." },
                  { value: "DOCUMENT", icon: "description", label: "Mô tả tài liệu", desc: "Tên trường, chứng chỉ..." },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setProofType(opt.value); setProofUrl(""); }}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center ${
                      proofType === opt.value
                        ? "border-[#00C6FF] bg-[#00C6FF]/5 text-[#0C2E5E] dark:text-[#00C6FF]"
                        : "border-slate-200 dark:border-cyan-950/60 text-on-surface-variant dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{opt.icon}</span>
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[10px] opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Proof URL/Text Input */}
            <div>
              <label htmlFor="proofUrl" className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                {proofType === "LINK" ? "Liên kết" : "Thông tin chứng minh"}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              {proofType === "LINK" ? (
                <input
                  id="proofUrl"
                  type="url"
                  required
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://www.facebook.com/your-teaching-page"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/60 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/40 outline-none text-on-surface dark:text-slate-200 font-medium text-sm placeholder-slate-400"
                />
              ) : (
                <textarea
                  id="proofUrl"
                  required
                  rows={3}
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="Ví dụ: Giáo viên Toán tại Trường THPT ABC, có 5 năm kinh nghiệm, chứng chỉ sư phạm số XYZ..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/60 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/40 outline-none text-on-surface dark:text-slate-200 font-medium text-sm placeholder-slate-400 resize-none"
                />
              )}
            </div>

            {/* Optional Description */}
            <div>
              <label htmlFor="description" className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Mô tả thêm <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </label>
              <textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Thông tin bổ sung về kinh nghiệm giảng dạy của bạn..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/60 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/40 outline-none text-on-surface dark:text-slate-200 text-sm placeholder-slate-400 resize-none"
              />
            </div>

            {/* Notice */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <span className="material-symbols-outlined text-blue-600 text-lg shrink-0 mt-0.5">info</span>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Thông tin bạn cung cấp sẽ được đội ngũ AuraAcademic xem xét trong vòng <strong>24 giờ làm việc</strong>.
                Chúng tôi cam kết bảo mật thông tin của bạn.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800/50">
                <span className="material-symbols-outlined text-red-600 text-base">error</span>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/teacher/dashboard")}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-on-surface-variant dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !proofUrl.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">refresh</span>
                  Đang gửi...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">send</span>
                  Gửi yêu cầu xác thực
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
