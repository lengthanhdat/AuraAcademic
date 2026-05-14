"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchAdminStats } from "@/lib/adminApi";

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const cols: Record<string, string> = { violet:"bg-violet-500", emerald:"bg-emerald-500", amber:"bg-amber-500", blue:"bg-blue-500", rose:"bg-rose-500" };
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
        <span className="text-white font-bold">{value}</span>
      </div>
      <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${cols[color]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const weekData = [38, 62, 55, 78, 71, 95, 64];
  const maxW = Math.max(...weekData);

  const load = useCallback(async () => {
    setLoading(true);
    try { setStats(await fetchAdminStats()); } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const v = (k: string) => loading ? "…" : (stats[k] ?? 0);

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0]">Thống kê & Báo cáo</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Dữ liệu thống kê từ hệ thống — cập nhật theo thời gian thực</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200 border border-slate-200 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-sm font-semibold hover:bg-slate-700">
          <span className="material-symbols-outlined text-lg">refresh</span>Làm mới
        </button>
      </div>

      {/* KPI Cards from real data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng người dùng",   value: v("totalUsers"),    icon: "group",      color: "violet" },
          { label: "Tổng bài thi",       value: v("totalExams"),    icon: "quiz",       color: "amber" },
          { label: "Lượt nộp bài",       value: v("totalResults"),  icon: "task_alt",   color: "rose" },
          { label: "Đã xác thực email",  value: v("verifiedUsers"), icon: "verified",   color: "emerald" },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 border border-slate-200/50 rounded-2xl p-5">
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xl block mb-3" style={{fontVariationSettings:"'FILL' 1"}}>{k.icon}</span>
            <p className="text-2xl font-black text-white">{k.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 border border-slate-200/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0C2E5E] dark:text-[#E2E8F0]">Lượt đăng nhập 7 ngày</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Dữ liệu mẫu</span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {weekData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{v}</span>
                <div className="w-full rounded-t-xl bg-gradient-to-t from-violet-600 to-indigo-400 opacity-80 hover:opacity-100 transition-all"
                  style={{ height: `${(v / maxW) * 100}%` }} />
                <span className="text-[9px] text-slate-600">{["T2","T3","T4","T5","T6","T7","CN"][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User distribution from real stats */}
        <div className="bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 border border-slate-200/50 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-[#0C2E5E] dark:text-[#E2E8F0] mb-5">Phân bổ người dùng</h3>
          <div className="space-y-4">
            <MiniBar label={`Học sinh (${v("totalStudents")})`} value={stats.totalStudents ?? 0} max={stats.totalUsers || 1} color="emerald" />
            <MiniBar label={`Giáo viên (${v("totalTeachers")})`} value={stats.totalTeachers ?? 0} max={stats.totalUsers || 1} color="blue" />
            <MiniBar label={`Admin (${v("totalAdmins")})`} value={stats.totalAdmins ?? 0} max={stats.totalUsers || 1} color="violet" />
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200/50 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Đã xác thực email</span>
              <span className="font-bold text-white">{v("verifiedUsers")} / {v("totalUsers")}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Tài khoản bị khoá</span>
              <span className="font-bold text-red-400">{v("lockedUsers")}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Bài thi đang hoạt động</span>
              <span className="font-bold text-emerald-400">{v("publishedExams")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts section */}
      <div className="bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 border border-slate-200/50 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-[#0C2E5E] dark:text-[#E2E8F0] mb-4">Cảnh báo hệ thống</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(stats.lockedUsers ?? 0) > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="material-symbols-outlined text-amber-400" style={{fontVariationSettings:"'FILL' 1"}}>lock</span>
              <span className="text-sm font-semibold text-amber-400">{stats.lockedUsers} tài khoản đang bị khoá</span>
            </div>
          )}
          {(stats.totalUsers ?? 0) > 0 && (
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <span className="material-symbols-outlined text-emerald-400" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
              <span className="text-sm font-semibold text-emerald-400">Hệ thống đang hoạt động bình thường</span>
            </div>
          )}
          {(stats.publishedExams ?? 0) > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <span className="material-symbols-outlined text-blue-400" style={{fontVariationSettings:"'FILL' 1"}}>quiz</span>
              <span className="text-sm font-semibold text-blue-400">{stats.publishedExams} bài thi đang diễn ra</span>
            </div>
          )}
          {(stats.lockedUsers ?? 0) === 0 && (stats.totalUsers ?? 0) === 0 && (
            <div className="flex items-center gap-3 p-3 bg-slate-700/50 border border-slate-200 rounded-xl col-span-3">
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">info</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">Đang tải dữ liệu cảnh báo...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
