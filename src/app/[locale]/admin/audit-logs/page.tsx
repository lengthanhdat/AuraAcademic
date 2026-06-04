"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchAuditLogs, fetchAuditSummary } from "@/lib/adminApi";

type Log = { id: string; event: string; email: string; ipAddress: string; userAgent: string; timestamp: string; success: boolean; details?: string; };

const EVENT_ICONS: Record<string, [string, string]> = {
  LOGIN:           ["login",          "emerald"],
  LOGOUT:          ["logout",         "slate"],
  REGISTER:        ["person_add",     "blue"],
  PASSWORD_CHANGE: ["lock_reset",     "amber"],
  PASSWORD_RESET:  ["lock_reset",     "amber"],
  FAILED_LOGIN:    ["gpp_bad",        "red"],
  ACCOUNT_LOCKED:  ["lock",           "red"],
  "2FA_ENABLE":    ["security",       "indigo"],
  "2FA_DISABLE":   ["no_encryption",  "amber"],
  ROLE_CHANGE:     ["manage_accounts","indigo"],
  OTP_VERIFIED:    ["verified",       "cyan"],
};

const colorMap: Record<string, string> = {
  emerald: "text-emerald-400 bg-emerald-400/10",
  red:     "text-red-400 bg-red-400/10",
  blue:    "text-blue-400 bg-blue-400/10",
  amber:   "text-amber-400 bg-amber-400/10",
  indigo:  "text-indigo-400 bg-indigo-400/10",
  slate:   "text-slate-500 dark:text-slate-400 bg-slate-400/10",
  cyan:    "text-cyan-400 bg-cyan-400/10",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, s] = await Promise.all([fetchAuditLogs(200), fetchAuditSummary()]);
      setLogs(l); setSummary(s);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = logs
    .filter(l => {
      if (filter === "fail") return !l.success;
      if (filter !== "all") return l.event === filter;
      return true;
    })
    .filter(l => !search || l.email?.toLowerCase().includes(search.toLowerCase()) || l.ipAddress?.includes(search) || l.event?.toLowerCase().includes(search.toLowerCase()));

  const fmtTime = (ts: string) => {
    try { return new Date(ts).toLocaleString("vi-VN"); } catch { return ts; }
  };

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0] tracking-tight">Audit Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Toàn bộ hoạt động bảo mật hệ thống — real-time</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 hover:bg-slate-50 dark:hover:bg-cyan-950/30 dark:text-slate-300 text-slate-600 rounded-xl text-xs font-extrabold hover:border-slate-300 transition-all shadow-sm active:scale-95">
          <span className="material-symbols-outlined text-base">refresh</span>Làm mới
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Tổng sự kiện",        summary.total ?? "…",        "policy",   "indigo"],
          ["Đăng nhập thành công",summary.loginSuccess ?? "…", "login",    "emerald"],
          ["Đăng nhập thất bại",  summary.failures ?? "…",     "gpp_bad",  "rose"],
          ["IP đáng ngờ",         summary.suspiciousIpCount ?? "…", "radar", "amber"],
        ].map(([l, v, ic, c]) => {
          const bg: any = { 
            indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400", 
            emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", 
            rose: "bg-rose-500/10 border-rose-500/20 text-rose-400", 
            amber: "bg-amber-500/10 border-amber-500/20 text-amber-400" 
          };
          return (
            <div key={l as string} className="bg-white dark:bg-[#0A1F3E]/95 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${bg[c as string]}`}>
                <span className="material-symbols-outlined text-lg" style={{fontVariationSettings:"'FILL' 1"}}>{ic as string}</span>
              </div>
              <p className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0] tracking-tight">{loading ? "…" : v as any}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1.5 uppercase tracking-wider">{l as string}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0A1F3E]/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl overflow-hidden flex flex-col">
        <div className="flex flex-wrap items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-cyan-950/30">
          <div className="relative min-w-[220px] flex-1 max-w-xs group">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-[#0C2E5E] dark:text-[#E2E8F0]">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0C2E5E] dark:text-[#E2E8F0] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C6FF]/20 focus:border-[#00C6FF] transition-all"
              placeholder="Email, IP, sự kiện..." />
          </div>
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 dark:bg-[#051329] rounded-xl border border-slate-100 dark:border-cyan-950/40">
            {["all", "fail", "LOGIN", "REGISTER", "FAILED_LOGIN"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  filter === f 
                    ? "bg-white text-[#0C2E5E] dark:text-[#E2E8F0] shadow-sm border border-slate-200 dark:border-cyan-950/40" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-cyan-950/40"
                }`}>
                {f === "all" ? "Tất cả" : f === "fail" ? "Thất bại" : f.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs font-bold text-[#0C2E5E] dark:text-[#E2E8F0] bg-slate-100/50 dark:bg-[#051329]/50 border border-slate-200/40 dark:border-cyan-950/40 px-2.5 py-1 rounded-md">{filtered.length} sự kiện</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-[#051329]/50 border-b border-slate-100 dark:border-cyan-950/40">
                {["Sự kiện", "Thông tin Email", "IP Address", "Thiết bị & Trình duyệt", "Thời gian", "Kết quả"].map(h => (
                  <th key={h} className="px-6 py-3.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-cyan-950/30">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-3xl animate-spin text-[#0C2E5E] dark:text-[#E2E8F0]">progress_activity</span>
                    <span className="text-sm font-bold">Đang đồng bộ cơ sở dữ liệu...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-bold">Không có sự kiện nào được ghi nhận.</td></tr>
              ) : filtered.map(log => {
                const [ic, c] = EVENT_ICONS[log.event] || ["info", "slate"];
                return (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-[#0C2E5E]/20 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[c] || "text-slate-400 bg-slate-400/10"}`}>
                          <span className="material-symbols-outlined text-base" style={{fontVariationSettings:"'FILL' 1"}}>{ic}</span>
                        </div>
                        <span className="text-sm font-bold text-[#0C2E5E] dark:text-[#E2E8F0] whitespace-nowrap">{log.event?.replace(/_/g, " ")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">{log.email || "—"}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">{log.ipAddress || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-[180px] truncate font-medium" title={log.userAgent}>{log.userAgent || "—"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#0C2E5E] dark:text-[#E2E8F0] whitespace-nowrap">{fmtTime(log.timestamp)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${log.success ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-rose-500 bg-rose-500/10 border-rose-500/20"}`}>
                        <span className="material-symbols-outlined text-xs" style={{fontVariationSettings:"'FILL' 1"}}>{log.success ? "check_circle" : "cancel"}</span>
                        {log.success ? "THÀNH CÔNG" : "THẤT BẠI"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
