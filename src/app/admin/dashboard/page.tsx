"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchAdminStats, fetchUsers, deleteUser, updateUserRole, toggleUserLock, createUser } from "@/lib/adminApi";

type User = { id: string; fullName: string; email: string; role: string; emailVerified: boolean; accountLocked: boolean; createdAt: string; };
type Stats = Record<string, number>;

function StatCard({ icon, label, value, sub, color }: any) {
  const g: any = { violet:"from-violet-600 to-indigo-600 shadow-violet-500/20", emerald:"from-emerald-500 to-teal-600 shadow-emerald-500/20", amber:"from-amber-500 to-orange-500 shadow-amber-500/20", blue:"from-blue-500 to-cyan-500 shadow-blue-500/20", rose:"from-rose-500 to-pink-600 shadow-rose-500/20", slate:"from-slate-500 to-slate-600 shadow-slate-500/10" };
  return (
    <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${g[color]} shadow-lg flex items-center justify-center`}>
          <span className="material-symbols-outlined text-white text-xl" style={{fontVariationSettings:"'FILL' 1"}}>{icon}</span>
        </div>
        {sub && <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">{sub}</span>}
      </div>
      <p className="text-3xl font-black text-white">{value ?? "—"}</p>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: User) => void }) {
  const [form, setForm] = useState({ fullName: "", email: "", role: "student" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: any) => {
    e.preventDefault(); setErr(""); setLoading(true);
    try { const u = await createUser(form); onCreated(u); onClose(); }
    catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white text-lg">Thêm người dùng</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
        </div>
        {err && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm mb-4">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          {[["Họ tên", "fullName", "text"], ["Email", "email", "email"]].map(([label, key, type]) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
              <input required type={type} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vai trò</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40">
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50">
              {loading ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-700">Huỷ</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "analytics">("users");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [weekData] = useState([38, 62, 55, 78, 71, 95, 64]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u.email) setCurrentUser(u);
    } catch {}
  }, []);

  const loadStats = useCallback(async () => {
    try { setStats(await fetchAdminStats()); } catch { } finally { setLoadingStats(false); }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try { setUsers(await fetchUsers(roleFilter === "all" ? undefined : roleFilter, search || undefined)); }
    catch { } finally { setLoadingUsers(false); }
  }, [roleFilter, search]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { const t = setTimeout(loadUsers, 300); return () => clearTimeout(t); }, [loadUsers]);

  const handleDelete = async (u: User) => {
    if (!confirm(`Xoá tài khoản "${u.fullName}"?`)) return;
    try { await deleteUser(u.id); setUsers(p => p.filter(x => x.id !== u.id)); showToast("Đã xoá tài khoản"); }
    catch (e: any) { alert(e.message); }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try { await updateUserRole(id, role); setUsers(p => p.map(u => u.id === id ? { ...u, role } : u)); showToast("Đã cập nhật vai trò"); }
    catch (e: any) { alert(e.message); }
  };

  const handleLock = async (u: User) => {
    const lock = !u.accountLocked;
    try { await toggleUserLock(u.id, lock); setUsers(p => p.map(x => x.id === u.id ? { ...x, accountLocked: lock } : x)); showToast(lock ? "Đã khoá tài khoản" : "Đã mở khoá"); }
    catch (e: any) { alert(e.message); }
  };

  const roleBadge = (r: string) => ({ admin: "bg-violet-500/15 text-violet-300 border-violet-500/30", teacher: "bg-blue-500/15 text-blue-300 border-blue-500/30", student: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" } as any)[r] || "bg-slate-700 text-slate-400";
  const roleLabel = (r: string) => ({ admin: "Admin", teacher: "Giáo viên", student: "Học sinh" } as any)[r] || r;
  const maxW = Math.max(...weekData);

  return (
    <div className="p-6 space-y-6 bg-[#0f172a] min-h-screen relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-xl animate-bounce">
          ✓ {toast}
        </div>
      )}

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onCreated={u => { setUsers(p => [u, ...p]); showToast("Đã tạo tài khoản"); }} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Tổng quan hệ thống</h1>
          <p className="text-slate-500 text-sm mt-1">Quản trị toàn bộ nền tảng AuraAcademic</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadStats} className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all">
            <span className="material-symbols-outlined text-lg">refresh</span>Làm mới
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg shadow-violet-500/20">
            <span className="material-symbols-outlined text-lg">person_add</span>Thêm người dùng
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="group" label="Tổng người dùng" value={loadingStats ? "…" : stats?.totalUsers} color="violet" />
        <StatCard icon="school" label="Giáo viên" value={loadingStats ? "…" : stats?.totalTeachers} color="blue" />
        <StatCard icon="person" label="Học sinh" value={loadingStats ? "…" : stats?.totalStudents} color="emerald" />
        <StatCard icon="quiz" label="Bài thi hoạt động" value={loadingStats ? "…" : stats?.publishedExams} sub="active" color="amber" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="task_alt" label="Lượt nộp bài" value={loadingStats ? "…" : stats?.totalResults} color="rose" />
        <StatCard icon="verified_user" label="Đã xác thực email" value={loadingStats ? "…" : stats?.verifiedUsers} color="emerald" />
        <StatCard icon="library_books" label="Tổng bài thi" value={loadingStats ? "…" : stats?.totalExams} color="slate" />
        <StatCard icon="lock" label="Tài khoản bị khoá" value={loadingStats ? "…" : stats?.lockedUsers} color="rose" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-5">Phân bổ vai trò</h3>
          <div className="space-y-4">
            {[["Học sinh", stats?.totalStudents ?? 0, stats?.totalUsers ?? 1, "emerald"],
              ["Giáo viên", stats?.totalTeachers ?? 0, stats?.totalUsers ?? 1, "blue"],
              ["Admin", stats?.totalAdmins ?? 0, stats?.totalUsers ?? 1, "violet"]].map(([l, v, max, c]) => {
              const pct = max ? Math.round(((v as number) / (max as number)) * 100) : 0;
              const cols: any = { emerald: "bg-emerald-500", blue: "bg-blue-500", violet: "bg-violet-500" };
              return (
                <div key={l as string}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{l as string}</span><span className="text-white font-bold">{v as number} ({pct}%)</span></div>
                  <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${cols[c as string]} rounded-full`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Hoạt động 7 ngày qua</h3>
            <span className="text-xs text-slate-500">Lượt đăng nhập (mẫu)</span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {weekData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-slate-600">{v}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-indigo-400 hover:opacity-100 opacity-80 transition-all" style={{ height: `${(v / maxW) * 100}%` }} />
                <span className="text-[9px] text-slate-600">{["T2","T3","T4","T5","T6","T7","CN"][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-700/50">
          {([["users", "group", "Quản lý người dùng"], ["analytics", "bar_chart", "Phân tích nhanh"]] as const).map(([tab, icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === tab ? "border-violet-500 text-violet-400 bg-violet-500/5" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
              <span className="material-symbols-outlined text-lg">{icon}</span>{label}
            </button>
          ))}
        </div>

        {activeTab === "users" && (
          <>
            <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-700/30">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  placeholder="Tìm theo tên, email..." />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "student", "teacher", "admin"].map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${roleFilter === r ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                    {r === "all" ? "Tất cả" : roleLabel(r)}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-xs text-slate-500">{users.length} người dùng</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/50">
                    {["Người dùng", "Email", "Vai trò", "Trạng thái", "Ngày tạo", "Hành động"].map(h => (
                      <th key={h} className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {loadingUsers ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <span className="material-symbols-outlined text-4xl animate-spin block mx-auto mb-2">progress_activity</span>Đang tải...
                    </td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500">Không tìm thấy người dùng nào.</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br ${u.role === "admin" ? "from-violet-500 to-indigo-500" : u.role === "teacher" ? "from-blue-500 to-cyan-500" : "from-emerald-500 to-teal-500"}`}>
                            {u.fullName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">
                              {u.fullName} {u.email === currentUser?.email && <span className="text-[10px] text-violet-400 font-bold ml-1">(Bạn)</span>}
                            </p>
                            {u.accountLocked && <span className="text-[10px] text-red-400 font-bold">🔒 Đang bị khoá</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <select value={u.role} disabled={u.email === currentUser?.email} onChange={e => handleRoleChange(u.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider bg-transparent ${u.email === currentUser?.email ? "opacity-50 cursor-not-allowed " + roleBadge(u.role) : "cursor-pointer " + roleBadge(u.role)}`}>
                          <option value="student">Học sinh</option>
                          <option value="teacher">Giáo viên</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {u.emailVerified
                          ? <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold"><span className="material-symbols-outlined text-base" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>Xác thực</span>
                          : <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold"><span className="material-symbols-outlined text-base">pending</span>Chưa xác thực</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button disabled={u.email === currentUser?.email} onClick={() => handleLock(u)} title={u.accountLocked ? "Mở khoá" : "Khoá"}
                            className={`p-1.5 rounded-lg transition-all ${u.email === currentUser?.email ? "text-slate-600 cursor-not-allowed" : u.accountLocked ? "text-emerald-400 hover:bg-emerald-500/10" : "text-amber-400 hover:bg-amber-500/10"}`}>
                            <span className="material-symbols-outlined text-lg">{u.accountLocked ? "lock_open" : "lock"}</span>
                          </button>
                          <button disabled={u.email === currentUser?.email} onClick={() => handleDelete(u)} title="Xoá tài khoản"
                            className={`p-1.5 rounded-lg transition-all ${u.email === currentUser?.email ? "text-slate-600 cursor-not-allowed" : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"}`}>
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "analytics" && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white">Thống kê tài khoản</h4>
              {[
                ["Tổng người dùng", stats?.totalUsers ?? "—"],
                ["Đã xác thực email", stats?.verifiedUsers ?? "—"],
                ["Tài khoản bị khoá", stats?.lockedUsers ?? "—"],
                ["Tổng bài thi", stats?.totalExams ?? "—"],
                ["Lượt nộp bài", stats?.totalResults ?? "—"],
              ].map(([l, v]) => (
                <div key={l as string} className="flex items-center justify-between py-2 border-b border-slate-700/30">
                  <span className="text-sm text-slate-400">{l as string}</span>
                  <span className="text-sm font-bold text-white">{v as any}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white">Phân quyền</h4>
              {[["Admin", stats?.totalAdmins ?? 0, "violet"], ["Giáo viên", stats?.totalTeachers ?? 0, "blue"], ["Học sinh", stats?.totalStudents ?? 0, "emerald"]].map(([l, v, c]) => {
                const total = stats?.totalUsers || 1;
                const pct = Math.round(((v as number) / total) * 100);
                const bar: any = { violet: "bg-violet-500", blue: "bg-blue-500", emerald: "bg-emerald-500" };
                return (
                  <div key={l as string}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{l as string}</span><span className="font-bold text-white">{v as number} ({pct}%)</span></div>
                    <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${bar[c as string]} rounded-full`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
