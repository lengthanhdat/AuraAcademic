"use client";

import React, { useEffect, useState } from "react";
import { classroomApi } from "@/lib/classroomApi";
import { Copy, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

export default function TeacherClassroomsPage() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const data = await classroomApi.getTeacherClassrooms();
      setClassrooms(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await classroomApi.createClassroom(newClassName, newClassDesc);
      toast.success("Tạo lớp học thành công!");
      setShowModal(false);
      setNewClassName("");
      setNewClassDesc("");
      fetchClassrooms();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Đã copy mã lớp: " + code);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Quản lý Lớp học
          </h1>
          <p className="text-slate-400 mt-2">Theo dõi và quản lý học sinh theo từng không gian riêng biệt.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(0,198,255,0.3)] hover:shadow-[0_0_25px_rgba(0,198,255,0.5)]"
        >
          <Plus className="w-5 h-5" />
          Tạo lớp mới
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400 py-12">Đang tải...</div>
      ) : classrooms.length === 0 ? (
        <div className="text-center text-slate-400 py-12 border border-slate-700/50 rounded-2xl bg-slate-800/20 backdrop-blur-sm">
          Chưa có lớp học nào. Hãy tạo một lớp học đầu tiên!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((cls) => (
            <div key={cls.id} className="group relative bg-white dark:bg-[#0A1F3E]/60 border border-slate-200/80 dark:border-cyan-950/40 rounded-2xl p-6 transition-all duration-300 hover:border-cyan-500/50 dark:hover:border-cyan-500/40 hover:shadow-[0_12px_30px_-6px_rgba(0,198,255,0.12)] hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:scale-125" />
              
              <Link href={`/teacher/classrooms/${cls.id}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] flex items-center justify-center shadow-md shadow-blue-500/10">
                    <span className="material-symbols-outlined text-white text-xl">class</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-none">{cls.name}</h3>
                </div>
                
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 min-h-[40px] leading-relaxed">{cls.description || "Chưa có mô tả ngắn nào cho lớp học này."}</p>
                
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Users className="w-4 h-4 text-cyan-500" />
                    <span>{cls.studentIds?.length || 0} học sinh</span>
                  </div>
                  {cls.pendingStudentIds?.length > 0 && (
                    <div className="px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold animate-pulse">
                      {cls.pendingStudentIds.length} chờ duyệt
                    </div>
                  )}
                </div>
              </Link>
              
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-cyan-950/40 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mã tham gia</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#00C6FF] font-black tracking-widest text-sm bg-cyan-50 dark:bg-cyan-950/30 px-2.5 py-1 rounded-lg border border-cyan-100/50 dark:border-cyan-900/30">{cls.code}</span>
                  <button onClick={() => copyCode(cls.code)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal tạo lớp */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Tạo lớp học mới</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tên lớp học <span className="text-red-400">*</span></label>
                  <input required value={newClassName} onChange={e => setNewClassName(e.target.value)} type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" placeholder="Ví dụ: Lớp Toán 12A1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Mô tả ngắn</label>
                  <textarea value={newClassDesc} onChange={e => setNewClassDesc(e.target.value)} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none" placeholder="Mô tả mục đích lớp học..."></textarea>
                </div>
              </div>
              <div className="mt-8 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors font-medium">Hủy</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_10px_rgba(0,198,255,0.3)]">Tạo ngay</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
