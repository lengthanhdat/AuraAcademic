"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchUsers, deleteUser, updateUserRole, toggleUserLock, createUser } from "@/lib/adminApi";

type User = { id: string; fullName: string; email: string; role: string; emailVerified: boolean; accountLocked: boolean; createdAt: string; };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u.email) setCurrentUser(u);
    } catch {}
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try { setUsers(await fetchUsers(roleFilter === "all" ? undefined : roleFilter, search || undefined)); }
    catch { } finally { setLoading(false); }
  }, [roleFilter, search]);

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

  const roleBadge = (r: string) => ({ admin: "bg-violet-50 text-violet-700 border-violet-500/30", teacher: "bg-blue-50 text-blue-700 border-blue-500/30", student: "bg-emerald-50 text-emerald-700 border-emerald-500/30" } as any)[r] || "bg-slate-700 text-slate-500 dark:text-slate-400";
  const roleLabel = (r: string) => ({ admin: "Admin", teacher: "Giáo viên", student: "Học sinh" } as any)[r] || r;

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-xl animate-bounce">
          ✓ {toast}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Reuse the modal logic here or create a dedicated component */}
          <div className="bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 border border-slate-200 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#0C2E5E] dark:text-[#E2E8F0] text-lg">Tính năng chưa khả dụng</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Vui lòng sử dụng tính năng Thêm người dùng ở trang Dashboard.</p>
            <button onClick={() => setShowAddModal(false)} className="w-full py-2.5 bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200 border border-slate-200 text-slate-600 dark:text-slate-300 font-semibold rounded-xl font-semibold text-sm hover:bg-slate-700">Đóng</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0]">Quản lý người dùng</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tra cứu, chỉnh sửa thông tin tài khoản và phân quyền</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadUsers} className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200 border border-slate-200 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all">
            <span className="material-symbols-outlined text-lg">refresh</span>Làm mới
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg shadow-violet-500/20">
            <span className="material-symbols-outlined text-lg">person_add</span>Thêm người dùng
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 border border-slate-200/50 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-lg">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-[#0C2E5E] dark:text-[#E2E8F0] font-medium placeholder:text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              placeholder="Tìm theo tên, email..." />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "student", "teacher", "admin"].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${roleFilter === r ? "bg-violet-600 text-white" : "bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200 text-slate-500 dark:text-slate-400 hover:bg-slate-700"}`}>
                {r === "all" ? "Tất cả" : roleLabel(r)}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{users.length} người dùng</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200/80">
                {["Người dùng", "Email", "Vai trò", "Trạng thái", "Ngày tạo", "Hành động"].map(h => (
                  <th key={h} className="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-cyan-950/40">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">
                  <span className="material-symbols-outlined text-4xl animate-spin block mx-auto mb-2">progress_activity</span>Đang tải...
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">Không tìm thấy người dùng nào.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br ${u.role === "admin" ? "from-violet-500 to-indigo-500" : u.role === "teacher" ? "from-blue-500 to-cyan-500" : "from-emerald-500 to-teal-500"}`}>
                        {u.fullName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-extrabold text-[#0C2E5E] dark:text-[#E2E8F0] text-sm tracking-tight">
                          {u.fullName} {u.email === currentUser?.email && <span className="text-[10px] text-violet-400 font-bold ml-1">(Bạn)</span>}
                        </p>
                        {u.accountLocked && <span className="text-[10px] text-red-400 font-bold">🔒 Đang bị khoá</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
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
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button disabled={u.email === currentUser?.email} onClick={() => handleLock(u)} title={u.accountLocked ? "Mở khoá" : "Khoá"}
                        className={`p-1.5 rounded-lg transition-all ${u.email === currentUser?.email ? "text-slate-300 cursor-not-allowed" : u.accountLocked ? "text-emerald-400 hover:bg-emerald-500/10" : "text-amber-400 hover:bg-amber-500/10"}`}>
                        <span className="material-symbols-outlined text-lg">{u.accountLocked ? "lock_open" : "lock"}</span>
                      </button>
                      <button disabled={u.email === currentUser?.email} onClick={() => handleDelete(u)} title="Xoá tài khoản"
                        className={`p-1.5 rounded-lg transition-all ${u.email === currentUser?.email ? "text-slate-300 cursor-not-allowed" : "text-slate-500 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10"}`}>
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
