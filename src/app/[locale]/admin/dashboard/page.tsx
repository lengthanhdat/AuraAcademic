"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchAdminStats, fetchUsers, deleteUser, updateUserRole, toggleUserLock, createUser } from "@/lib/adminApi";

type User = { id: string; fullName: string; email: string; role: string; emailVerified: boolean; accountLocked: boolean; createdAt: string; };
type Stats = Record<string, number>;

function StatCard({ icon, label, value, sub, color }: any) {
  const g: any = { 
    indigo: "from-indigo-600 to-blue-600 shadow-indigo-500/20", 
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/20", 
    amber: "from-amber-500 to-orange-500 shadow-amber-500/20", 
    blue: "from-blue-500 to-cyan-500 shadow-blue-500/20", 
    rose: "from-rose-500 to-pink-600 shadow-rose-500/20", 
    slate: "from-[#0C2E5E] to-[#0E3E7A] shadow-slate-500/10" 
  };
  return (
    <div className="bg-white dark:bg-[#0A1F3E]/95 backdrop-blur-md border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl p-5 hover:border-[#00C6FF]/20 hover:shadow-[0_16px_36px_rgba(12,46,94,0.06)] transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${g[color]} shadow-md flex items-center justify-center group-hover:scale-105 transition-transform`}>
          <span className="material-symbols-outlined text-white text-xl" style={{fontVariationSettings:"'FILL' 1"}}>{icon}</span>
        </div>
        {sub && <span className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <p className="text-3xl font-black text-[#0C2E5E] dark:text-[#E2E8F0] dark:text-[#E2E8F0] dark:text-[#00C6FF] tracking-tight">{value ?? "—"}</p>
      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mt-1.5">{label}</p>
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
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0A1F3E] border border-slate-200/60 dark:border-cyan-950/50 shadow-2xl rounded-2xl w-full max-w-md p-6 animate-scaleIn">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-[#0C2E5E] dark:text-[#E2E8F0] dark:text-[#E2E8F0] text-lg tracking-tight">Thêm người dùng mới</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 p-1 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-lg transition-all"><span className="material-symbols-outlined">close</span></button>
        </div>
        {err && <div className="p-3 bg-red-50 border border-red-100 text-red-600 font-semibold rounded-xl text-xs mb-4">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          {[["Họ tên đầy đủ", "fullName", "text"], ["Địa chỉ Email", "email", "email"]].map(([label, key, type]) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
              <input required type={type} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl px-4 py-2.5 text-sm text-[#0C2E5E] dark:text-[#E2E8F0] dark:text-[#E2E8F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C2E5E]/10 focus:border-[#0C2E5E]/30 transition-all font-medium" />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vai trò người dùng</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl px-4 py-2.5 text-sm text-[#0C2E5E] dark:text-[#E2E8F0] dark:text-[#E2E8F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C2E5E]/10 focus:border-[#0C2E5E]/30 transition-all font-bold cursor-pointer">
              <option value="student">Học sinh (Student)</option>
              <option value="teacher">Giáo viên (Teacher)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-3">
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] text-white rounded-xl font-black text-sm hover:opacity-95 transition-all disabled:opacity-50 shadow-md shadow-[#0C2E5E]/10 border-l-4 border-[#00C6FF] active:scale-95">
              {loading ? "Đang tạo tài khoản..." : "Xác nhận tạo"}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">Huỷ</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
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
    if (u.email === currentUser?.email) {
      showToast("Bạn không thể tự xoá chính mình!");
      return;
    }
    if (!confirm(`Xoá tài khoản "${u.fullName}"?`)) return;
    try { await deleteUser(u.id); setUsers(p => p.filter(x => x.id !== u.id)); showToast("Đã xoá tài khoản"); }
    catch (e: any) { alert(e.message); }
  };

  const handleRoleChange = async (id: string, role: string, userEmail: string) => {
    if (userEmail === currentUser?.email) {
      showToast("Bạn không thể tự thay đổi vai trò chính mình!");
      return;
    }
    try { await updateUserRole(id, role); setUsers(p => p.map(u => u.id === id ? { ...u, role } : u)); showToast("Đã cập nhật vai trò"); }
    catch (e: any) { alert(e.message); }
  };

  const handleLock = async (u: User) => {
    if (u.email === currentUser?.email) {
      showToast("Bạn không thể tự khoá chính mình!");
      return;
    }
    const lock = !u.accountLocked;
    try { await toggleUserLock(u.id, lock); setUsers(p => p.map(x => x.id === u.id ? { ...x, accountLocked: lock } : x)); showToast(lock ? "Đã khoá tài khoản" : "Đã mở khoá"); }
    catch (e: any) { alert(e.message); }
  };

  const roleBadge = (r: string) => ({ 
    admin: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50", 
    teacher: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50", 
    student: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50" 
  } as any)[r] || "bg-slate-100 text-slate-500 border-slate-200";

  const roleLabel = (r: string) => ({ admin: "Admin", teacher: "Giáo viên", student: "Học sinh" } as any)[r] || r;
  const maxW = Math.max(...weekData);

  return (
    <div className="space-y-8 relative bg-transparent min-h-max">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] text-white rounded-2xl font-extrabold text-sm shadow-xl border border-cyan-400/20 flex items-center gap-2 animate-slideUp">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span> {toast}
        </div>
      )}

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onCreated={u => { setUsers(p => [u, ...p]); showToast("Đã tạo tài khoản"); }} />}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0] dark:text-[#E2E8F0] dark:text-[#E2E8F0] tracking-tight">Tổng quan quản trị hệ thống</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Kiểm soát và quản trị toàn bộ tài nguyên nền tảng AuraAcademic</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadStats} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 hover:bg-slate-50 dark:hover:bg-cyan-950/30 dark:text-slate-300 text-slate-600 rounded-xl text-xs font-extrabold hover:border-slate-300 transition-all shadow-sm active:scale-95">
            <span className="material-symbols-outlined text-base">refresh</span>Làm mới
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] text-white rounded-xl text-xs font-black hover:opacity-95 shadow-md shadow-[#0C2E5E]/10 border-l-[3px] border-[#00C6FF] transition-all active:scale-95">
            <span className="material-symbols-outlined text-base">person_add</span>Thêm người dùng
          </button>
        </div>
      </div>

      {/* Pending Verifications Banner */}
      {!loadingStats && stats?.pendingVerifications && stats.pendingVerifications > 0 ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-2xl animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Yêu cầu xác thực giáo viên chưa xử lý</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hiện đang có <strong className="text-amber-700 dark:text-amber-400 font-extrabold">{stats.pendingVerifications}</strong> yêu cầu xác thực tài khoản giáo viên đang chờ xem xét.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin/verifications")}
            className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            Duyệt ngay →
          </button>
        </div>
      ) : null}

      {/* Stat Widgets Grid 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon="group" label="Tổng người dùng" value={loadingStats ? "…" : stats?.totalUsers} color="slate" />
        <StatCard icon="school" label="Giáo viên hệ thống" value={loadingStats ? "…" : stats?.totalTeachers} color="blue" />
        <StatCard icon="person" label="Tổng số Học sinh" value={loadingStats ? "…" : stats?.totalStudents} color="emerald" />
        <StatCard icon="quiz" label="Bài thi đang chạy" value={loadingStats ? "…" : stats?.publishedExams} sub="Hoạt động" color="amber" />
      </div>

      {/* Stat Widgets Grid 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon="task_alt" label="Tổng lượt nộp bài" value={loadingStats ? "…" : stats?.totalResults} color="rose" />
        <StatCard icon="verified_user" label="Email đã xác thực" value={loadingStats ? "…" : stats?.verifiedUsers} color="emerald" />
        <StatCard icon="library_books" label="Tổng kho đề thi" value={loadingStats ? "…" : stats?.totalExams} color="slate" />
        <div onClick={() => router.push("/admin/verifications")} className="cursor-pointer flex-1">
          <StatCard 
            icon="verified" 
            label="Chờ duyệt xác thực" 
            value={loadingStats ? "…" : stats?.pendingVerifications ?? 0} 
            color={stats?.pendingVerifications && stats.pendingVerifications > 0 ? "amber" : "slate"} 
            sub={stats?.pendingVerifications && stats.pendingVerifications > 0 ? "Cần duyệt" : null}
          />
        </div>
      </div>

      {/* Data Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Role Distribution Bar Chart */}
        <div className="bg-white dark:bg-[#0A1F3E]/95 border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-black text-[#0C2E5E] dark:text-[#E2E8F0] dark:text-[#E2E8F0] dark:text-[#E2E8F0] uppercase tracking-wider mb-5">Phân bổ vai trò</h3>
          <div className="space-y-5">
            {[["Học sinh", stats?.totalStudents ?? 0, stats?.totalUsers ?? 1, "emerald"],
              ["Giáo viên", stats?.totalTeachers ?? 0, stats?.totalUsers ?? 1, "blue"],
              ["Quản trị viên", stats?.totalAdmins ?? 0, stats?.totalUsers ?? 1, "slate"]].map(([l, v, max, c]) => {
              const pct = max ? Math.round(((v as number) / (max as number)) * 100) : 0;
              const cols: any = { emerald: "bg-emerald-500", blue: "bg-blue-500", slate: "bg-[#0C2E5E]" };
              return (
                <div key={l as string} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold"><span className="text-slate-500">{l as string}</span><span className="text-[#0C2E5E] dark:text-[#E2E8F0]">{v as number} tài khoản ({pct}%)</span></div>
                  <div className="h-3 bg-slate-100 dark:bg-[#051329] rounded-full overflow-hidden border border-transparent dark:border-cyan-950/30"><div className={`h-full ${cols[c as string]} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Login activity histogram */}
        <div className="bg-white dark:bg-[#0A1F3E]/95 border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl p-6 lg:col-span-2 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-[#0C2E5E] dark:text-[#E2E8F0] dark:text-[#E2E8F0] dark:text-[#E2E8F0] uppercase tracking-wider">Hoạt động hệ thống 7 ngày qua</h3>
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 bg-slate-50 dark:bg-[#051329] border dark:border-cyan-950/40 px-2.5 py-1 rounded-md">Lượt đăng nhập hàng ngày</span>
          </div>
          <div className="flex items-end gap-3 h-36 mt-auto">
            {weekData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] font-extrabold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">{v}</span>
                <div className="w-full rounded-t-xl bg-gradient-to-t from-[#0C2E5E] to-[#00C6FF] hover:shadow-[0_4px_12px_rgba(0,198,255,0.3)] hover:brightness-110 transition-all cursor-pointer" style={{ height: `${(v / maxW) * 100}%` }} />
                <span className="text-[10px] font-black text-[#0C2E5E] dark:text-[#E2E8F0] dark:text-[#E2E8F0] mt-1">{["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","CN"][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Operational Management Card (Tabs + Table) */}
      <div className="bg-white dark:bg-[#0A1F3E]/95 border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-cyan-950/40 bg-slate-50/40 dark:bg-[#051329]/20 px-2">
          {([["users", "group", "Quản lý tập trung người dùng"], ["analytics", "bar_chart", "Phân tích cơ sở"]] as const).map(([tab, icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-black border-b-2 transition-all relative ${
                activeTab === tab 
                  ? "border-[#0C2E5E] text-[#0C2E5E] dark:text-[#E2E8F0]" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}>
              <span className="material-symbols-outlined text-lg">{icon}</span>{label}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF]"></div>}
            </button>
          ))}
        </div>

        {/* User Operations Tab View */}
        {activeTab === "users" && (
          <>
            {/* Filters bar */}
            <div className="flex flex-wrap items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-cyan-950/40">
              <div className="relative flex-1 min-w-[220px] max-w-xs group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-[#0C2E5E] dark:text-[#E2E8F0]">search</span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl pl-10 pr-4 py-2.5 text-sm dark:text-[#E2E8F0] py-2.5 text-sm text-[#0C2E5E] dark:text-[#E2E8F0] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C2E5E]/10 transition-all"
                  placeholder="Tìm theo tên, email..." />
              </div>
              <div className="flex gap-1.5 flex-wrap p-1 bg-slate-50 dark:bg-[#051329] rounded-xl border border-slate-100 dark:border-cyan-950/40">
                {["all", "student", "teacher", "admin"].map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      roleFilter === r 
                        ? "bg-white text-[#0C2E5E] dark:text-[#E2E8F0] shadow-sm border border-slate-200" 
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-cyan-950/40"
                    }`}>
                    {r === "all" ? "Tất cả" : roleLabel(r)}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-xs font-bold text-[#0C2E5E] dark:text-[#E2E8F0] bg-slate-100/50 border border-slate-200/40 px-2.5 py-1 rounded-md">{users.length} tài khoản được tìm thấy</span>
            </div>

            {/* Table content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 dark:bg-[#051329]/50 border-b border-slate-100 dark:border-cyan-950/40">
                    {["Người dùng", "Thông tin Email", "Phân quyền vai trò", "Xác thực Email", "Thời gian đăng ký", "Tác vụ Quản lý"].map(h => (
                      <th key={h} className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-cyan-950/30">
                  {loadingUsers ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-3xl animate-spin text-[#0C2E5E] dark:text-[#E2E8F0]">progress_activity</span>
                        <span className="text-sm font-bold">Đang đồng bộ cơ sở dữ liệu...</span>
                      </div>
                    </td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-bold">Không tìm thấy tài khoản phù hợp với điều kiện lọc.</td></tr>
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
          </>
        )}

        {/* Statistics Subtab View */}
        {activeTab === "analytics" && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-cyan-950/40 pb-2">Báo cáo tổng hợp tài khoản</h4>
              {[
                ["Tổng số tài khoản đăng ký", stats?.totalUsers ?? "—"],
                ["Lượng người dùng đã Active Email", stats?.verifiedUsers ?? "—"],
                ["Tài khoản bị vô hiệu hóa (Lock)", stats?.lockedUsers ?? "—"],
                ["Tổng số ngân hàng đề", stats?.totalExams ?? "—"],
                ["Lượt phản hồi nộp bài", stats?.totalResults ?? "—"],
              ].map(([l, v]) => (
                <div key={l as string} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-cyan-950/20 text-sm">
                  <span className="text-slate-500 font-medium">{l as string}</span>
                  <span className="font-black text-[#0C2E5E] dark:text-[#E2E8F0] dark:text-[#E2E8F0] tabular-nums">{v as any}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-cyan-950/40 pb-2">Báo cáo tỷ trọng cơ cấu</h4>
              {[["Quản trị viên (Admin)", stats?.totalAdmins ?? 0, "slate"], ["Đội ngũ Giáo viên", stats?.totalTeachers ?? 0, "blue"], ["Đối tượng Học sinh", stats?.totalStudents ?? 0, "emerald"]].map(([l, v, c]) => {
                const total = stats?.totalUsers || 1;
                const pct = Math.round(((v as number) / total) * 100);
                const bar: any = { slate: "bg-[#0C2E5E]", blue: "bg-blue-500", emerald: "bg-emerald-500" };
                return (
                  <div key={l as string} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold"><span className="text-slate-500">{l as string}</span><span className="font-black text-[#0C2E5E] dark:text-[#E2E8F0] dark:text-[#E2E8F0]">{v as number} ({pct}%)</span></div>
                    <div className="h-2.5 bg-slate-100 dark:bg-[#051329] rounded-full overflow-hidden border border-transparent dark:border-cyan-950/30"><div className={`h-full ${bar[c as string]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} /></div>
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
