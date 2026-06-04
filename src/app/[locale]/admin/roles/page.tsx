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
  { id: "admin", name: "Quản trị viên", color: "indigo", perms: ["manage_users", "manage_exams", "view_results", "system_config", "view_audit"] },
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
    <div className="p-6 space-y-6 bg-transparent min-h-screen relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-[#0C2E5E] text-white rounded-2xl font-black text-sm shadow-xl border border-cyan-400/20 flex items-center gap-2 animate-slideUp">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span> {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0] tracking-tight">Phân quyền (RBAC)</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Tuỳ chỉnh vai trò và ma trận quyền hạn hệ thống. Các thay đổi được lưu cục bộ.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rolesConfig.map(r => {
          const c: any = { indigo: "bg-indigo-500", blue: "bg-blue-500", emerald: "bg-emerald-500" };
          const isEditing = editingRole === r.id;
          
          return (
            <div key={r.id} className={`bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl overflow-hidden flex flex-col transition-all ${isEditing ? "border-indigo-500 shadow-lg shadow-indigo-500/10" : "border-slate-200/50"}`}>
              <div className="p-6 border-b border-slate-200/50 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${c[r.color]}`} />
                <h3 className="text-lg font-bold text-[#0C2E5E] dark:text-[#E2E8F0] mb-1">{r.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{counts[r.id]} người dùng</p>
              </div>
              <div className="p-6 flex-1 space-y-4">
                {PERMISSIONS.map(p => {
                  const hasPerm = r.perms.includes(p.id);
                  return (
                     <div key={p.id} onClick={() => togglePerm(r.id, p.id)} className={`flex gap-3 ${isEditing ? "cursor-pointer group" : ""}`}>
                      <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all ${hasPerm ? "bg-indigo-600 border-indigo-600 text-white" : isEditing ? "border-slate-400 dark:border-cyan-900 group-hover:border-indigo-400" : "border-slate-300 dark:border-cyan-950"}`}>
                        {hasPerm && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold transition-colors ${hasPerm ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"} ${isEditing && !hasPerm ? "group-hover:text-slate-600 dark:group-hover:text-slate-300" : ""}`}>{p.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-slate-200/50 dark:border-cyan-950/30 bg-slate-50 dark:bg-[#051329]/50 flex gap-2">
                {isEditing ? (
                  <>
                    <button onClick={saveConfig} className="flex-1 py-2 bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] text-white rounded-xl font-bold text-xs hover:opacity-95 shadow-md shadow-[#0C2E5E]/10 border-l-[3px] border-[#00C6FF] transition-all">Lưu</button>
                    <button onClick={() => { setEditingRole(null); setRolesConfig(DEFAULT_ROLES); }} className="px-4 py-2 bg-white dark:bg-[#0A1F3E]/40 border border-slate-200 dark:border-cyan-950/50 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all active:scale-95">Huỷ</button>
                  </>
                ) : (
                  <button onClick={() => setEditingRole(r.id)} className="w-full py-2 bg-white dark:bg-[#0C2E5E]/40 border border-slate-200 dark:border-cyan-950/50 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all active:scale-95">
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
