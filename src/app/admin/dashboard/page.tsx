"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8088/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error("Loi lay stats", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8088/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error("Loi lay users", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Ban co chac chan muon xoa tai khoan "${name}"?`)) return;
    try {
      const res = await fetch(`http://localhost:8088/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      }
    } catch (e) {
      alert("Loi xoa nguoi dung");
    }
  };

  const updateRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`http://localhost:8088/api/admin/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role: updated.role } : u));
      }
    } catch (e) {
      alert("Loi cap nhat role");
    }
  };

  const filteredUsers = roleFilter === "all" ? users : users.filter(u => u.role === roleFilter);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-700 border-purple-200";
      case "teacher": return "bg-blue-100 text-blue-700 border-blue-200";
      case "student": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Quan tri vien";
      case "teacher": return "Giao vien";
      case "student": return "Hoc sinh";
      default: return role;
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Tong quan he thong</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Quan ly nguoi dung va ky thi tren nen tang.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-xs font-bold uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          He thong on dinh
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Tong nguoi dung", value: stats?.totalUsers, icon: "group", color: "blue" },
          { label: "Giao vien", value: stats?.totalTeachers, icon: "school", color: "indigo" },
          { label: "Hoc sinh", value: stats?.totalStudents, icon: "person", color: "green" },
          { label: "Tong bai thi", value: stats?.totalExams, icon: "quiz", color: "orange" },
          { label: "Dang dien ra", value: stats?.publishedExams, icon: "play_circle", color: "red" },
          { label: "Luot nop bai", value: stats?.totalResults, icon: "task_alt", color: "purple" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-2">
            <span className="material-symbols-outlined text-slate-400 text-2xl">{s.icon}</span>
            <p className="text-2xl font-black text-slate-800">{loadingStats ? "..." : (s.value ?? 0)}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Quan ly nguoi dung</h3>
            <p className="text-xs text-slate-400 mt-0.5">{users.length} tai khoan trong he thong</p>
          </div>
          <div className="flex gap-2">
            {["all", "teacher", "student", "admin"].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${roleFilter === r ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {r === "all" ? "Tat ca" : getRoleLabel(r)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ten</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ma hoc sinh</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Vai tro</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Hanh dong</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingUsers ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Dang tai...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Khong co nguoi dung nao.</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                        {user.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{user.studentId || "—"}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value)}
                      className={`px-2 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider cursor-pointer ${getRoleBadge(user.role)}`}
                    >
                      <option value="student">Hoc sinh</option>
                      <option value="teacher">Giao vien</option>
                      <option value="admin">Quan tri vien</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteUser(user.id, user.fullName)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Xoa tai khoan"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
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
