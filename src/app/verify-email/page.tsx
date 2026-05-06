"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAlert } from "@/components/ui/AlertProvider";

function VerifyEmailContent() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8088/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otp }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || data.error || "Mã xác thực không đúng");
      } else {
        showAlert({
          title: "Xác thực thành công!",
          message: "Xác thực email thành công! Bạn có thể đăng nhập ngay.",
          type: "success"
        });
        router.push("/login");
      }
    } catch (err) {
      setError("Lỗi kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch("http://localhost:8088/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        showAlert({
          title: "Đã gửi mã",
          message: "Mã xác thực mới đã được gửi lại tới email của bạn.",
          type: "info"
        });
      }
    } catch(err) {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-outline-variant/20">
        <h2 className="text-2xl font-bold text-center mb-2">Xác thực Email</h2>
        <p className="text-sm text-center text-on-surface-variant mb-6">
          Vui lòng nhập mã OTP 6 số đã được gửi tới {email}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm">{error}</div>}
          <input 
            type="text" 
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value)}
            className="w-full text-center tracking-[1em] text-2xl font-bold p-4 bg-slate-50 border rounded-xl"
            placeholder="------"
            required
          />
          <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90">
            {loading ? "Đang xử lý..." : "Xác nhận OTP"}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-on-surface-variant">
          Chưa nhận được mã? <button onClick={handleResend} className="text-primary hover:underline">Gửi lại</button>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
