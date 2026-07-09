"use client";

import React, { useEffect, useState } from "react";
import { classroomApi } from "@/lib/classroomApi";
import { BookOpen, LogIn, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function StudentClassroomsPage() {
  const locale = useLocale();
  const t = useTranslations("StudentClassrooms");
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

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
      const data = await classroomApi.getStudentClassrooms();
      setClassrooms(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    try {
      const result = await classroomApi.joinClassroom(code.trim().toUpperCase());
      toast.success(result.message || t("join_success"));
      setShowModal(false);
      setCode("");
      fetchClassrooms();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setJoining(false);
    }
  };

  const ACCENT_COLORS = [
    "from-cyan-500 to-blue-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-pink-500 to-rose-600",
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            {t("title")}
          </h1>
          <p className="text-slate-400 mt-2">{t("desc")}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(0,198,255,0.3)] hover:shadow-[0_0_25px_rgba(0,198,255,0.5)]"
        >
          <LogIn className="w-5 h-5" />
          {t("join_btn")}
        </button>
      </div>

      {/* Grid lớp học */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-cyan-950/40 animate-pulse" />
          ))}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-slate-200 dark:border-cyan-950/60 rounded-3xl bg-white dark:bg-[#0A1F3E]/20 backdrop-blur-sm">
          <BookOpen className="w-14 h-14 text-slate-400 dark:text-slate-600 mx-auto mb-4 animate-bounce" />
          <p className="text-slate-700 dark:text-slate-300 font-bold text-lg">{t("empty")}</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{t("empty_desc")}</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(0,198,255,0.25)]"
          >
            {t("join_now")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((cls, idx) => {
            const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];
            return (
              <Link
                key={cls.id}
                href={`/${locale}/student/classrooms/detail?id=${cls.id}`}
                className="group relative bg-white dark:bg-[#0A1F3E]/60 border border-slate-200/80 dark:border-cyan-950/40 rounded-2xl p-6 transition-all duration-300 hover:border-cyan-500/50 dark:hover:border-cyan-500/40 hover:shadow-[0_12px_30px_-6px_rgba(0,198,255,0.12)] hover:-translate-y-1 overflow-hidden"
              >
                {/* Glow accent */}
                <div className={`absolute top-0 right-0 w-36 h-36 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-3xl -mr-12 -mt-12 transition-all duration-500 group-hover:scale-125`} />

                {/* Header card */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${accent} mb-4 shadow-md`}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mb-1.5 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                  {cls.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed min-h-[40px]">{cls.description || t("no_desc")}</p>

                <div className="flex items-center gap-4 text-sm font-semibold border-t border-slate-100 dark:border-cyan-950/40 pt-4">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Users className="w-4 h-4 text-cyan-500" />
                    <span>{t("students", { count: cls.studentIds?.length || 0 })}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {t("joined")}
                  </div>
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {t("teacher")}: <span className="text-slate-600 dark:text-slate-300 font-bold">{cls.teacherName || t("teacher_empty")}</span>
                </p>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal tham gia lớp */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-7 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(0,198,255,0.4)]">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t("modal_title")}</h2>
              <p className="text-slate-400 text-sm mt-2">{t("modal_desc")}</p>
            </div>

            <form onSubmit={handleJoin}>
              <input
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder={t("placeholder")}
                className="w-full text-center text-3xl font-mono font-bold tracking-widest bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-4 text-cyan-400 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
              />
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); setCode(""); }} className="flex-1 px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors font-medium border border-slate-700">
                  {t("cancel")}
                </button>
                <button type="submit" disabled={code.length < 6 || joining} className="flex-1 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 shadow-[0_0_12px_rgba(0,198,255,0.3)]">
                  {joining ? t("submitting") : t("submit")}
                </button>
              </div>
            </form>

            <div className="mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-amber-300 text-xs">{t("note")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
