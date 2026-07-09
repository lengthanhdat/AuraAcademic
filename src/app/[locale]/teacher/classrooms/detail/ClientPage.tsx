"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { toast } from "sonner";
import { classroomApi } from "@/lib/classroomApi";
import ExamConfigDrawer from "@/components/ExamConfigDrawer";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  ArrowLeft, Users, BookOpen, MessageSquare, BarChart3,
  Radio, CheckCircle, XCircle, Mail, Send, FileText,
  Clock, Award, Copy, RefreshCw, Trophy, Plus, Trash2, Shield, Shuffle,
  Link, DoorOpen, KeyRound
} from "lucide-react";
import Image from "next/image";

type Tab = "stream" | "members" | "chat" | "gradebook" | "exams";

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

const getInitials = (name?: string) => {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

function Avatar({ name, src, className = "w-9 h-9", tone = "cyan" }: { name?: string; src?: string; className?: string; tone?: "cyan" | "amber" | "slate" }) {
  const ringClass = tone === "amber" ? "ring-2 ring-amber-300 dark:ring-amber-500/60" : "";
  const toneClass = tone === "amber"
    ? "bg-amber-500/20 text-amber-600 dark:text-amber-300"
    : tone === "slate"
      ? "bg-slate-200/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-300"
      : "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-600 dark:text-cyan-400";

  if (src) {
    return (
      <div className={`${className} relative rounded-full overflow-hidden border border-white dark:border-[#0A1F3E] shadow-sm shrink-0 ${ringClass}`}>
        <Image src={src} alt={name || "Avatar"} fill unoptimized className="object-cover" />
      </div>
    );
  }

  return (
    <div className={`${className} rounded-full ${toneClass} flex items-center justify-center text-xs font-black shrink-0 ${ringClass}`}>
      {getInitials(name)}
    </div>
  );
}

export default function TeacherClassroomDetailPage() {
  const searchParams = useSearchParams();
  const params = { id: searchParams.get('id') as string, code: searchParams.get('code') as string, folderId: searchParams.get('folderId') as string, locale: useParams().locale as string };
  const router = useRouter();
  const classroomId = params.id || (typeof window !== 'undefined' ? sessionStorage.getItem('classroomDetailId') : '') || '';

  const [tab, setTab] = useState<Tab>("stream");
  const [data, setData] = useState<{ classroom: any; exams: any[]; students?: any[]; pendingStudents?: any[]; removedStudents?: any[]; posts?: any[]; teacherAvatarUrl?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ClassroomMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [examStats, setExamStats] = useState<Record<string, any[]>>({});
  const [gradebookSort, setGradebookSort] = useState<"name_asc" | "name_desc" | "score_asc" | "score_desc" | "correct_asc" | "correct_desc" | "submitted_asc" | "submitted_desc" | "time_asc" | "time_desc">("score_desc");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const stompRef = useRef<Client | null>(null);
  const userRef = useRef<any>(null);

  useEffect(() => {
    if (tab === "gradebook" && data?.exams) {
      data.exams.forEach(async (exam: any) => {
        if (!exam.accessCode) return;
        try {
          const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/exams/${exam.accessCode}/results`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
          });
          if (r.ok) {
            const results = await r.json();
            setExamStats(prev => ({ ...prev, [exam.id]: Array.isArray(results) ? results : [] }));
          }
        } catch(e) {}
      });
    }
  }, [tab, data?.exams]);

  // Auto-activate tab from URL query param (e.g. ?tab=exams after returning from exam builder)
  useEffect(() => {
    const urlTab = searchParams.get("tab") as Tab | null;
    if (urlTab) setTab(urlTab);
  }, [searchParams]);

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
    } catch (e: any) {
      if (showLoading) toast.error(e.message);
    } finally {
      if (showLoading) setIsLoading(false);
    }
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
            // Tránh duplicate khi đã có trong history
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
        senderRole: "teacher",
        content: chatInput.trim(),
      }),
    });
    setChatInput("");
  };

  const handleApprove = async (studentId: string) => {
    try {
      const r = await classroomApi.approveStudent(classroomId, studentId);
      toast.success(r.message);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleReject = async (studentId: string) => {
    try {
      const r = await classroomApi.rejectStudent(classroomId, studentId);
      toast.success(r.message);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const r = await classroomApi.inviteStudent(classroomId, inviteEmail);
      toast.success(r.message);
      setInviteEmail("");
      fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setInviting(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã copy mã lớp: ${code}`);
  };

  const handleStartExam = async (examId: string) => {
    const exam = exams.find((e: any) => e.id === examId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/exams/${examId}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      if (!res.ok) throw new Error("Không thể bắt đầu thi.");
      toast.success("Kỳ thi đã bắt đầu thành công!");
      
      // Chuyển hướng thẳng tới trang giám sát realtime của giáo viên
      if (exam && exam.accessCode) {
        const returnTo = encodeURIComponent(`/teacher/classrooms/detail/?id=${classroomId}?tab=exams`);
        router.push(`/teacher/exams/results/detail/?code=${exam.accessCode}?returnTo=${returnTo}`);
      } else {
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCloseExam = async (examId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/exams/${examId}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      if (!res.ok) throw new Error("Không thể đóng phòng thi.");
      toast.success("Đóng phòng thi thành công!");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài thi này khỏi lớp học? Hành động này không thể hoàn tác.")) return;
    try {
      const res = await classroomApi.deleteClassroomExam(classroomId, examId);
      toast.success(res.message || "Xóa bài thi thành công!");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Không thể xóa bài thi.");
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
    </div>
  );
  if (!data) return (
    <div className="flex items-center justify-center min-h-screen text-slate-400">Không tìm thấy lớp học.</div>
  );

  const { classroom, exams, students = [], pendingStudents = [], removedStudents = [], posts = [] } = data;
  const memberLogs = classroom?.memberLogs || [];
  const getChatAvatar = (msg: ClassroomMsg) => {
    if (msg.senderId === userRef.current?.id) return userRef.current?.avatarUrl;
    if (msg.senderRole === "teacher") return data?.teacherAvatarUrl;
    return students.find((student: any) => student.id === msg.senderId)?.avatarUrl || msg.senderAvatarUrl;
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "stream",    label: "Bảng tin",   icon: <Radio className="w-4 h-4" /> },
    { key: "members",   label: "Thành viên", icon: <Users className="w-4 h-4" />, badge: pendingStudents.length || undefined },
    { key: "exams",     label: "Bài thi",    icon: <Trophy className="w-4 h-4" /> },
    { key: "chat",      label: "Thảo luận",  icon: <MessageSquare className="w-4 h-4" /> },
    { key: "gradebook", label: "Bảng điểm",  icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const getScore = (result: any) => {
    const score = Number(result?.score);
    if (!Number.isFinite(score)) return 0;
    return Math.max(0, Math.min(10, score));
  };

  const buildScoreDistribution = (results: any[]) => {
    const dist = new Array(11).fill(0);
    results.forEach((result) => {
      dist[Math.round(getScore(result))]++;
    });
    return dist;
  };

  const formatSubmittedAt = (result: any) => {
    const raw = result?.submittedAt ?? result?.submitted_at ?? result?.submitTime ?? result?.createdAt;
    if (raw === null || raw === undefined || raw === "") return "";

    const date = typeof raw === "number" || /^\d+$/.test(String(raw))
      ? new Date(Number(raw))
      : new Date(raw);

    if (Number.isNaN(date.getTime())) return "";

    const pad = (value: number) => String(value).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const formatDuration = (seconds?: number | null) => {
    if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) return "--";
    const total = Math.max(0, Math.floor(Number(seconds)));
    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;
    return `${minutes}p ${String(remainingSeconds).padStart(2, "0")}s`;
  };

  const sortGradebookResults = (results: any[]) => {
    return results.slice().sort((a: any, b: any) => {
      if (gradebookSort === "name_asc") return String(a.studentName || "").localeCompare(String(b.studentName || ""), "vi");
      if (gradebookSort === "name_desc") return String(b.studentName || "").localeCompare(String(a.studentName || ""), "vi");
      if (gradebookSort === "score_desc") return getScore(b) - getScore(a);
      if (gradebookSort === "score_asc") return getScore(a) - getScore(b);
      if (gradebookSort === "correct_desc") return Number(b.correctAnswers || 0) - Number(a.correctAnswers || 0);
      if (gradebookSort === "correct_asc") return Number(a.correctAnswers || 0) - Number(b.correctAnswers || 0);
      if (gradebookSort === "submitted_desc") return Number(b.submittedAt || 0) - Number(a.submittedAt || 0);
      if (gradebookSort === "submitted_asc") return Number(a.submittedAt || 0) - Number(b.submittedAt || 0);
      if (gradebookSort === "time_asc") return Number(a.timeSpent ?? Number.MAX_SAFE_INTEGER) - Number(b.timeSpent ?? Number.MAX_SAFE_INTEGER);
      return Number(b.timeSpent ?? -1) - Number(a.timeSpent ?? -1);
    });
  };

  const toggleGradebookSort = (field: "name" | "score" | "correct" | "time" | "submitted") => {
    const asc = `${field}_asc` as typeof gradebookSort;
    const desc = `${field}_desc` as typeof gradebookSort;
    setGradebookSort(prev => prev === desc ? asc : desc);
  };

  const sortArrow = (field: "name" | "score" | "correct" | "time" | "submitted") => {
    if (!gradebookSort.startsWith(field)) return "unfold_more";
    return gradebookSort.endsWith("_asc") ? "arrow_upward" : "arrow_downward";
  };

  const toCsvCell = (value: unknown) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const toFileNamePart = (value: unknown) => {
    return String(value ?? "")
      .trim()
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s/g, "_") || "khong_ro";
  };

  const formatFileTimestamp = () => {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  };

  const exportGradebookCsv = (exam: any, results: any[]) => {
    try {
      let csv = "Họ tên,Điểm,Số câu đúng,Tổng số câu,Thời gian làm bài,Thời gian nộp\n";
      results.forEach((res: any) => {
        csv += [
          toCsvCell(res.studentName || "Ẩn danh"),
          toCsvCell(getScore(res).toFixed(1)),
          toCsvCell(res.correctAnswers ?? ""),
          toCsvCell(res.totalQuestions ?? ""),
          toCsvCell(formatDuration(res.timeSpent)),
          toCsvCell(`\t${formatSubmittedAt(res)}`)
        ].join(",") + "\n";
      });
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${toFileNamePart(exam.title)}_${toFileNamePart(classroom?.name)}_${toFileNamePart(exam.accessCode)}_${formatFileTimestamp()}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e: any) {
      toast.error("Không thể xuất bảng điểm: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060f1e] text-slate-800 dark:text-slate-100">
      {/* ── HEADER ── */}
      <div className="relative bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-[#0a1f3e] dark:to-slate-900 border-b border-slate-200 dark:border-slate-800/60 px-8 pt-8 pb-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-32 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>
 
        <button onClick={() => router.push("/teacher/classrooms")} className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-sm mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại
        </button>
 
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">{classroom?.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm leading-relaxed">{classroom?.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                <span className="text-cyan-600 dark:text-cyan-400 font-black">{classroom?.studentIds?.length || 0}</span> học sinh
              </span>
              {classroom?.pendingStudentIds?.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold animate-pulse">
                  {classroom.pendingStudentIds.length} chờ duyệt
                </span>
              )}
              <button
                onClick={() => copyCode(classroom?.code)}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-lg px-3 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors group border border-slate-200/50 dark:border-transparent"
              >
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Mã:</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-black tracking-widest">{classroom?.code}</span>
                <Copy className="w-3 h-3 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
              </button>
              <button onClick={() => fetchData()} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors border border-slate-200/50 dark:border-transparent">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
 
        {/* Tab Nav */}
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
                <span className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-black bg-amber-500 text-white rounded-full flex items-center justify-center shadow-sm">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="p-8">

        {/* BẢNG TIN */}
        {tab === "stream" && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200/80 dark:border-cyan-950/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] flex items-center justify-center text-white font-extrabold text-xs shadow-sm">GV</div>
                <span className="text-slate-700 dark:text-slate-300 text-sm font-bold">Đăng thông báo cho lớp...</span>
              </div>
              <textarea
                id="postInput"
                rows={3}
                placeholder="Nhập nội dung thông báo, nhắc nhở, bài tập..."
                className="w-full bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 text-sm resize-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <div className="flex justify-end mt-3">
                <button 
                  onClick={async () => {
                    const content = (document.getElementById("postInput") as HTMLTextAreaElement)?.value;
                    if (!content?.trim()) return;
                    try {
                      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088'}/api/classrooms/${classroomId}/posts`, {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${localStorage.getItem("accessToken")}` 
                        },
                        body: JSON.stringify({ content })
                      });
                      if (!r.ok) throw new Error("Không thể đăng thông báo.");
                      toast.success("Đã đăng thông báo.");
                      (document.getElementById("postInput") as HTMLTextAreaElement).value = "";
                      fetchData();
                    } catch(e: any) { toast.error(e.message); }
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_12px_rgba(0,198,255,0.2)] active:scale-[0.98]"
                >
                  Đăng thông báo
                </button>
              </div>
            </div>
            
            {posts.length === 0 ? (
              <div className="text-center text-slate-400 dark:text-slate-500 py-16 border border-dashed border-slate-200 dark:border-cyan-950/60 rounded-3xl bg-white/40 dark:bg-[#0A1F3E]/20 backdrop-blur-sm">
                <span className="material-symbols-outlined text-4xl mb-3 block text-slate-300 dark:text-slate-600">notifications_active</span>
                <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">Chưa có thông báo nào</p>
                <p className="text-xs text-slate-400">Hãy đăng thông báo đầu tiên để trao đổi và giao nhiệm vụ cho cả lớp!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post: any) => (
                  <div key={post.id} className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs font-black">GV</div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-100 text-sm font-bold">{post.authorName}</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs">{new Date(post.createdAt).toLocaleString("vi-VN")}</p>
                      </div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* THÀNH VIÊN */}
        {tab === "members" && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
            <div className="space-y-6">
            {/* Invite */}
            <div className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-6 shadow-sm">
              <h3 className="text-slate-800 dark:text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Mail className="w-4 h-4 text-cyan-500" /> Mới học sinh qua Email
              </h3>
              <form onSubmit={handleInvite} className="flex gap-3">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@truong.edu.vn"
                  className="flex-1 bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
                >
                  {inviting ? "Đang mời..." : "Mời ngay"}
                </button>
              </form>
            </div>

            {/* Pending */}
            {pendingStudents.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-sm">
                <h3 className="text-amber-600 dark:text-amber-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Clock className="w-4 h-4" /> Chờ phê duyệt ({pendingStudents.length})
                </h3>
                <div className="space-y-3">
                  {pendingStudents.map((stud: any) => (
                    <div key={stud.id} className="flex items-center justify-between bg-white dark:bg-[#0A1F3E]/60 rounded-xl px-4 py-3 border border-slate-150 dark:border-transparent">
                      <div className="flex items-center gap-3">
                        <Avatar name={stud.fullName || stud.email} src={stud.avatarUrl} tone="amber" />
                        <div>
                          <p className="text-slate-800 dark:text-slate-100 text-sm font-bold">{stud.fullName}</p>
                          <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">{stud.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(stud.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-450 rounded-lg text-xs font-bold transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                        </button>
                        <button
                          onClick={() => handleReject(stud.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved students */}
            <div className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-6 shadow-sm">
              <h3 className="text-slate-800 dark:text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Users className="w-4 h-4 text-cyan-500" /> Học sinh ({students.length})
              </h3>
              {students.length === 0 ? (
                <p className="text-slate-450 text-center py-8 font-medium">Chưa có học sinh nào. Mời học sinh hoặc chờ các em nhập mã lớp.</p>
              ) : (
                <div className="space-y-2">
                  {students.map((stud: any) => (
                    <div key={stud.id} className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-[#051329]/60 rounded-xl border border-slate-200/50 dark:border-transparent group">
                      <Avatar name={stud.fullName || stud.email} src={stud.avatarUrl} />
                      <div>
                        <p className="text-slate-800 dark:text-slate-100 text-sm font-bold">{stud.fullName}</p>
                        <p className="text-slate-450 dark:text-slate-500 text-xs font-semibold">{stud.email}</p>
                      </div>
                      <span className="ml-auto text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-full font-bold group-hover:hidden">Thành viên</span>
                      <button
                        onClick={async () => {
                          if (window.confirm("Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?")) {
                            try {
                              const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088'}/api/classrooms/${classroomId}/remove/${stud.id}`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
                              });
                              if (!r.ok) throw new Error("Không thể xóa học sinh.");
                              toast.success("Đã xóa học sinh khỏi lớp.");
                              fetchData();
                            } catch (e: any) { toast.error(e.message); }
                          }
                        }}
                        className="ml-auto hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            </div>

            {/* Member logs */}
            {memberLogs.length > 0 && (
              <aside className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-4 shadow-sm xl:sticky xl:top-24">
                <h3 className="text-slate-800 dark:text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-cyan-500" /> Nhật ký thành viên
                </h3>
                <div className="space-y-2">
                  {memberLogs.slice(0, 8).map((log: any, idx: number) => {
                    const isRemoved = log.action === "REMOVED";
                    const createdAt = log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }) : "";

                    return (
                      <div key={`${log.studentId}-${log.createdAt || idx}`} className="flex items-start gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-[#051329]/60 rounded-xl border border-slate-200/50 dark:border-transparent">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${
                          isRemoved
                            ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300"
                            : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                        }`}>
                          {isRemoved ? "-" : "+"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-800 dark:text-slate-100 text-xs font-bold truncate">
                            {log.studentName || log.studentEmail || "Học sinh"}
                          </p>
                          <p className="text-slate-450 dark:text-slate-500 text-[11px] font-semibold leading-snug">
                            {isRemoved ? "Được mời ra khỏi lớp" : "Được thêm vào lớp"}
                            {log.actorName ? ` bởi ${log.actorName}` : ""}
                          </p>
                          <p className={`mt-1 text-[10px] font-bold ${isRemoved ? "text-rose-500" : "text-emerald-500"}`}>
                            {createdAt}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>
            )}
          </div>
        )}


        {/* THẢO LUẬN */}
        {tab === "chat" && (
          <div className="max-w-3xl mx-auto">
            <div
              className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-3xl overflow-hidden flex flex-col shadow-sm"
              style={{ height: "calc(100vh - 290px)", minHeight: "400px" }}
            >
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-cyan-950/40 bg-slate-50 dark:bg-slate-900/40 shrink-0">
                <div className={`w-2 h-2 rounded-full transition-colors ${wsConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{wsConnected ? "Realtime đang kết nối" : "Đang kết nối..."}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/50 dark:bg-transparent">
                {chatMsgs.length === 0 && (
                  <div className="text-center text-slate-450 dark:text-slate-500 py-16 text-sm font-semibold">Chưa có tin nhắn nào. Hãy mở lời để bắt đầu cuộc thảo luận!</div>
                )}
                {chatMsgs.map((msg, i) => {
                  const isMe = msg.senderId === userRef.current?.id;
                  return (
                    <div key={msg.id || i} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && <Avatar name={msg.senderName} src={getChatAvatar(msg)} className="w-8 h-8" tone={msg.senderRole === "teacher" ? "amber" : "cyan"} />}
                      <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2.5 shadow-sm ${
                        isMe
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-sm font-medium"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 rounded-bl-sm border border-slate-200/40 dark:border-transparent font-medium"
                      }`}>
                        {!isMe && (
                          <div className="mb-1 flex items-center gap-2">
                            <p className={`text-xs font-extrabold ${msg.senderRole === "teacher" ? "text-amber-600 dark:text-amber-400" : "text-cyan-600 dark:text-cyan-400"}`}>{msg.senderName}</p>
                            {msg.senderRole === "teacher" && (
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
              <div className="p-4 border-t border-slate-100 dark:border-cyan-950/40 bg-slate-50 dark:bg-slate-900/40 flex gap-3 shrink-0">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder="Nhắn nhủ tới học sinh..."
                  className="flex-1 bg-white dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-400"
                />
                <button
                  onClick={sendMsg}
                  disabled={!chatInput.trim() || !wsConnected}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white disabled:opacity-40 hover:from-cyan-400 hover:to-blue-500 transition-all shrink-0 shadow-md shadow-blue-500/10 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BÀI THI */}
        {tab === "exams" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-6 shadow-sm">
              <div>
                <h3 className="text-slate-800 dark:text-white font-bold text-lg flex items-center gap-2 uppercase tracking-wider">
                  <Trophy className="w-5 h-5 text-cyan-500" /> Bài kiểm tra & Thi cử ({exams?.length || 0})
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">Quản lý và thiết lập phòng thi trực tuyến cho lớp học này.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all border border-slate-200 dark:border-slate-700/60 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Thêm từ Kho đề
                </button>
                <button
                  onClick={() => router.push(`/teacher/exams/?classroomId=${classroomId}&mode=ai`)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_12px_rgba(0,198,255,0.25)]"
                >
                  <Plus className="w-4 h-4" /> Tạo đề thi mới
                </button>
              </div>
            </div>

            {/* Guide Section */}
            <div className="bg-slate-100/30 dark:bg-cyan-950/20 border border-slate-250 dark:border-cyan-950/40 rounded-2xl p-5 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                <span className="material-symbols-outlined text-lg">lightbulb</span>
                <h4 className="text-xs font-extrabold uppercase tracking-widest">💡 Hướng dẫn giao bài thi cho Lớp học</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Workflow 1 */}
                <div className="bg-white dark:bg-[#0A1F3E]/60 p-4 rounded-xl border border-slate-200/50 dark:border-cyan-950/20 space-y-2">
                  <div className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center text-[10px]">1</span>
                    Tạo mới & Giao trực tiếp (Khuyên dùng)
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed pl-7 font-medium">
                    Nhấn <strong className="text-cyan-600 dark:text-cyan-400">&quot;Tạo đề thi mới&quot;</strong> để thiết kế đề bằng AI, nhập file hoặc nhập tay. Khi lưu, đề sẽ được gắn vào lớp này và có thể cấu hình thời gian, số mã đề, giám sát AI trước khi học sinh làm bài.
                  </p>
                </div>

                {/* Workflow 2 */}
                <div className="bg-white dark:bg-[#0A1F3E]/60 p-4 rounded-xl border border-slate-200/50 dark:border-cyan-950/20 space-y-2">
                  <div className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                    Giao bài thi đã có từ &quot;Kỳ thi của tôi&quot;
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed pl-7 font-medium">
                    Nhấn <strong className="text-cyan-600 dark:text-cyan-400">&quot;Thêm từ Kho đề&quot;</strong> để chọn đề mẫu đã lưu. Sau đó bấm <strong className="text-cyan-600 dark:text-cyan-400">&quot;Cấu hình&quot;</strong> để đặt thời gian làm bài, số mã đề, lịch bắt đầu và quyền xem đáp án trước khi giao.
                  </p>
                </div>
              </div>
            </div>

            {(!exams || exams.length === 0) ? (
              <div className="text-center text-slate-400 dark:text-slate-500 py-20 border border-dashed border-slate-200 dark:border-cyan-950/60 rounded-3xl bg-white dark:bg-[#0A1F3E]/20">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20 animate-pulse" />
                <p className="font-bold text-slate-500 dark:text-slate-400">Lớp học chưa có bài kiểm tra nào</p>
                <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">Hãy tạo đề thi mới để học sinh tham gia!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {exams.map((exam: any) => {
                  const isStarted = exam.status === "STARTED";
                  const isFinished = exam.status === "FINISHED" || exam.status === "COMPLETED";
                  const questionCount = exam.questionCount || exam.versions?.[0]?.questions?.length || 0;
                  const createdDate = exam.createdAt || exam.createdDate || exam.createdAtMillis;
                  const createdLabel = createdDate ? new Date(createdDate).toLocaleDateString("vi-VN") : "--";
                  const statusConfig = isStarted
                    ? {
                        label: "Đang thi",
                        hint: "Phòng thi đang diễn ra",
                        badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
                        icon: Radio
                      }
                    : isFinished
                    ? {
                        label: "Đã kết thúc",
                        hint: "Bài thi đã đóng",
                        badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
                        icon: CheckCircle
                      }
                    : {
                        label: "Sẵn sàng",
                        hint: "Chờ bắt đầu thủ công",
                        badge: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30",
                        icon: Clock
                      };
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={exam.id} className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-[1.75rem] p-6 md:p-8 shadow-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-cyan-800/70 transition-all">
                      <div className="flex items-start justify-between gap-5">
                        <span className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-wider ${statusConfig.badge}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig.label}
                        </span>

                        <button
                          type="button"
                          onClick={() => exam.accessCode && navigator.clipboard.writeText(exam.accessCode)}
                          className="inline-flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700 tracking-[0.18em] hover:bg-cyan-100 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-300"
                          title="Sao chép mã phòng"
                        >
                          <KeyRound className="w-4 h-4 tracking-normal" />
                          {exam.accessCode || "------"}
                        </button>
                      </div>

                      <div className="mt-7">
                        <h4 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{exam.title}</h4>
                        <div className="mt-4 flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <BookOpen className="w-4 h-4" />
                            Lớp: {classroom?.name}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span>{questionCount} câu hỏi / {exam.duration || 0} phút</span>
                          {exam.aiProctoring && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300">
                                <Shield className="w-4 h-4" />
                                AI giám sát
                              </span>
                            </>
                          )}
                        </div>
                        <p className="mt-5 text-sm font-bold text-slate-400 dark:text-slate-500">{statusConfig.hint}</p>
                      </div>

                      <div className="mt-8 border-t border-slate-100 dark:border-cyan-950/50 pt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-8 text-xs font-semibold text-slate-400 dark:text-slate-500">
                          <div>
                            <p>Tạo ngày</p>
                            <p className="mt-1 font-bold text-slate-500 dark:text-slate-400">{createdLabel}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap justify-start lg:justify-end">
                          {isFinished && exam.accessCode && (
                            <button
                              type="button"
                              onClick={() => {
                                const returnTo = encodeURIComponent(`/teacher/classrooms/detail/?id=${classroomId}?tab=exams`);
                                router.push(`/teacher/exams/results/detail/?code=${exam.accessCode}?returnTo=${returnTo}`);
                              }}
                              className="min-w-[150px] inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/25 hover:from-blue-500 hover:to-cyan-400 active:scale-[0.98] transition-all"
                            >
                              <BarChart3 className="w-5 h-5" />
                              Xem kết quả
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => router.push(`/teacher/exam-room/detail/?id=${exam.id}`)}
                            className="min-w-[150px] inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 active:scale-[0.98] transition-all"
                          >
                            <DoorOpen className="w-5 h-5" />
                            {isStarted ? "Vào giám sát" : "Vào phòng chờ"}
                          </button>

                          {!isFinished && !isStarted && (
                            <button
                              type="button"
                              onClick={() => handleStartExam(exam.id)}
                              className="min-w-[126px] rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-300 dark:hover:bg-blue-500/20 active:scale-[0.98] transition-all"
                            >
                              Bắt đầu ngay
                            </button>
                          )}

                          {isStarted && (
                            <button
                              type="button"
                              onClick={() => handleCloseExam(exam.id)}
                              className="min-w-[126px] rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/20 active:scale-[0.98] transition-all"
                            >
                              Đóng phòng
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="p-3 text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
                            title="Xóa bài thi khỏi lớp học"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BẢNG ĐIỂM */}
        {tab === "gradebook" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-6 shadow-sm">
              <h3 className="text-slate-800 dark:text-white font-bold mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
                <Award className="w-5 h-5 text-cyan-500" /> Phổ điểm Lớp học ({exams.length} bài thi)
              </h3>
              {exams.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 py-16 border border-dashed border-slate-200 dark:border-cyan-950/60 rounded-3xl bg-white dark:bg-[#0A1F3E]/20">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-20 animate-pulse" />
                  <p className="font-bold text-slate-500 dark:text-slate-400">Chưa có bài thi thống kê</p>
                  <p className="text-xs mt-1 text-slate-450">Các bài kiểm tra được gán vào lớp và học sinh nộp bài sẽ tự động hiển thị biểu đồ điểm số tại đây.</p>
                </div>
            ) : (
                <div className="space-y-6">
                  {exams.map((exam: any) => {
                    const results = examStats[exam.id] || [];
                    const distribution = buildScoreDistribution(results);
                    const maxBucket = Math.max(...distribution, 1);
                    const scores = results.map(getScore);
                    const submittedCount = results.length;
                    const averageScore = submittedCount ? scores.reduce((sum, score) => sum + score, 0) / submittedCount : 0;
                    const highestScore = submittedCount ? Math.max(...scores) : 0;
                    const lowestScore = submittedCount ? Math.min(...scores) : 0;
                    return (
                      <div key={exam.id} className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/40 shadow-sm space-y-5">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 pb-4">
                          <div>
                            <h4 className="text-slate-800 dark:text-white font-extrabold text-base">{exam.title}</h4>
                            <p className="text-xs text-slate-400 mt-1">
                              {exam.versions?.[0]?.questions?.length || exam.questionCount || 0} câu hỏi · {exam.duration || 0} phút
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => exportGradebookCsv(exam, results)}
                              disabled={submittedCount === 0}
                              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100/50 dark:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-200 dark:border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-500/30 transition-colors"
                            >
                              Xuất CSV
                            </button>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/30">
                              {submittedCount} lượt nộp
                            </span>
                          </div>
                        </div>

                        {submittedCount === 0 ? (
                          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                            <Award className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Chưa có học sinh nộp bài</p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="rounded-2xl bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 p-4">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Đã nộp</p>
                                <p className="mt-1 text-2xl font-black text-slate-800 dark:text-white">{submittedCount}</p>
                              </div>
                              <div className="rounded-2xl bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 p-4">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Trung bình</p>
                                <p className="mt-1 text-2xl font-black text-cyan-600 dark:text-cyan-300">{averageScore.toFixed(1)}</p>
                              </div>
                              <div className="rounded-2xl bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 p-4">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cao nhất</p>
                                <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-300">{highestScore.toFixed(1)}</p>
                              </div>
                              <div className="rounded-2xl bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 p-4">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Thấp nhất</p>
                                <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-300">{lowestScore.toFixed(1)}</p>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 p-5">
                              <div className="flex items-end gap-1.5 h-28">
                                {distribution.map((count, i) => (
                                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group/bar">
                                    <span className="text-[10px] font-bold text-slate-400">{count}</span>
                                    <div
                                      className="w-full rounded-t bg-gradient-to-t from-cyan-600/80 to-cyan-400/80 group-hover/bar:from-cyan-500 group-hover/bar:to-cyan-300 transition-all min-h-[4px]"
                                      style={{ height: `${(count / maxBucket) * 100}%` }}
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="flex mt-2">
                                {Array.from({ length: 11 }, (_, i) => (
                                  <span key={i} className="flex-1 text-center text-[10px] font-bold text-slate-500">{i}</span>
                                ))}
                              </div>
                              <p className="text-xs text-slate-500 text-center mt-2">Số học sinh theo từng mốc điểm 0-10</p>
                            </div>

                            <div className="rounded-2xl bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 overflow-hidden">
                              <div className="grid grid-cols-[1fr_90px_110px_120px_150px] gap-3 px-4 py-3 bg-slate-50 dark:bg-cyan-950/20 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                {[
                                  { field: "name", label: "Học sinh" },
                                  { field: "score", label: "Điểm" },
                                  { field: "correct", label: "Số câu đúng" },
                                  { field: "time", label: "Thời gian làm" },
                                  { field: "submitted", label: "Nộp lúc" },
                                ].map((item) => (
                                  <button
                                    key={item.field}
                                    type="button"
                                    onClick={() => toggleGradebookSort(item.field as "name" | "score" | "correct" | "time" | "submitted")}
                                    className={`inline-flex items-center gap-1 text-left font-black uppercase tracking-wider transition-colors ${
                                      gradebookSort.startsWith(item.field) ? "text-cyan-600 dark:text-cyan-300" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    }`}
                                  >
                                    {item.label}
                                    <span className="material-symbols-outlined text-[15px] leading-none">{sortArrow(item.field as "name" | "score" | "correct" | "time" | "submitted")}</span>
                                  </button>
                                ))}
                              </div>
                              <div className="divide-y divide-slate-100 dark:divide-cyan-950/30">
                                {sortGradebookResults(results)
                                  .map((res: any) => (
                                    <div key={res.id || `${res.studentId}-${res.submittedAt}`} className="grid grid-cols-[1fr_90px_110px_120px_150px] gap-3 px-4 py-3 text-sm items-center">
                                      <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{res.studentName || "Ẩn danh"}</span>
                                      <span className="font-black text-cyan-600 dark:text-cyan-300">{getScore(res).toFixed(1)}</span>
                                      <span className="text-slate-500 dark:text-slate-400 font-semibold">{res.correctAnswers ?? 0}/{res.totalQuestions ?? "-"}</span>
                                      <span className="text-xs text-slate-400 font-semibold">{formatDuration(res.timeSpent)}</span>
                                      <span className="text-xs text-slate-400">{formatSubmittedAt(res) || "--"}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL MỚI CHO BÀI THI */}
        <LinkExamFromRepositoryModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          classroomId={classroomId}
          onSuccess={fetchData}
        />
      </div>
    </div>
  );
}

// ── LinkExamFromRepositoryModal Component ──
const getRepositoryQuestionCount = (exam: any) => exam.questionCount || exam.versions?.[0]?.questions?.length || 0;

interface LinkExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  onSuccess: () => void;
}

function LinkExamFromRepositoryModal({ isOpen, onClose, classroomId, onSuccess }: LinkExamModalProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedExamForConfig, setSelectedExamForConfig] = useState<any>(null);

  const fetchRepositoryExams = useCallback(async () => {
    setLoading(true);
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const user = JSON.parse(u);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/exams/teacher/${user.id}/templates`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const unique = new Map<string, any>();

          (Array.isArray(data) ? data : []).forEach((exam: any) => {
            const key = exam.id || exam._id || exam.templateId;
            if (!key || unique.has(key)) return;
            unique.set(String(key), exam);
          });

          setExams(Array.from(unique.values()));
        }
      }
    } catch (e: any) {
      toast.error("Không thể tải kho lưu trữ: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRepositoryExams();
    }
  }, [isOpen, fetchRepositoryExams]);

  if (!isOpen) return null;

  const filtered = exams.filter(item =>
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 rounded-[1.75rem] w-full max-w-2xl max-h-[86vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-100 dark:border-cyan-950/40 flex justify-between items-center shrink-0">
          <h3 className="text-slate-900 dark:text-white font-extrabold text-lg flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </span>
            Giao đề thi từ Kho đề
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors text-sm font-bold">
            Đóng
          </button>
        </div>

        <div className="p-5 bg-slate-50 dark:bg-[#071829] shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[22px]">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm đề thi từ Kho đề..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 rounded-2xl pl-12 pr-4 py-3.5 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-slate-200 dark:border-cyan-950/50 rounded-3xl">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">Không còn đề phù hợp để giao</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Các đề đã có trong lớp sẽ không hiển thị lại để tránh giao trùng.</p>
            </div>
          ) : (
            filtered.map((exam) => (
              <div key={exam.id} className="bg-white dark:bg-[#071829] border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-cyan-200 dark:hover:border-cyan-800/70 transition-all">
                <div className="min-w-0">
                  <h4 className="text-slate-900 dark:text-white font-extrabold text-base truncate">{exam.title}</h4>
                  <div className="flex items-center gap-3 mt-2 text-xs font-bold text-slate-400 dark:text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {getRepositoryQuestionCount(exam)} câu hỏi
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span>{exam.duration || 0} phút</span>
                    {exam.subject && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="text-cyan-600 dark:text-cyan-300">{exam.subject}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExamForConfig(exam)}
                  className="px-5 py-2.5 bg-cyan-50 hover:bg-cyan-500 disabled:bg-slate-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500 text-cyan-700 hover:text-white disabled:text-slate-400 border border-cyan-200 dark:border-cyan-500/20 rounded-xl text-sm font-black transition-all shrink-0"
                >
                  Cấu hình
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <ExamConfigDrawer
        isOpen={!!selectedExamForConfig}
        onClose={() => setSelectedExamForConfig(null)}
        exam={selectedExamForConfig}
        defaultClassroomId={classroomId}
        lockClassroom
        onSuccess={() => {
          setSelectedExamForConfig(null);
          onSuccess();
          onClose();
        }}
      />
    </div>
  );
}

// ── CreateClassroomExamModal Component ──
interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  onSuccess: () => void;
}

interface QuestionInput {
  content: string;
  options: string[];
  correctAnswer: string;
}

function CreateClassroomExamModal({ isOpen, onClose, classroomId, onSuccess }: CreateExamModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(45);
  const [shuffle, setShuffle] = useState(true);
  const [aiProctoring, setAiProctoring] = useState(false);
  const [allowReview, setAllowReview] = useState(true);
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { content: "", options: ["", "", "", ""], correctAnswer: "" }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { content: "", options: ["", "", "", ""], correctAnswer: "" }]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestionText = (idx: number, text: string) => {
    setQuestions(questions.map((q, i) => i === idx ? { ...q, content: text } : q));
  };

  const updateOptionText = (qIdx: number, oIdx: number, text: string) => {
    setQuestions(questions.map((q, i) => {
      if (i === qIdx) {
        const newOpts = [...q.options];
        newOpts[oIdx] = text;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const updateCorrectAnswer = (qIdx: number, val: string) => {
    setQuestions(questions.map((q, i) => i === qIdx ? { ...q, correctAnswer: val } : q));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng điền tiêu đề bài thi.");
      return;
    }
    
    // Validate câu hỏi
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        toast.error(`Vui lòng điền nội dung câu hỏi ${i + 1}.`);
        return;
      }
      for (let oi = 0; oi < 4; oi++) {
        if (!q.options[oi].trim()) {
          toast.error(`Vui lòng điền lựa chọn ${String.fromCharCode(65 + oi)} của câu hỏi ${i + 1}.`);
          return;
        }
      }
      if (!q.correctAnswer) {
        toast.error(`Vui lòng chọn đáp án đúng cho câu hỏi ${i + 1}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const u = localStorage.getItem("user");
      let teacherId = "";
      let teacherName = "";
      if (u) {
        const parsed = JSON.parse(u);
        teacherId = parsed.id;
        teacherName = parsed.fullName || parsed.email;
      }

      // Chuẩn bị payload tương thích với Exam Model
      const payload = {
        title: title.trim(),
        description: description.trim(),
        duration,
        shuffle,
        aiProctoring,
        allowReview,
        teacherId,
        teacherName,
        classroomId,
        status: "PUBLISHED", // Học sinh có thể vào thi
        isBankItem: false,
        isPractice: false,
        versions: [
          {
            versionCode: "101",
            questions: questions.map((q, i) => ({
              id: String(i),
              content: q.content.trim(),
              options: q.options.map(o => o.trim()),
              correctAnswer: q.correctAnswer.trim()
            }))
          }
        ]
      };

      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Tạo bài thi thất bại.");
      }

      toast.success("Tạo bài thi thành công!");
      onSuccess();
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setDuration(45);
      setShuffle(true);
      setAiProctoring(false);
      setAllowReview(true);
      setQuestions([{ content: "", options: ["", "", "", ""], correctAnswer: "" }]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" /> Tạo đề thi mới trực tiếp
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-sm">
            Đóng
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Thông tin chung */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Tiêu đề bài thi</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ví dụ: Kiểm tra 15 phút Toán đại số"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Mô tả bài kiểm tra</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Hướng dẫn học sinh hoặc mô tả phạm vi kiến thức..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Thời gian làm bài (Phút)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-6">
                <input
                  type="checkbox"
                  id="shuffle"
                  checked={shuffle}
                  onChange={e => setShuffle(e.target.checked)}
                  className="w-4 h-4 bg-slate-950 border-slate-700 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="shuffle" className="text-sm text-slate-300 font-medium cursor-pointer flex items-center gap-1">
                  <Shuffle className="w-3.5 h-3.5 text-cyan-400" /> Trộn câu hỏi
                </label>
              </div>

              <div className="flex items-center gap-2.5 pt-6">
                <input
                  type="checkbox"
                  id="aiProctoring"
                  checked={aiProctoring}
                  onChange={e => setAiProctoring(e.target.checked)}
                  className="w-4 h-4 bg-slate-950 border-slate-700 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="aiProctoring" className="text-sm text-slate-300 font-medium cursor-pointer flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Giám sát AI
                </label>
              </div>

              <div className="flex items-center gap-2.5 pt-6">
                <input
                  type="checkbox"
                  id="allowReview"
                  checked={allowReview}
                  onChange={e => setAllowReview(e.target.checked)}
                  className="w-4 h-4 bg-slate-950 border-slate-700 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="allowReview" className="text-sm text-slate-300 font-medium cursor-pointer flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" /> Xem đáp án
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-white font-bold text-sm">Danh sách câu hỏi ({questions.length})</h4>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white rounded-xl text-xs font-semibold transition-all border border-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 relative space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Câu hỏi {qIdx + 1}</span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Nội dung câu hỏi..."
                      value={q.content}
                      onChange={e => updateQuestionText(qIdx, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2 bg-slate-900/40 rounded-xl px-3 py-1.5 border border-slate-800">
                        <span className="text-xs font-bold text-slate-500">{String.fromCharCode(65 + oIdx)}.</span>
                        <input
                          type="text"
                          required
                          placeholder={`Lựa chọn ${String.fromCharCode(65 + oIdx)}`}
                          value={opt}
                          onChange={e => updateOptionText(qIdx, oIdx, e.target.value)}
                          className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-3 bg-slate-900/60 p-3 rounded-xl">
                    <label className="text-xs font-semibold text-slate-400">Đáp án chính xác:</label>
                    <div className="flex gap-2 flex-wrap">
                      {q.options.map((opt, oIdx) => {
                        const hasVal = opt.trim() !== "";
                        const isCorrect = q.correctAnswer !== "" && q.correctAnswer === opt;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={!hasVal}
                            onClick={() => updateCorrectAnswer(qIdx, opt)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                              !hasVal
                                ? "opacity-30 border-transparent bg-slate-800 text-slate-500"
                                : isCorrect
                                ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
                            }`}
                          >
                            Lựa chọn {String.fromCharCode(65 + oIdx)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            {submitting ? "Đang tạo..." : "Tạo bài thi"}
          </button>
        </div>
      </form>
    </div>
  );
}