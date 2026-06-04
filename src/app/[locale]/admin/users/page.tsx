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
    try {
      setUsers(await fetchUsers(roleFilter === "all" ? undefined : roleFilter, search || undefined));
    } catch { } finally { setLoading(false); }
  }, [roleFilter, search]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const handleDelete = async (u: User) => {
    if (u.email === currentUser?.email) {
      showToast("Bạn không thể tự xoá tài khoản chính mình!");
      return;
    }
    if (!confirm(`Xoá tài khoản "${u.fullName}"?`)) return;
    try {
      await deleteUser(u.id);
      setUsers(p => p.filter(x => x.id !== u.id));
      showToast("Đã xoá tài khoản");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRoleChange = async (id: string, role: string, userEmail: string) => {
    if (userEmail === currentUser?.email) {
      showToast("Bạn không thể tự thay đổi vai trò chính mình!");
      return;
    }
    try {
      await updateUserRole(id, role);
      setUsers(p => p.map(u => u.id === id ? { ...u, role } : u));
      showToast("Đã cập nhật vai trò");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleLock = async (u: User) => {
    if (u.email === currentUser?.email) {
      showToast("Bạn không thể tự khoá tài khoản chính mình!");
      return;
    }
    const lock = !u.accountLocked;
    try {
      await toggleUserLock(u.id, lock);
      setUsers(p => p.map(x => x.id === u.id ? { ...x, accountLocked: lock } : x));
      showToast(lock ? "Đã khoá tài khoản" : "Đã mở khoá");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const roleBadge = (r: string) => ({
    admin: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
    teacher: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
    student: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
  } as any)[r] || "bg-slate-100 text-slate-500 dark:bg-[#051329]/50 dark:text-slate-400 border-slate-200 dark:border-cyan-950/40";

  const roleLabel = (r: string) => ({ admin: "Admin", teacher: "Giáo viên", student: "Học sinh" } as any)[r] || r;

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-[#0C2E5E] text-white rounded-2xl font-black text-sm shadow-xl border border-cyan-400/20 flex items-center gap-2 animate-slideUp">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span> {toast}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A1F3E] border border-slate-200/50 dark:border-cyan-950/40 shadow-2xl rounded-2xl w-full max-w-md p-6 animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[#0C2E5E] dark:text-[#E2E8F0] text-lg tracking-tight">Tính năng chưa khả dụng</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-red-500 p-1 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-lg transition-all"><span className="material-symbols-outlined">close</span></button>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 font-medium">Vui lòng sử dụng tính năng Thêm người dùng ở trang Dashboard.</p>
            <button onClick={() => setShowAddModal(false)} className="w-full py-3 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">Đóng</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0] tracking-tight">Quản lý người dùng</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Tra cứu, chỉnh sửa thông tin tài khoản và phân quyền</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadUsers} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 hover:bg-slate-50 dark:hover:bg-cyan-950/30 dark:text-slate-300 text-slate-600 rounded-xl text-xs font-extrabold hover:border-slate-300 transition-all shadow-sm active:scale-95">
            <span className="material-symbols-outlined text-base">refresh</span>Làm mới
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] text-white rounded-xl text-xs font-black hover:opacity-95 shadow-md shadow-[#0C2E5E]/10 border-l-[3px] border-[#00C6FF] transition-all active:scale-95">
            <span className="material-symbols-outlined text-base">person_add</span>Thêm người dùng
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0A1F3E]/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl overflow-hidden flex flex-col">
        <div className="flex flex-wrap items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-cyan-950/30">
          <div className="relative flex-1 min-w-[220px] max-w-xs group">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-[#0C2E5E] dark:text-[#E2E8F0]">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0C2E5E] dark:text-[#E2E8F0] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C6FF]/20 focus:border-[#00C6FF] transition-all"
              placeholder="Tìm theo tên, email..." />
          </div>
          <div className="flex gap-1.5 flex-wrap p-1 bg-slate-50 dark:bg-[#051329] rounded-xl border border-slate-100 dark:border-cyan-950/40">
            {["all", "student", "teacher", "admin"].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  roleFilter === r 
                    ? "bg-white text-[#0C2E5E] dark:text-[#E2E8F0] shadow-sm border border-slate-200 dark:border-cyan-950/40" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-cyan-950/40"
                }`}>
                {r === "all" ? "Tất cả" : roleLabel(r)}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs font-bold text-[#0C2E5E] dark:text-[#E2E8F0] bg-slate-100/50 dark:bg-[#051329]/50 border border-slate-200/40 dark:border-cyan-950/40 px-2.5 py-1 rounded-md">{users.length} tài khoản</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-[#051329]/50 border-b border-slate-100 dark:border-cyan-950/40">
                {["Người dùng", "Thông tin Email", "Phân quyền vai trò", "Xác thực Email", "Thời gian đăng ký", "Tác vụ Quản lý"].map(h => (
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
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-bold">Không tìm thấy người dùng nào phù hợp.</td></tr>
              ) : users.map(u => {
                const isSelf = u.email === currentUser?.email;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-[#0C2E5E]/20 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 bg-gradient-to-br ${
                          u.role === "admin" ? "from-indigo-500 to-sky-500" : u.role === "teacher" ? "from-blue-500 to-cyan-500" : "from-emerald-500 to-teal-500"
                        }`}>
                          {u.fullName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-extrabold text-[#0C2E5E] dark:text-[#E2E8F0] text-sm tracking-tight leading-tight">
                            {u.fullName} {isSelf && <span className="text-[10px] text-[#00C6FF] font-black ml-1">(BẠN)</span>}
                          </p>
                          {u.accountLocked && <span className="text-[9px] font-black bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded px-1.5 py-0.5 inline-block mt-0.5 uppercase tracking-wider">🔒 Đã khoá</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">{u.email}</td>
                    <td className="px-6 py-4">
                      <select value={u.role} disabled={isSelf} onChange={e => handleRoleChange(u.id, e.target.value, u.email)}
                        className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider bg-transparent outline-none transition-all ${
                          isSelf 
                            ? "opacity-50 cursor-not-allowed " + roleBadge(u.role) 
                            : "cursor-pointer hover:brightness-95 " + roleBadge(u.role)
                        }`}>
                        <option value="student">Học sinh</option>
                        <option value="teacher">Giáo viên</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {u.emailVerified
                        ? <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/30 rounded-full px-2 py-0.5"><span className="material-symbols-outlined text-sm" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>ĐÃ XÁC THỰC</span>
                        : <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-extrabold bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-950/30 rounded-full px-2 py-0.5"><span className="material-symbols-outlined text-sm">pending</span>ĐANG CHỜ</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#0C2E5E] dark:text-[#E2E8F0] whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button disabled={isSelf} onClick={() => handleLock(u)} title={isSelf ? "Không thể tự khoá chính mình" : u.accountLocked ? "Mở khoá tài khoản" : "Khoá tài khoản"}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isSelf 
                              ? "text-slate-300 dark:text-slate-600 border-transparent cursor-not-allowed opacity-30" 
                              : u.accountLocked 
                                ? "text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:hover:bg-emerald-950/40" 
                                : "text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/40 dark:hover:bg-amber-950/40"
                          }`}>
                          <span className="material-symbols-outlined text-lg">{u.accountLocked ? "lock_open" : "lock"}</span>
                        </button>
                        <button disabled={isSelf} onClick={() => handleDelete(u)} title={isSelf ? "Không thể tự xoá chính mình" : "Xoá vĩnh viễn"}
                          className={`p-1.5 rounded-lg border border-transparent transition-all ${
                            isSelf 
                              ? "text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-30" 
                              : "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                          }`}>
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
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
