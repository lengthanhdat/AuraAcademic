"use client";
import { useEffect, useState } from "react";
import { fetchSettings, updateSettings, fetchSettingsHealth } from "@/lib/adminApi";

type SettingSection = { id: string; label: string; icon: string; };
const SECTIONS: SettingSection[] = [
  { id: "general", label: "Thông tin hệ thống", icon: "tune" },
  { id: "security", label: "Bảo mật & Xác thực", icon: "security" },
  { id: "email", label: "Cấu hình Email", icon: "mail" },
  { id: "ai_config", label: "Quản lý AI Token", icon: "smart_toy" },
  { id: "exam", label: "Cài đặt bài thi", icon: "quiz" },
  { id: "maintenance", label: "Bảo trì hệ thống", icon: "build" },
];

interface ToggleProps {
  label: string;
  desc: string;
  configKey: string;
  settings: Record<string, any>;
  updateVal: (k: string, v: any) => void;
}

const Toggle = ({ label, desc, configKey, settings, updateVal }: ToggleProps) => {
  const on = settings[configKey] === true || settings[configKey] === "true";
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-cyan-950/20 last:border-0">
      <div>
        <p className="text-sm font-semibold text-[#0C2E5E] dark:text-[#E2E8F0]">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button onClick={() => updateVal(configKey, !on)} className={`relative w-12 h-6 rounded-full transition-all ${on ? "bg-[#00C6FF]" : "bg-slate-300 dark:bg-slate-700"}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
};

interface FieldProps {
  label: string;
  configKey: string;
  type?: string;
  settings: Record<string, any>;
  updateVal: (k: string, v: any) => void;
}

const Field = ({ label, configKey, type = "text", settings, updateVal }: FieldProps) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</label>
    <input type={type} value={settings[configKey] || ""} onChange={e => updateVal(configKey, e.target.value)}
      className="w-full bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200 border border-slate-200 dark:border-cyan-950/40 rounded-xl px-4 py-2.5 text-sm text-[#0C2E5E] dark:text-[#E2E8F0] font-medium placeholder:text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C6FF]/30 focus:border-[#00C6FF] transition-all"
    />
  </div>
);

export default function SettingsPage() {
  const [active, setActive] = useState("general");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [health, setHealth] = useState<any>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const loadHealth = () => {
    setCheckingHealth(true);
    fetchSettingsHealth()
      .then(data => setHealth(data))
      .catch(() => {})
      .finally(() => setCheckingHealth(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchSettings()
      .then(data => {
        if (data && Object.keys(data).length > 0) setSettings(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    loadHealth();
  }, []);

  const save = async () => {
    try {
      const payload: Record<string, any> = {};
      dirtyKeys.forEach(k => { payload[k] = settings[k]; });
      if (Object.keys(payload).length === 0) return;
      await updateSettings(payload);
      setDirtyKeys(new Set());
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert("Lỗi lưu cấu hình: " + e.message);
    }
  };

  const updateVal = (k: string, v: any) => {
    setSettings(p => ({ ...p, [k]: v }));
    setDirtyKeys(prev => new Set(prev).add(k));
  };

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0] tracking-tight">Cấu hình hệ thống</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Quản lý toàn bộ cài đặt của nền tảng (Đồng bộ Realtime)</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C6FF]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-1.5">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border-l-[3px] ${
                  active === s.id 
                    ? "bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] dark:from-[#0A1F3E] dark:to-[#0E3E7A] text-white shadow-md shadow-[#0C2E5E]/10 dark:shadow-[#00C6FF]/10 border-[#00C6FF]" 
                    : "text-slate-500 dark:text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-[#0C2E5E]/5 dark:hover:bg-cyan-950/30 border-transparent"
                }`}>
                <span className="material-symbols-outlined text-lg">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-3 bg-white dark:bg-[#0A1F3E]/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200/50 dark:border-cyan-950/30 flex items-center justify-between">
              <h3 className="font-black text-[#0C2E5E] dark:text-[#E2E8F0] tracking-tight">{SECTIONS.find(s=>s.id===active)?.label}</h3>
            </div>
            
            <div className="p-6 space-y-6 flex-1">
              {active === "general" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Tên hệ thống" configKey="system_name" settings={settings} updateVal={updateVal} />
                    <Field label="Phiên bản" configKey="system_version" settings={settings} updateVal={updateVal} />
                  </div>
                  <Field label="Mô tả hệ thống" configKey="system_desc" settings={settings} updateVal={updateVal} />
                </div>
              )}

              {active === "security" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Google OAuth2 Diagnostics Card */}
                  <div className="p-5 bg-slate-50/50 dark:bg-cyan-950/20 border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#00C6FF]">login</span>
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#0C2E5E] dark:text-[#00C6FF]">Cấu hình Google OAuth2</h4>
                      </div>
                      <button onClick={loadHealth} disabled={checkingHealth} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#0C2E5E]/40 border border-slate-200 dark:border-cyan-950/50 rounded-lg text-[10px] font-black text-[#0C2E5E] dark:text-[#00C6FF] hover:bg-slate-50 transition-all disabled:opacity-50 active:scale-95">
                        <span className={`material-symbols-outlined text-[13px] ${checkingHealth ? "animate-spin" : ""}`}>refresh</span> Chẩn đoán
                      </button>
                    </div>
                    {health ? (
                      <div className="grid grid-cols-1 gap-4 text-xs font-semibold">
                        <div className="space-y-1">
                          <p className="text-slate-400 font-bold">Google Client ID (Tĩnh ở Server)</p>
                          <p className="text-[#0C2E5E] dark:text-[#E2E8F0] font-mono break-all bg-slate-100/50 dark:bg-[#051329]/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-cyan-950/40">{health.googleClientId || "Chưa cấu hình"}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 dark:border-cyan-950/20 flex items-center gap-2">
                          <span className="text-slate-400">Trạng thái Google Login:</span>
                          {health.googleConfigured ? (
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-black uppercase text-[10px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>SẴN SÀNG</span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 rounded-full font-black uppercase text-[10px]">CHƯA CẤU HÌNH</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic">Đang tải chẩn đoán...</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Toggle label="Yêu cầu xác thực 2 bước (2FA)" desc="Bắt buộc tất cả người dùng bật xác thực đa yếu tố" configKey="require_2fa" settings={settings} updateVal={updateVal} />
                    <Toggle label="Khoá tài khoản sau 5 lần đăng nhập sai" desc="Tự động khoá và gửi email cảnh báo" configKey="lock_after_5_fails" settings={settings} updateVal={updateVal} />
                    <Toggle label="Chặn đăng nhập đồng thời" desc="Chỉ cho phép 1 phiên hoạt động cùng lúc" configKey="prevent_concurrent_login" settings={settings} updateVal={updateVal} />
                    <Toggle label="Ghi log toàn bộ hoạt động" desc="Audit log đầy đủ cho tất cả API calls" configKey="enable_audit_log" settings={settings} updateVal={updateVal} />
                  </div>
                </div>
              )}

              {active === "email" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* SMTP Diagnostics Card */}
                  <div className="p-5 bg-slate-50/50 dark:bg-cyan-950/20 border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#00C6FF]">mail</span>
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#0C2E5E] dark:text-[#00C6FF]">Trạng thái kết nối SMTP (Mail Server)</h4>
                      </div>
                      <button onClick={loadHealth} disabled={checkingHealth} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#0C2E5E]/40 border border-slate-200 dark:border-cyan-950/50 rounded-lg text-[10px] font-black text-[#0C2E5E] dark:text-[#00C6FF] hover:bg-slate-50 transition-all disabled:opacity-50 active:scale-95">
                        <span className={`material-symbols-outlined text-[13px] ${checkingHealth ? "animate-spin" : ""}`}>refresh</span> Chẩn đoán
                      </button>
                    </div>
                    {health ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                        <div className="space-y-1">
                          <p className="text-slate-400">SMTP Host</p>
                          <p className="text-[#0C2E5E] dark:text-[#E2E8F0] font-bold">{health.smtpHost || "Chưa cấu hình"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-400">SMTP Username</p>
                          <p className="text-[#0C2E5E] dark:text-[#E2E8F0] font-bold">{health.smtpUsername || "Chưa cấu hình"}</p>
                        </div>
                        <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-cyan-950/20 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Cấu hình:</span>
                            {health.smtpConfigured ? (
                              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-black uppercase text-[10px]">ĐÃ CẤU HÌNH</span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 rounded-full font-black uppercase text-[10px]">CHƯA CẤU HÌNH</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Kết nối SMTP:</span>
                            {health.smtpConnected ? (
                              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-black uppercase text-[10px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>HOẠT ĐỘNG</span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 rounded-full font-black uppercase text-[10px] flex items-center gap-1" title={health.smtpError || ""}>LỖI KẾT NỐI</span>
                            )}
                          </div>
                        </div>
                        {!health.smtpConnected && health.smtpError && (
                          <div className="sm:col-span-2 p-3 bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 text-rose-500 dark:text-rose-400 rounded-xl font-mono text-[10px] break-all leading-normal">
                            Lỗi: {health.smtpError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic">Đang tải chẩn đoán...</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Toggle label="Gửi email xác thực khi đăng ký" desc="Yêu cầu xác thực email trước khi đăng nhập" configKey="require_email_verify" settings={settings} updateVal={updateVal} />
                    <Toggle label="Gửi cảnh báo đăng nhập lạ" desc="Thông báo khi phát hiện IP hoặc thiết bị mới" configKey="alert_suspicious_login" settings={settings} updateVal={updateVal} />
                  </div>
                </div>
              )}

              {active === "ai_config" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 bg-sky-500/10 dark:bg-cyan-950/30 border border-sky-500/20 dark:border-cyan-900/30 rounded-xl">
                    <p className="text-xs text-[#0C2E5E] dark:text-sky-300 font-bold leading-relaxed flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">info</span>
                      Cấu hình API Key cung cấp trí tuệ nhân tạo. Hệ thống sẽ lập tức sử dụng token mới ngay sau khi lưu mà không cần khởi động lại server.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <Field label="Google Gemini API Key (Chính)" type="password" configKey="gemini.api.key" settings={settings} updateVal={updateVal} />
                    <Field label="Groq Cloud API Key (Dự phòng)" type="password" configKey="groq.api.key" settings={settings} updateVal={updateVal} />
                  </div>
                </div>
              )}

              {active === "exam" && (
                <div className="space-y-2 animate-fadeIn">
                  <Toggle label="Bật giám sát camera" desc="Kích hoạt AI giám sát trong lúc làm bài" configKey="enable_ai_proctor" settings={settings} updateVal={updateVal} />
                  <Toggle label="Phát hiện gian lận tự động" desc="Tự động cảnh báo khi phát hiện hành vi nghi vấn" configKey="auto_detect_cheat" settings={settings} updateVal={updateVal} />
                </div>
              )}

              {active === "maintenance" && (
                <div className="space-y-4 animate-fadeIn">
                  <Toggle label="Chế độ bảo trì" desc="Tạm thời chặn tất cả truy cập từ người dùng (Chỉ Admin vào được)" configKey="maintenance_mode" settings={settings} updateVal={updateVal} />
                  
                  <div className="p-5 bg-rose-500/5 dark:bg-rose-950/10 border border-rose-500/20 dark:border-rose-900/30 rounded-2xl">
                    <p className="text-sm font-black text-rose-500 mb-1 tracking-tight">Vùng nguy hiểm</p>
                    <p className="text-xs text-slate-400 mb-4 font-medium">Các hành động này không thể hoàn tác, vui lòng cẩn trọng.</p>
                    <div className="flex gap-2">
                      <button onClick={() => alert("Tính năng chưa khả dụng")} className="px-4 py-2 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-600/20 transition-all active:scale-95">
                        Xoá cache hệ thống
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-cyan-950/20 dark:border-cyan-950/30 border-t border-slate-200/50 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {dirtyKeys.size > 0 ? `${dirtyKeys.size} thay đổi chưa lưu` : "Chưa có thay đổi"}
              </p>
              <div className="flex gap-3">
                <button onClick={() => { setDirtyKeys(new Set()); fetchSettings().then(d => d && setSettings(d)); }} className="px-4 py-2 bg-white dark:bg-[#0C2E5E]/40 border border-slate-200 dark:border-cyan-950/50 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all active:scale-95">
                  Huỷ
                </button>
                <button onClick={save} disabled={dirtyKeys.size === 0}
                  className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                    saved 
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" 
                      : "bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] text-white hover:opacity-95 shadow-md shadow-[#0C2E5E]/10 border-l-[3px] border-[#00C6FF]"
                  }`}>
                  {saved && <span className="material-symbols-outlined text-sm">check</span>}
                  {saved ? "Đã lưu!" : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
