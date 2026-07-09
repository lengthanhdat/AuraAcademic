"use client";
import { useSearchParams } from "next/navigation";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { toast } from "sonner";
import { classroomApi } from "@/lib/classroomApi";
import { API_BASE } from "@/lib/api";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  ArrowLeft, BookOpen, MessageSquare,
  Send, Radio, PlayCircle, Trophy, Clock, KeyRound, CheckCircle, Award, Lock, BarChart3
} from "lucide-react";
import Image from "next/image";

type Tab = "timeline" | "members" | "exams" | "gradebook" | "chat";

interface ClassroomMsg {
  id?: string;
  classroomId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  senderRole: string;
  content: string;
  timestamp?: string;
}

// Embedded exam state interface removed

const getInitials = (name?: string) => {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "HS";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

function Avatar({ name, src, className = "w-10 h-10", tone = "cyan" }: { name?: string; src?: string; className?: string; tone?: "cyan" | "amber" }) {
  const ringClass = tone === "amber" ? "ring-2 ring-amber-300 dark:ring-amber-500/60" : "";
  if (src) {
    return (
      <div className={`${className} relative rounded-full overflow-hidden border border-white dark:border-slate-900 shadow-sm shrink-0 ${ringClass}`}>
        <Image src={src} alt={name || "Avatar"} fill unoptimized className="object-cover" />
      </div>
    );
  }

  return (
    <div className={`${className} rounded-full ${tone === "amber" ? "bg-amber-500/20 text-amber-600 dark:text-amber-300" : "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300"} flex items-center justify-center font-black text-xs shrink-0 ${ringClass}`}>
      {getInitials(name)}
    </div>
  );
}

export default function StudentClassroomDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const params = { id: searchParams.get('id') as string, code: searchParams.get('code') as string, folderId: searchParams.get('folderId') as string, locale: useParams().locale as string };
  const router = useRouter();
  const classroomId = id || (typeof window !== 'undefined' ? sessionStorage.getItem('studentClassroomDetailId') : '') || '';

  const [tab, setTab] = useState<Tab>("timeline");
  const [data, setData] = useState<{ classroom: any; exams: any[]; students?: any[]; posts?: any[]; teacherAvatarUrl?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resultsByExamCode, setResultsByExamCode] = useState<Record<string, any>>({});
  const [chatMsgs, setChatMsgs] = useState<ClassroomMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const stompRef = useRef<Client | null>(null);
  const userRef = useRef<any>(null);

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) userRef.current = JSON.parse(u);
    } catch {}
    fetchData();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") fetchData(false);
    };
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchData(false);
    }, 5000);

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
    };
  }, [classroomId]);

  useEffect(() => {
    if (tab === "chat") {
      loadChatHistory();
      connectWs();
    } else {
      disconnectWs();
    }
    return () => disconnectWs();
  }, [tab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const d = await classroomApi.getClassroomDetails(classroomId);
      setData(d);
      await fetchStudentResults();
    } catch (e: any) {
      if (showLoading) toast.error(e.message);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const fetchStudentResults = async () => {
    try {
      const u = localStorage.getItem("user");
      if (!u) return;
      const user = JSON.parse(u);
      const res = await fetch(`${API_BASE}/exams/results/student/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` }
      });
      if (!res.ok) return;
      const results = await res.json();
      const mapped: Record<string, any> = {};
      (Array.isArray(results) ? results : []).forEach((result: any) => {
        if (result.examId) mapped[result.examId] = result;
      });
      setResultsByExamCode(mapped);
    } catch {}
  };

  const loadChatHistory = async () => {
    try {
      const history = await classroomApi.getClassroomMessages(classroomId);
      setChatMsgs(history);
    } catch {}
  };

  const connectWs = useCallback(() => {
    if (stompRef.current?.active) return;
    const token = localStorage.getItem("accessToken") || "";
    const client = new Client({
      webSocketFactory: () => new SockJS((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/ws"),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        setWsConnected(true);
        client.subscribe(`/topic/classroom/${classroomId}`, (frame) => {
          const msg: ClassroomMsg = JSON.parse(frame.body);
          setChatMsgs((prev) => {
            if (prev.some(m => m.id && m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        });
      },
      onDisconnect: () => setWsConnected(false),
      reconnectDelay: 3000,
    });
    client.activate();
    stompRef.current = client;
  }, [classroomId]);

  const disconnectWs = useCallback(() => {
    stompRef.current?.deactivate();
    stompRef.current = null;
    setWsConnected(false);
  }, []);

  const sendMsg = () => {
    if (!chatInput.trim() || !stompRef.current?.active || !userRef.current) return;
    stompRef.current.publish({
      destination: "/app/classroom.send",
      body: JSON.stringify({
        classroomId,
        senderId: userRef.current.id,
        senderName: userRef.current.fullName || userRef.current.email,
        senderRole: "student",
        content: chatInput.trim(),
      }),
    });
    setChatInput("");
  };

  const startExam = (exam: any) => {
    sessionStorage.setItem("exam_redirect_classroomId", classroomId);
    router.push(`/student/lobby/?code=${exam.accessCode}`);
  };

  const getExamStatus = (exam: any, result: any) => {
    if (result) {
      return {
        label: "Đã nộp",
        hint: `Điểm của bạn: ${Number(result.score || 0).toFixed(1)}`,
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
        icon: CheckCircle
      };
    }
    if (exam.status === "STARTED") {
      return {
        label: "Đang thi",
        hint: "Phòng thi đang mở, bạn có thể vào làm bài.",
        cls: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30",
        icon: PlayCircle
      };
    }
    if (exam.status === "FINISHED" || exam.status === "COMPLETED") {
      return {
        label: "Đã đóng",
        hint: "Phòng thi đã kết thúc.",
        cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        icon: Lock
      };
    }
    return {
      label: "Sẵn sàng",
      hint: "Chờ giáo viên bắt đầu phòng thi.",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30",
      icon: Clock
    };
  };

  const getScore = (result: any) => {
    const score = Number(result?.score);
    if (!Number.isFinite(score)) return 0;
    return Math.max(0, Math.min(10, score));
  };

  const formatSubmittedAt = (result: any) => {
    const raw = result?.submittedAt ?? result?.submitted_at ?? result?.submitTime ?? result?.createdAt;
    if (raw === null || raw === undefined || raw === "") return "--";
    const date = typeof raw === "number" || /^\d+$/.test(String(raw)) ? new Date(Number(raw)) : new Date(raw);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString("vi-VN");
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
    </div>
  );
  if (!data) return (
    <div className="flex items-center justify-center min-h-screen text-slate-400">Không tìm thấy lớp học.</div>
  );

  const { classroom, exams, students = [], posts = [] } = data;
  const getChatAvatar = (msg: ClassroomMsg) => {
    if (msg.senderId === userRef.current?.id) return userRef.current?.avatarUrl;
    if (msg.senderRole === "teacher") return data?.teacherAvatarUrl;
    return students.find((student: any) => student.id === msg.senderId)?.avatarUrl || msg.senderAvatarUrl;
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "timeline",  label: "Bảng tin",   icon: <Radio className="w-4 h-4" /> },
    { key: "members",   label: "Thành viên", icon: <BookOpen className="w-4 h-4" /> },
    { key: "exams",     label: "Bài thi",    icon: <Trophy className="w-4 h-4" /> },
    { key: "gradebook", label: "Bảng điểm",  icon: <BarChart3 className="w-4 h-4" /> },
    { key: "chat",      label: "Thảo luận",  icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060f1e] text-slate-800 dark:text-slate-100">

      {/* ── HEADER ── */}
      <div className="relative bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-[#0a1f3e] dark:to-slate-900 border-b border-slate-200 dark:border-slate-800/60 px-8 pt-8 pb-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-32 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>
        <button
          onClick={() => router.push("/student/classrooms")}
          className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-sm mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại
        </button>
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">{classroom?.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm leading-relaxed">{classroom?.description}</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 font-semibold">
            Giáo viên: <span className="text-slate-700 dark:text-slate-300 font-bold">{classroom?.teacherName}</span>
          </p>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all rounded-t-xl whitespace-nowrap ${
                tab === t.key
                  ? "bg-slate-50 dark:bg-[#060f1e] text-cyan-600 dark:text-cyan-400 border-x border-t border-slate-200 dark:border-slate-700/60 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              }`}
            >
              {t.icon}{t.label}
              {(t.badge ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold bg-cyan-500 text-white rounded-full flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="p-8">

        {/* TIMELINE */}
        {tab === "timeline" && (
          <div className="max-w-2xl mx-auto space-y-4">
            {posts.length === 0 ? (
              <div className="text-center text-slate-500 py-16 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white dark:bg-[#0A1F3E]/20">
                <Radio className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>Chưa có thông báo nào từ giáo viên.</p>
              </div>
            ) : (
              posts.map((post: any) => (
                <div key={post.id} className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs font-black">GV</div>
                    <div>
                      <p className="text-slate-800 dark:text-slate-100 text-sm font-bold">{post.authorName || classroom?.teacherName || "Giáo viên"}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs">{post.createdAt ? new Date(post.createdAt).toLocaleString("vi-VN") : ""}</p>
                    </div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* THÀNH VIÊN */}
        {tab === "members" && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-6 shadow-sm">
              <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-4">Giáo viên</h3>
              <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/40 p-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs">GV</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{classroom?.teacherName || "Giáo viên"}</p>
                  <p className="text-xs text-slate-400">Quản lý lớp học</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-6 shadow-sm">
              <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-4">Học sinh ({students.length})</h3>
              {students.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 py-12 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>Chưa có học sinh nào trong lớp.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-cyan-950/40">
                  {students.map((student: any) => (
                    <div key={student.id} className="flex items-center gap-4 py-3">
                      <Avatar name={student.fullName || student.email} src={student.avatarUrl} />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-white truncate">{student.fullName || student.email || "Học sinh"}</p>
                        {student.email && <p className="text-xs text-slate-400 truncate">{student.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BÀI THI */}
        {tab === "exams" && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-800 dark:text-white font-bold text-lg">Bài thi được giao ({exams.length})</h3>
                <p className="text-xs text-slate-400 mt-1">Theo dõi phòng thi, mã bài và kết quả của bạn trong lớp này.</p>
              </div>
            </div>
            {exams.length === 0 ? (
              <div className="text-center text-slate-400 dark:text-slate-500 py-14 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white dark:bg-[#0A1F3E]/20">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>Giáo viên chưa giao bài thi nào.</p>
              </div>
            ) : (
              exams.map((exam: any) => {
                const result = resultsByExamCode[exam.accessCode];
                const status = getExamStatus(exam, result);
                const StatusIcon = status.icon;
                const questionCount = exam.questionCount || exam.versions?.[0]?.questions?.length || exam.questions?.length || 0;
                const canEnter = !result && exam.status !== "FINISHED" && exam.status !== "COMPLETED";
                return (
                  <div key={exam.id} className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-[1.75rem] p-6 md:p-7 shadow-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-cyan-800/70 transition-all">
                    <div className="flex items-start justify-between gap-5">
                      <span className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-wider ${status.cls}`}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700 tracking-[0.18em] dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-300">
                        <KeyRound className="w-4 h-4 tracking-normal" />
                        {exam.accessCode || "------"}
                      </span>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{exam.title}</h4>
                      {exam.description && (
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{exam.description}</p>
                      )}
                      <div className="mt-4 flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                          <BookOpen className="w-4 h-4" />
                          Lớp: {classroom?.name}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span>{questionCount} câu hỏi / {exam.duration || 0} phút</span>
                        {result && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300">
                              <Award className="w-4 h-4" />
                              {Number(result.score || 0).toFixed(1)} điểm
                            </span>
                          </>
                        )}
                      </div>
                      <p className="mt-5 text-sm font-bold text-slate-400 dark:text-slate-500">{status.hint}</p>
                    </div>

                    <div className="mt-7 border-t border-slate-100 dark:border-cyan-950/50 pt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {result?.submittedAt ? `Nộp lúc ${new Date(result.submittedAt).toLocaleString("vi-VN")}` : "Theo dõi trạng thái phòng thi tại đây"}
                      </div>
                      <div className="flex items-center gap-3">
                        {result ? (
                          <button
                            onClick={() => router.push("/student/results")}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 active:scale-[0.98] transition-all"
                          >
                            <Award className="w-5 h-5" />
                            Xem kết quả
                          </button>
                        ) : (
                          <button
                            onClick={() => startExam(exam)}
                            disabled={!canEnter}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none active:scale-[0.98] transition-all"
                          >
                            <PlayCircle className="w-5 h-5" />
                            {exam.status === "STARTED" ? "Vào làm bài" : "Vào phòng chờ"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* BẢNG ĐIỂM */}
        {tab === "gradebook" && (
          <div className="max-w-4xl mx-auto space-y-5">
            {(() => {
              const gradedExams = exams
                .map((exam: any) => ({ exam, result: resultsByExamCode[exam.accessCode] }))
                .filter((item: any) => item.result);
              const scores = gradedExams.map((item: any) => getScore(item.result));
              const averageScore = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
              const bestScore = scores.length ? Math.max(...scores) : 0;
              const passCount = scores.filter((score) => score >= 5).length;
              const passRate = scores.length ? Math.round((passCount / scores.length) * 100) : 0;

              return (
                <>
                  <div>
                    <h3 className="text-slate-800 dark:text-white font-bold text-lg">Bảng điểm của tôi</h3>
                    <p className="text-xs text-slate-400 mt-1">Tổng hợp điểm các bài thi bạn đã nộp trong lớp này.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-2xl bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 p-4 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Đã nộp</p>
                      <p className="mt-1 text-2xl font-black text-slate-800 dark:text-white">{gradedExams.length}</p>
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 p-4 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Trung bình</p>
                      <p className="mt-1 text-2xl font-black text-cyan-600 dark:text-cyan-300">{averageScore.toFixed(1)}</p>
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 p-4 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cao nhất</p>
                      <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-300">{bestScore.toFixed(1)}</p>
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 p-4 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tỷ lệ đạt</p>
                      <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-300">{passRate}%</p>
                    </div>
                  </div>

                  {gradedExams.length === 0 ? (
                    <div className="text-center text-slate-400 dark:text-slate-500 py-14 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white dark:bg-[#0A1F3E]/20">
                      <Award className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p>Bạn chưa có điểm bài thi nào trong lớp này.</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-2xl overflow-hidden shadow-sm">
                      <div className="grid grid-cols-[1fr_90px_110px_150px] gap-3 px-4 py-3 bg-slate-50 dark:bg-cyan-950/20 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <span>Bài thi</span>
                        <span>Điểm</span>
                        <span>Số câu đúng</span>
                        <span>Nộp lúc</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-cyan-950/30">
                        {gradedExams
                          .slice()
                          .sort((a: any, b: any) => Number(b.result.submittedAt || 0) - Number(a.result.submittedAt || 0))
                          .map(({ exam, result }: any) => (
                            <div key={result.id || exam.id} className="grid grid-cols-[1fr_90px_110px_150px] gap-3 px-4 py-3 text-sm items-center">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-700 dark:text-slate-200 truncate">{exam.title || result.examTitle}</p>
                                <p className="text-xs text-slate-400">Mã bài: {exam.accessCode}</p>
                              </div>
                              <span className={`font-black ${getScore(result) >= 8 ? "text-emerald-600 dark:text-emerald-300" : getScore(result) >= 5 ? "text-cyan-600 dark:text-cyan-300" : "text-rose-600 dark:text-rose-300"}`}>
                                {getScore(result).toFixed(1)}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 font-semibold">{result.correctAnswers ?? 0}/{result.totalQuestions ?? "-"}</span>
                              <span className="text-xs text-slate-400">{formatSubmittedAt(result)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* THẢO LUẬN */}
        {tab === "chat" && (
          <div className="max-w-3xl mx-auto">
            <div
              className="bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden flex flex-col shadow-sm"
              style={{ height: "calc(100vh - 290px)", minHeight: "400px" }}
            >
              <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40 shrink-0">
                <div className={`w-2 h-2 rounded-full transition-colors ${wsConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                <span className="text-xs text-slate-500 dark:text-slate-400">{wsConnected ? "Realtime đang kết nối" : "Đang kết nối..."}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/30 dark:bg-transparent">
                {chatMsgs.length === 0 && (
                  <div className="text-center text-slate-400 dark:text-slate-500 py-10 text-sm">Chưa có tin nhắn nào. Bắt đầu thảo luận với lớp!</div>
                )}
                {chatMsgs.map((msg, i) => {
                  const isMe = msg.senderId === userRef.current?.id;
                  const isTeacher = msg.senderRole === "teacher";
                  return (
                    <div key={msg.id || i} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && <Avatar name={msg.senderName} src={getChatAvatar(msg)} className="w-8 h-8" tone={isTeacher ? "amber" : "cyan"} />}
                      <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2.5 ${
                        isMe
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-sm"
                          : isTeacher
                          ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-white rounded-bl-sm"
                          : "bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                      }`}>
                        {!isMe && (
                          <div className="mb-1 flex items-center gap-2">
                            <p className={`text-xs font-bold ${isTeacher ? "text-amber-600 dark:text-amber-400" : "text-cyan-600 dark:text-cyan-300"}`}>
                              {msg.senderName}
                            </p>
                            {isTeacher && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                Giáo viên
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                      {isMe && <Avatar name={msg.senderName} src={getChatAvatar(msg)} className="w-8 h-8" />}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40 flex gap-3 shrink-0">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder="Đặt câu hỏi hoặc thảo luận..."
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder-slate-400"
                />
                <button
                  onClick={sendMsg}
                  disabled={!chatInput.trim() || !wsConnected}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white disabled:opacity-40 hover:from-cyan-400 hover:to-blue-500 transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}