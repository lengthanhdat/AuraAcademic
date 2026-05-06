"use client";
import { useEffect, useState } from "react";
import { fetchAdminSessions, revokeAdminSession } from "@/lib/adminApi";


export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadSessions = async () => {
    try {
      const data = await fetchAdminSessions();
      setSessions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevoke = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn đăng xuất người dùng này từ xa?")) return;
    try {
      await revokeAdminSession(id);
      setSessions(sessions.filter(s => s.id !== id));
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    }
  };

  const filtered = sessions.filter(s => 
    s.email?.toLowerCase().includes(search.toLowerCase()) || 
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.ipAddress?.includes(search)
  );

  return (
    <div className="p-6 space-y-6 bg-[#0f172a] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-500">devices</span>
            Quản lý phiên đăng nhập
          </h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi và thu hồi các phiên truy cập đang hoạt động</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input 
              type="text" 
              placeholder="Tìm email, tên, IP..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 w-64"
            />
          </div>
          <button onClick={loadSessions} className="p-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-all">
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 animate-pulse">Đang tải danh sách phiên...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 bg-slate-900/50 rounded-2xl border border-slate-800/50 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-700 mb-4">no_accounts</span>
            <p className="text-slate-500">Không tìm thấy phiên đăng nhập nào</p>
          </div>
        ) : (
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Người dùng</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Thiết bị & Trình duyệt</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Địa chỉ IP</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xs border border-violet-500/20">
                          {s.fullName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{s.fullName}</p>
                          <p className="text-xs text-slate-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="material-symbols-outlined text-lg">
                          {s.deviceInfo?.toLowerCase().includes("mobile") ? "smartphone" : "desktop_windows"}
                        </span>
                        <p className="text-xs truncate max-w-[200px]" title={s.deviceInfo}>{s.deviceInfo}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-800 rounded text-[10px] font-mono text-slate-400 border border-slate-700">
                        {s.ipAddress || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <p className="text-slate-300">Bắt đầu: {new Date(s.createdAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "2-digit" })}</p>
                        <p className="text-slate-500">Hết hạn: {new Date(s.expiresAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "2-digit" })}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {s.expired ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">Hết hạn</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 animate-pulse">Đang hoạt động</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRevoke(s.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Đăng xuất từ xa"
                      >
                        <span className="material-symbols-outlined text-lg">logout</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
