"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchAdminExams, deleteAdminExam } from "@/lib/adminApi";

export default function AdminExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const loadExams = useCallback(async () => {
    setLoading(true);
    try { setExams(await fetchAdminExams()); } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadExams(); }, [loadExams]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Xoá bài thi "${title}"?`)) return;
    try { await deleteAdminExam(id); setExams(p => p.filter(e => e.id !== id)); showToast("Đã xoá bài thi"); }
    catch (e: any) { alert(e.message); }
  };

  const filtered = exams.filter(e => !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.code?.toLowerCase().includes(search.toLowerCase()));

  const statusMap: any = {
    DRAFT: { label: "Bản nháp", cls: "bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-2000/10 text-slate-500 dark:text-slate-400 border-slate-500/20" },
    PUBLISHED: { label: "Đã phát hành", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    STARTED: { label: "Đang diễn ra", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    ENDED: { label: "Đã kết thúc", cls: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  };

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-xl animate-bounce">
          ✓ {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0]">Quản lý bài thi</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Giám sát và quản lý tất cả bài thi trên hệ thống</p>
        </div>
        <button onClick={loadExams} className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200 border border-slate-200 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all">
          <span className="material-symbols-outlined text-lg">refresh</span>Làm mới
        </button>
      </div>

      <div className="bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 border border-slate-200/50 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-lg">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-[#0C2E5E] dark:text-[#E2E8F0] font-medium placeholder:text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              placeholder="Tìm theo mã phòng hoặc tên bài..." />
          </div>
          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{filtered.length} bài thi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200/80">
                {["Bài thi", "Mã phòng", "Trạng thái", "Người tạo", "Thời gian", "Hành động"].map(h => (
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
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">Không tìm thấy bài thi nào.</td></tr>
              ) : filtered.map(e => {
                const status = statusMap[e.status || "DRAFT"] || statusMap.DRAFT;
                return (
                  <tr key={e.id} className="hover:bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200/40 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-[#0C2E5E] dark:text-[#E2E8F0] text-sm tracking-tight max-w-[200px] truncate" title={e.title}>{e.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{e.questions?.length || 0} câu hỏi</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono font-bold text-violet-400">{e.code || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{e.createdBy || "System"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {e.createdAt ? new Date(e.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(e.id, e.title)} title="Xoá bài thi"
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
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
