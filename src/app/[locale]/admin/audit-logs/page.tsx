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
  "2FA_ENABLE":    ["security",       "violet"],
  "2FA_DISABLE":   ["no_encryption",  "amber"],
  ROLE_CHANGE:     ["manage_accounts","violet"],
  OTP_VERIFIED:    ["verified",       "cyan"],
};

const colorMap: Record<string, string> = {
  emerald: "text-emerald-400 bg-emerald-400/10",
  red:     "text-red-400 bg-red-400/10",
  blue:    "text-blue-400 bg-blue-400/10",
  amber:   "text-amber-400 bg-amber-400/10",
  violet:  "text-violet-400 bg-violet-400/10",
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
    .filter(l => !search || l.email?.includes(search) || l.ipAddress?.includes(search) || l.event?.includes(search));

  const fmtTime = (ts: string) => {
    try { return new Date(ts).toLocaleString("vi-VN"); } catch { return ts; }
  };

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0]">Audit Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Toàn bộ hoạt động bảo mật hệ thống — real-time</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200 border border-slate-200 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-sm font-semibold hover:bg-slate-700">
          <span className="material-symbols-outlined text-lg">refresh</span>Làm mới
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Tổng sự kiện",        summary.total ?? "…",        "policy",   "violet"],
          ["Đăng nhập thành công",summary.loginSuccess ?? "…", "login",    "emerald"],
          ["Đăng nhập thất bại",  summary.failures ?? "…",     "gpp_bad",  "rose"],
          ["IP đáng ngờ",         summary.suspiciousIpCount ?? "…", "radar", "amber"],
        ].map(([l, v, ic, c]) => {
          const bg: any = { violet:"bg-violet-500/10 border-violet-500/20 text-violet-400", emerald:"bg-emerald-500/10 border-emerald-500/20 text-emerald-400", rose:"bg-rose-500/10 border-rose-500/20 text-rose-400", amber:"bg-amber-500/10 border-amber-500/20 text-amber-400" };
          return (
            <div key={l as string} className="bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 border border-slate-200/50 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${bg[c as string]}`}>
                <span className="material-symbols-outlined text-lg" style={{fontVariationSettings:"'FILL' 1"}}>{ic as string}</span>
              </div>
              <p className="text-2xl font-black text-white">{loading ? "…" : v as any}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">{l as string}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 border border-slate-200/50 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-lg">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-[#0C2E5E] dark:text-[#E2E8F0] font-medium placeholder:text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              placeholder="Email, IP, sự kiện..." />
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "fail", "LOGIN", "REGISTER", "FAILED_LOGIN"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? "bg-violet-600 text-white" : "bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200 text-slate-500 dark:text-slate-400 hover:bg-slate-700"}`}>
                {f === "all" ? "Tất cả" : f === "fail" ? "Thất bại" : f.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{filtered.length} sự kiện</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200/80">
                {["Sự kiện", "Email", "IP Address", "Thiết bị", "Thời gian", "Kết quả"].map(h => (
                  <th key={h} className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-cyan-950/40">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">
                  <span className="material-symbols-outlined text-4xl animate-spin block mx-auto mb-2">progress_activity</span>Đang tải...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">Không có sự kiện nào.</td></tr>
              ) : filtered.map(log => {
                const [ic, c] = EVENT_ICONS[log.event] || ["info", "slate"];
                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[c]}`}>
                          <span className="material-symbols-outlined text-base" style={{fontVariationSettings:"'FILL' 1"}}>{ic}</span>
                        </div>
                        <span className="text-sm font-semibold text-white whitespace-nowrap">{log.event?.replace(/_/g, " ")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{log.email || "—"}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">{log.ipAddress || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={log.userAgent}>{log.userAgent || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtTime(log.timestamp)}</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 text-xs font-bold ${log.success ? "text-emerald-400" : "text-red-400"}`}>
                        <span className="material-symbols-outlined text-sm" style={{fontVariationSettings:"'FILL' 1"}}>{log.success ? "check_circle" : "cancel"}</span>
                        {log.success ? "Thành công" : "Thất bại"}
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
