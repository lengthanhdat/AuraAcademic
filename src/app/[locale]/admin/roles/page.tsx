"use client";
import { useEffect, useState } from "react";
import { fetchAdminStats } from "@/lib/adminApi";

const PERMISSIONS = [
  { id: "manage_users", name: "Quản lý người dùng", desc: "Thêm, sửa, xoá và phân quyền tài khoản" },
  { id: "manage_exams", name: "Quản lý bài thi", desc: "Tạo, chỉnh sửa, phát hành bài thi" },
  { id: "view_results", name: "Xem kết quả thi", desc: "Truy cập điểm số và bài làm của học sinh" },
  { id: "system_config", name: "Cấu hình hệ thống", desc: "Thay đổi cài đặt bảo mật, email, bảo trì" },
  { id: "view_audit", name: "Xem Audit Logs", desc: "Truy cập nhật ký hoạt động hệ thống" },
  { id: "take_exams", name: "Làm bài thi", desc: "Được phép tham gia các bài thi đang mở" },
];

const DEFAULT_ROLES = [
  { id: "admin", name: "Quản trị viên", color: "violet", perms: ["manage_users", "manage_exams", "view_results", "system_config", "view_audit"] },
  { id: "teacher", name: "Giáo viên", color: "blue", perms: ["manage_exams", "view_results"] },
  { id: "student", name: "Học sinh", color: "emerald", perms: ["take_exams"] },
];

export default function RolesPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [rolesConfig, setRolesConfig] = useState(DEFAULT_ROLES);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    fetchAdminStats().then(setStats).catch(() => {});
    const saved = localStorage.getItem("roles_config");
    if (saved) {
      try { setRolesConfig(JSON.parse(saved)); } catch {}
    }
  }, []);

  const counts: Record<string, number> = {
    admin: stats.totalAdmins || 0,
    teacher: stats.totalTeachers || 0,
    student: stats.totalStudents || 0,
  };

  const togglePerm = (roleId: string, permId: string) => {
    if (editingRole !== roleId) return;
    setRolesConfig(prev => prev.map(r => {
      if (r.id !== roleId) return r;
      const has = r.perms.includes(permId);
      return { ...r, perms: has ? r.perms.filter(p => p !== permId) : [...r.perms, permId] };
    }));
  };

  const saveConfig = () => {
    localStorage.setItem("roles_config", JSON.stringify(rolesConfig));
    setEditingRole(null);
    showToast("Đã lưu cấu hình phân quyền");
  };

  return (
    <div className="p-6 space-y-6 bg-[#0f172a] min-h-screen relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-xl animate-bounce">
          ✓ {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black text-white">Phân quyền (RBAC)</h1>
        <p className="text-slate-500 text-sm mt-1">Tuỳ chỉnh vai trò và ma trận quyền hạn hệ thống. Các thay đổi được lưu cục bộ.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rolesConfig.map(r => {
          const c: any = { violet: "bg-violet-500", blue: "bg-blue-500", emerald: "bg-emerald-500" };
          const isEditing = editingRole === r.id;
          
          return (
            <div key={r.id} className={`bg-[#1e293b] border rounded-2xl overflow-hidden flex flex-col transition-all ${isEditing ? "border-violet-500 shadow-lg shadow-violet-500/10" : "border-slate-700/50"}`}>
              <div className="p-6 border-b border-slate-700/50 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${c[r.color]}`} />
                <h3 className="text-lg font-bold text-white mb-1">{r.name}</h3>
                <p className="text-xs text-slate-500">{counts[r.id]} người dùng</p>
              </div>
              <div className="p-6 flex-1 space-y-4">
                {PERMISSIONS.map(p => {
                  const hasPerm = r.perms.includes(p.id);
                  return (
                    <div key={p.id} onClick={() => togglePerm(r.id, p.id)} className={`flex gap-3 ${isEditing ? "cursor-pointer group" : ""}`}>
                      <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all ${hasPerm ? "bg-violet-600 border-violet-600 text-white" : isEditing ? "border-slate-500 group-hover:border-violet-400" : "border-slate-600"}`}>
                        {hasPerm && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold transition-colors ${hasPerm ? "text-slate-300" : "text-slate-500"} ${isEditing && !hasPerm ? "group-hover:text-slate-400" : ""}`}>{p.name}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex gap-2">
                {isEditing ? (
                  <>
                    <button onClick={saveConfig} className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-violet-500/20">Lưu</button>
                    <button onClick={() => { setEditingRole(null); setRolesConfig(DEFAULT_ROLES); }} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-all">Huỷ</button>
                  </>
                ) : (
                  <button onClick={() => setEditingRole(r.id)} className="w-full py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-all">
                    Chỉnh sửa quyền
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
