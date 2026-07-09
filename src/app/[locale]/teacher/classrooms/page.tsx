"use client";

import React, { useEffect, useState } from "react";
import { classroomApi } from "@/lib/classroomApi";
import { Copy, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

export default function TeacherClassroomsPage() {
  const t = useTranslations("TeacherClassrooms");
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");

  useEffect(() => {
    fetchClassrooms();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") fetchClassrooms();
    };
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchClassrooms();
    }, 5000);

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", fetchClassrooms);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", fetchClassrooms);
    };
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
      toast.success(t("create_success"));
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
    toast.success(t("copied", { code }));
  };

  return (
    <main className="p-8 space-y-8 max-w-6xl mx-auto w-full pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] p-8 rounded-[2rem] shadow-lg relative overflow-hidden text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-4xl text-white">school</span>
          </div>
          <h2 className="font-headline font-extrabold text-4xl tracking-tight mb-2">
            {t("title")}
          </h2>
          <p className="text-white/80 max-w-lg leading-relaxed text-sm">
            {t("desc")}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button 
            onClick={() => setShowModal(true)}
            className="px-5 py-3 bg-white text-[#0C2E5E] font-black rounded-xl text-xs shadow-xl transition-all hover:scale-105 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("create_btn")}
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="text-center text-slate-400 py-12 flex flex-col items-center justify-center gap-3">
          <span className="w-8 h-8 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold">{t("loading")}</span>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center text-slate-400 py-16 border border-slate-200 dark:border-cyan-950/40 rounded-[2rem] bg-white dark:bg-[#0A1F3E]/60 shadow-sm flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">school</span>
          <h4 className="font-bold text-base text-slate-700 dark:text-slate-300">{t("empty")}</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1">{t("empty_desc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((cls) => (
            <div key={cls.id} className="group relative bg-white dark:bg-[#0A1F3E]/60 border border-slate-200/80 dark:border-cyan-950/40 rounded-[2rem] p-6 transition-all duration-300 hover:border-[#00C6FF]/50 dark:hover:border-[#00C6FF]/40 hover:shadow-[0_12px_30px_-6px_rgba(0,198,255,0.12)] hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:scale-125" />
              
              <Link href={`/teacher/classrooms/detail?id=${cls.id}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] flex items-center justify-center shadow-md shadow-blue-500/10">
                    <span className="material-symbols-outlined text-white text-xl">class</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-none">{cls.name}</h3>
                </div>
                
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 min-h-[40px] leading-relaxed">{cls.description || t("no_desc")}</p>
                
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Users className="w-4 h-4 text-cyan-500" />
                    <span>{t("members", { count: cls.studentIds?.length || 0 })}</span>
                  </div>
                  {cls.pendingStudentIds?.length > 0 && (
                    <div className="px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold animate-pulse">
                      {t("pending", { count: cls.pendingStudentIds.length })}
                    </div>
                  )}
                </div>
              </Link>
              
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-cyan-950/40 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("join_code")}</div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 mb-2">{t("modal_title")}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t("modal_desc")}</p>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{t("name_label")} <span className="text-red-400">*</span></label>
                  <input required value={newClassName} onChange={e => setNewClassName(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/40 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#00C6FF] focus:ring-1 focus:ring-[#00C6FF] transition-all" placeholder={t("name_ph")} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{t("desc_label")}</label>
                  <textarea value={newClassDesc} onChange={e => setNewClassDesc(e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/40 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#00C6FF] focus:ring-1 focus:ring-[#00C6FF] transition-all resize-none" placeholder={t("desc_ph")}></textarea>
                </div>
              </div>
              <div className="mt-8 flex gap-3 justify-end border-t border-slate-100 dark:border-cyan-950/30 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-cyan-950/30 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-cyan-950/60 transition-colors">{t("cancel")}</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-xs font-black shadow-md hover:opacity-95 transition-all">{t("create")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
