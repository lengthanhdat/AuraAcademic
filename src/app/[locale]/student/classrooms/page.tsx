"use client";

import React, { useEffect, useState } from "react";
import { classroomApi } from "@/lib/classroomApi";
import { BookOpen, LogIn, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function StudentClassroomsPage() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => { fetchClassrooms(); }, []);

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
      toast.success(result.message || "Đã gửi yêu cầu, vui lòng chờ giáo viên phê duyệt!");
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
            Lớp học của tôi
          </h1>
          <p className="text-slate-400 mt-2">Các lớp học bạn đã tham gia và đang theo học.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(0,198,255,0.3)] hover:shadow-[0_0_25px_rgba(0,198,255,0.5)]"
        >
          <LogIn className="w-5 h-5" />
          Tham gia lớp học
        </button>
      </div>

      {/* Grid lớp học */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
          ))}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20 backdrop-blur-sm">
          <BookOpen className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Bạn chưa tham gia lớp học nào.</p>
          <p className="text-slate-500 text-sm mt-1">Nhập mã lớp từ giáo viên để bắt đầu!</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            Tham gia lớp học ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((cls, idx) => {
            const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];
            return (
              <Link
                key={cls.id}
                href={`/vi/student/classrooms/${cls.id}`}
                className="group relative bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 transition-all hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,198,255,0.12)] overflow-hidden"
              >
                {/* Glow accent */}
                <div className={`absolute top-0 right-0 w-36 h-36 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-3xl -mr-12 -mt-12 transition-all group-hover:opacity-20`} />

                {/* Header card */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${accent} mb-4 shadow-lg`}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors line-clamp-1">
                  {cls.name}
                </h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{cls.description || "Không có mô tả"}</p>

                <div className="flex items-center gap-4 text-sm border-t border-slate-700/50 pt-4">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>{cls.studentIds?.length || 0} học sinh</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Đã tham gia
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Giáo viên: <span className="text-slate-300">{cls.teacherName}</span>
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
              <h2 className="text-2xl font-bold text-white">Tham gia lớp học</h2>
              <p className="text-slate-400 text-sm mt-2">Nhập mã lớp 6 ký tự do giáo viên cung cấp</p>
            </div>

            <form onSubmit={handleJoin}>
              <input
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="VD: MTH101"
                className="w-full text-center text-3xl font-mono font-bold tracking-widest bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-4 text-cyan-400 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
              />
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); setCode(""); }} className="flex-1 px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors font-medium border border-slate-700">
                  Hủy
                </button>
                <button type="submit" disabled={code.length < 6 || joining} className="flex-1 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 shadow-[0_0_12px_rgba(0,198,255,0.3)]">
                  {joining ? "Đang gửi..." : "Tham gia"}
                </button>
              </div>
            </form>

            <div className="mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-amber-300 text-xs">Yêu cầu sẽ được gửi tới giáo viên để phê duyệt.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
