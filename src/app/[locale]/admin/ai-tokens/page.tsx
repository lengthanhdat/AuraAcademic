"use client";
import { useEffect, useState } from "react";
import { fetchSettings, updateSettings, checkAiToken } from "@/lib/adminApi";

export default function AiTokensPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [checkingGemini, setCheckingGemini] = useState(false);
  const [checkingGroq, setCheckingGroq] = useState(false);
  
  const [geminiStatus, setGeminiStatus] = useState<any>(null);
  const [groqStatus, setGroqStatus] = useState<any>(null);
  
  const [keys, setKeys] = useState({
    "gemini.api.key": "",
    "groq.api.key": "",
  });

  useEffect(() => {
    fetchSettings()
      .then(data => {
        setKeys(prev => ({
          "gemini.api.key": data["gemini.api.key"] || "",
          "groq.api.key": data["groq.api.key"] || "",
        }));
      })
      .catch(e => console.error("Lỗi lấy cấu hình AI:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(keys);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert("Có lỗi xảy ra khi lưu token: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCheck = async (type: "gemini" | "groq") => {
    if (type === "gemini") setCheckingGemini(true); else setCheckingGroq(true);
    try {
      const result = await checkAiToken(type);
      if (type === "gemini") setGeminiStatus(result); else setGroqStatus(result);
    } catch (e: any) {
      const err = { ok: false, msg: e.message || "Lỗi mạng" };
      if (type === "gemini") setGeminiStatus(err); else setGroqStatus(err);
    } finally {
      if (type === "gemini") setCheckingGemini(false); else setCheckingGroq(false);
    }
  };

  const StatusBox = ({ status, checking, onCheck }: any) => (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button onClick={onCheck} disabled={checking} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 bg-blue-500/10 px-3 py-1.5 rounded-lg transition-all hover:bg-blue-500/20 disabled:opacity-50">
          <span className={`material-symbols-outlined text-sm ${checking ? "animate-spin" : ""}`}>{checking ? "sync" : "offline_bolt"}</span>
          {checking ? "Đang kiểm tra..." : "Kiểm tra dung lượng & trạng thái"}
        </button>
      </div>
      
      {status && (
        <div className={`p-4 rounded-xl border ${status.ok ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"} animate-in fade-in duration-300`}>
          {status.ok ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Trạng thái</p>
                <p className="text-xs text-emerald-400 font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Sẵn sàng
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Mô hình</p>
                <p className="text-xs text-white font-bold">{status.model || "Unknown"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Giới hạn (RPM)</p>
                <p className="text-xs text-white font-bold">{status.rpm || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Giới hạn (TPM)</p>
                <p className="text-xs text-amber-400 font-bold">{status.tpm || "N/A"}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-400">
              <span className="material-symbols-outlined text-base">error</span>
              <span className="text-xs font-semibold">{status.msg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-transparent min-h-full text-slate-100">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-400 text-2xl">smart_toy</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0]">Quản lý trí tuệ nhân tạo (AI)</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Cấu hình các khóa API cung cấp sức mạnh xử lý AI và OCR cho toàn hệ thống.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Settings Card */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 border border-slate-200/50 rounded-3xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-[#0C2E5E] dark:text-[#E2E8F0] mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">key</span>
                API Tokens
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">Các thay đổi sẽ có hiệu lực ngay lập tức trên các máy chủ đang chạy.</p>

              <div className="space-y-8">
                {/* Gemini section */}
                <div className="group">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 font-semibold">
                      <span className="w-6 h-6 rounded bg-white flex items-center justify-center p-0.5">
                        <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_red_v2.svg" alt="gemini" className="w-4 h-4" />
                      </span>
                      Google Gemini API Key (Main)
                    </label>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">Mặc định</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={keys["gemini.api.key"]}
                      onChange={(e) => setKeys(p => ({...p, "gemini.api.key": e.target.value}))}
                      placeholder="Nhập Google Gemini API Key..."
                      className="w-full bg-transparent border border-slate-200 rounded-xl px-4 py-3.5 text-white font-mono text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
                    />
                  </div>
                  <StatusBox status={geminiStatus} checking={checkingGemini} onCheck={() => handleCheck("gemini")} />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Được sử dụng làm mô hình chính để phân tích câu hỏi, tạo nội dung & chấm bài.</p>
                </div>

                <hr className="border-slate-200/50" />

                {/* Groq section */}
                <div className="group">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 font-semibold">
                      <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-lg">dynamic_feed</span>
                      Groq Cloud API Key (Fallback)
                    </label>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">Dự phòng</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={keys["groq.api.key"]}
                      onChange={(e) => setKeys(p => ({...p, "groq.api.key": e.target.value}))}
                      placeholder="Nhập Groq Cloud API Key..."
                      className="w-full bg-transparent border border-slate-200 rounded-xl px-4 py-3.5 text-white font-mono text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                  <StatusBox status={groqStatus} checking={checkingGroq} onCheck={() => handleCheck("groq")} />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Dùng để tự động thay thế khi tài khoản Gemini hết quota hoặc gặp sự cố tốc độ mạng.</p>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-200/50 flex items-center justify-end">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg ${
                    saved 
                      ? "bg-emerald-600 text-white shadow-emerald-500/20" 
                      : "bg-blue-600 hover:bg-blue-500 text-white hover:-translate-y-0.5 shadow-blue-500/20"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Đang lưu...
                    </>
                  ) : saved ? (
                    <>
                      <span className="material-symbols-outlined text-base">verified</span>
                      Đã lưu thành công!
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">save</span>
                      Lưu cấu hình mới
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Info sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-blue-600/20 to-indigo-600/5 border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 blur-[60px] rounded-full"></div>
              <h3 className="text-lg font-black text-[#0C2E5E] dark:text-[#E2E8F0] mb-3 relative">Làm thế nào nó hoạt động?</h3>
              <div className="space-y-4 relative">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">1</div>
                  <p className="text-slate-600 dark:text-slate-300 font-semibold text-xs leading-relaxed">Admin cập nhật Token trong giao diện quản trị này và nhấn lưu.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">2</div>
                  <p className="text-slate-600 dark:text-slate-300 font-semibold text-xs leading-relaxed">Hệ thống Java Spring Boot cập nhật trực tiếp cấu hình trong bộ nhớ nóng cache.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">3</div>
                  <p className="text-slate-600 dark:text-slate-300 font-semibold text-xs leading-relaxed">Tất cả các luồng xử lý AI tiếp theo sẽ tự động chạy với Token mới tức thì.</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 border border-slate-200/50 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 font-semibold mb-4">Tình trạng kết nối</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-transparent p-3 rounded-xl">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Tình trạng AI Service</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    Đang hoạt động
                  </span>
                </div>
                <div className="flex items-center justify-between bg-transparent p-3 rounded-xl">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Độ trễ trung bình</span>
                  <span className="text-white text-xs font-bold">~1.2s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
