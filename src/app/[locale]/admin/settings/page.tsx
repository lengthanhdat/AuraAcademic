"use client";
import { useEffect, useState } from "react";
import { fetchSettings, updateSettings } from "@/lib/adminApi";

type SettingSection = { id: string; label: string; icon: string; };
const SECTIONS: SettingSection[] = [
  { id: "general", label: "Thông tin hệ thống", icon: "tune" },
  { id: "security", label: "Bảo mật & Xác thực", icon: "security" },
  { id: "email", label: "Cấu hình Email", icon: "mail" },
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
  const on = !!settings[configKey];
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-700/30 last:border-0">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <button onClick={() => updateVal(configKey, !on)} className={`relative w-12 h-6 rounded-full transition-all ${on ? "bg-violet-600" : "bg-slate-700"}`}>
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
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <input type={type} value={settings[configKey] || ""} onChange={e => updateVal(configKey, e.target.value)}
      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
    />
  </div>
);

export default function SettingsPage() {
  const [active, setActive] = useState("general");
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({
    maintenance_mode: false,
    require_2fa: false,
    lock_after_5_fails: true,
  });

  useEffect(() => {
    fetchSettings().then(data => {
      if (data && Object.keys(data).length > 0) setSettings(prev => ({ ...prev, ...data }));
    }).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await updateSettings(settings);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert("Lỗi lưu cấu hình: " + e.message);
    }
  };

  const updateVal = (k: string, v: any) => setSettings(p => ({ ...p, [k]: v }));

  return (
    <div className="p-6 space-y-6 bg-[#0f172a] min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-white">Cấu hình hệ thống</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý toàn bộ cài đặt của nền tảng (Đồng bộ Realtime)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-1">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active === s.id ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
              <span className="material-symbols-outlined text-lg">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-[#1e293b] border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-700/50">
            <h3 className="font-bold text-white">{SECTIONS.find(s=>s.id===active)?.label}</h3>
          </div>
          <div className="p-6 space-y-6 flex-1">
            {active === "general" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Tên hệ thống" configKey="system_name" settings={settings} updateVal={updateVal} />
                  <Field label="Phiên bản" configKey="system_version" settings={settings} updateVal={updateVal} />
                </div>
                <Field label="Mô tả hệ thống" configKey="system_desc" settings={settings} updateVal={updateVal} />
              </>
            )}
            {active === "security" && (
              <div>
                <Toggle label="Yêu cầu xác thực 2 bước (2FA)" desc="Bắt buộc tất cả người dùng bật xác thực đa yếu tố" configKey="require_2fa" settings={settings} updateVal={updateVal} />
                <Toggle label="Khoá tài khoản sau 5 lần đăng nhập sai" desc="Tự động khoá và gửi email cảnh báo" configKey="lock_after_5_fails" settings={settings} updateVal={updateVal} />
                <Toggle label="Chặn đăng nhập đồng thời" desc="Chỉ cho phép 1 phiên hoạt động cùng lúc" configKey="prevent_concurrent_login" settings={settings} updateVal={updateVal} />
                <Toggle label="Ghi log toàn bộ hoạt động" desc="Audit log đầy đủ cho tất cả API calls" configKey="enable_audit_log" settings={settings} updateVal={updateVal} />
              </div>
            )}
            {active === "email" && (
              <div className="space-y-4">
                <Toggle label="Gửi email xác thực khi đăng ký" desc="Yêu cầu xác thực email trước khi đăng nhập" configKey="require_email_verify" settings={settings} updateVal={updateVal} />
                <Toggle label="Gửi cảnh báo đăng nhập lạ" desc="Thông báo khi phát hiện IP hoặc thiết bị mới" configKey="alert_suspicious_login" settings={settings} updateVal={updateVal} />
              </div>
            )}
            {active === "exam" && (
              <div>
                <Toggle label="Bật giám sát camera" desc="Kích hoạt AI giám sát trong lúc làm bài" configKey="enable_ai_proctor" settings={settings} updateVal={updateVal} />
                <Toggle label="Phát hiện gian lận tự động" desc="Tự động cảnh báo khi phát hiện hành vi nghi vấn" configKey="auto_detect_cheat" settings={settings} updateVal={updateVal} />
              </div>
            )}
            {active === "maintenance" && (
              <div className="space-y-4">
                <Toggle label="Chế độ bảo trì" desc="Tạm thời chặn tất cả truy cập từ người dùng (Chỉ Admin vào được)" configKey="maintenance_mode" settings={settings} updateVal={updateVal} />
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-sm font-bold text-red-400 mb-1">Vùng nguy hiểm</p>
                  <p className="text-xs text-slate-500 mb-3">Các hành động này không thể hoàn tác</p>
                  <div className="flex gap-2">
                    <button onClick={() => alert("Tính năng chưa khả dụng")} className="px-3 py-2 bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg text-xs font-bold hover:bg-red-600/30 transition-all">
                      Xoá cache hệ thống
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700/50 flex items-center justify-end gap-3">
            <button className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-all">
              Huỷ
            </button>
            <button onClick={save}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${saved ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-violet-500/20"}`}>
              {saved && <span className="material-symbols-outlined text-sm">check</span>}
              {saved ? "Đã lưu!" : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
