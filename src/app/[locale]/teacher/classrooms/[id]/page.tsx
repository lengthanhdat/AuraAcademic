"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { toast } from "sonner";
import { classroomApi } from "@/lib/classroomApi";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  ArrowLeft, Users, BookOpen, MessageSquare, BarChart3,
  Radio, CheckCircle, XCircle, Mail, Send, FileText,
  Clock, Award, Copy, RefreshCw, Trophy, Plus, Trash2, Shield, Shuffle,
  Link
} from "lucide-react";

type Tab = "stream" | "members" | "chat" | "gradebook" | "exams";

interface ClassroomMsg {
  id?: string;
  classroomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp?: string;
}

export default function TeacherClassroomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.id as string;

  const [tab, setTab] = useState<Tab>("stream");
  const [data, setData] = useState<{ classroom: any; exams: any[]; students?: any[]; pendingStudents?: any[]; removedStudents?: any[]; posts?: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ClassroomMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [examStats, setExamStats] = useState<Record<string, number[]>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const stompRef = useRef<Client | null>(null);
  const userRef = useRef<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (tab === "gradebook" && data?.exams) {
      data.exams.forEach(async (exam: any) => {
        if (!exam.accessCode) return;
        try {
          const r = await fetch(`http://localhost:8088/api/exams/${exam.accessCode}/results`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
          });
          if (r.ok) {
            const results = await r.json();
            const dist = new Array(11).fill(0);
            results.forEach((res: any) => {
               const maxScore = res.maxScore || 10;
               const scaledScore = (res.score / maxScore) * 10;
               let rounded = Math.round(scaledScore);
               if (rounded < 0) rounded = 0;
               if (rounded > 10) rounded = 10;
               dist[rounded]++;
            });
            const maxCount = Math.max(...dist, 1);
            const heights = dist.map(c => (c / maxCount) * 100);
            setExamStats(prev => ({ ...prev, [exam.id]: heights }));
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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const d = await classroomApi.getClassroomDetails(classroomId);
      setData(d);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
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
      webSocketFactory: () => new SockJS("http://localhost:8088/ws"),
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
      const res = await fetch(`http://localhost:8088/api/exams/${examId}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      if (!res.ok) throw new Error("Không thể bắt đầu thi.");
      toast.success("Kỳ thi đã bắt đầu thành công!");
      
      // Chuyển hướng thẳng tới trang giám sát realtime của giáo viên
      if (exam && exam.accessCode) {
        router.push(`/teacher/exams/results/${exam.accessCode}`);
      } else {
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCloseExam = async (examId: string) => {
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${examId}/close`, {
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

  const TABS: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "stream",    label: "Bảng tin",   icon: <Radio className="w-4 h-4" /> },
    { key: "members",   label: "Thành viên", icon: <Users className="w-4 h-4" />, badge: classroom?.pendingStudentIds?.length || 0 },
    { key: "exams",     label: "Bài thi",    icon: <Trophy className="w-4 h-4" />, badge: exams?.length || 0 },
    { key: "chat",      label: "Thảo luận",  icon: <MessageSquare className="w-4 h-4" /> },
    { key: "gradebook", label: "Bảng điểm",  icon: <BarChart3 className="w-4 h-4" /> },
  ];

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
              <button onClick={fetchData} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors border border-slate-200/50 dark:border-transparent">
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
                      const r = await fetch(`http://localhost:8088/api/classrooms/${classroomId}/posts`, {
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
          <div className="max-w-3xl mx-auto space-y-6">
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
                        <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-sm font-bold">?</div>
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
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs font-black">H</div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-100 text-sm font-bold">{stud.fullName}</p>
                        <p className="text-slate-450 dark:text-slate-500 text-xs font-semibold">{stud.email}</p>
                      </div>
                      <span className="ml-auto text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-full font-bold group-hover:hidden">Thành viên</span>
                      <button
                        onClick={async () => {
                          if (window.confirm("Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?")) {
                            try {
                              const r = await fetch(`http://localhost:8088/api/classrooms/${classroomId}/remove/${stud.id}`, {
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

            {/* Removed students */}
            {removedStudents.length > 0 && (
              <div className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-6 shadow-sm opacity-75">
                <h3 className="text-slate-800 dark:text-slate-300 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Users className="w-4 h-4 text-slate-500" /> Học sinh đã rời lớp ({removedStudents.length})
                </h3>
                <div className="space-y-2">
                  {removedStudents.map((stud: any) => (
                    <div key={stud.id} className="flex items-center gap-3 px-4 py-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-transparent">
                      <div className="w-9 h-9 rounded-full bg-slate-200/50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 text-xs font-black">H</div>
                      <div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-bold">{stud.fullName}</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">{stud.email}</p>
                      </div>
                      <span className="ml-auto text-xs px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-full font-bold">Đã xóa</span>
                    </div>
                  ))}
                </div>
              </div>
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
                    <div key={msg.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2.5 shadow-sm ${
                        isMe
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-sm font-medium"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 rounded-bl-sm border border-slate-200/40 dark:border-transparent font-medium"
                      }`}>
                        {!isMe && <p className="text-xs text-cyan-600 dark:text-cyan-400 font-extrabold mb-1">{msg.senderName}</p>}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
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
                  <Plus className="w-4 h-4" /> Thêm từ Kho lưu trữ
                </button>
                <button
                  onClick={() => router.push(`/teacher/exams?classroomId=${classroomId}&mode=ai`)}
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
                    Nhấp nút <strong className="text-cyan-600 dark:text-cyan-400">&quot;Tạo đề thi mới&quot;</strong> phía trên. Sau khi thiết kế câu hỏi bằng AI hoặc Nhập tay, đề thi sẽ tự động liên kết vào lớp này ngay khi bấm Lưu.
                  </p>
                </div>

                {/* Workflow 2 */}
                <div className="bg-white dark:bg-[#0A1F3E]/60 p-4 rounded-xl border border-slate-200/50 dark:border-cyan-950/20 space-y-2">
                  <div className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                    Giao bài thi đã có từ "Kỳ thi của tôi"
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed pl-7 font-medium">
                    Nhấp nút <strong className="text-cyan-600 dark:text-cyan-400">"Thêm từ Kho lưu trữ"</strong> phía trên. Danh sách các bài thi bạn đã tạo sẽ hiện ra để bạn có thể chọn và giao trực tiếp cho lớp một cách nhanh chóng.
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
              <div className="space-y-4">
                {exams.map((exam: any) => {
                  const isStarted = exam.status === "STARTED";
                  const isFinished = exam.status === "FINISHED" || exam.status === "COMPLETED";
                  return (
                    <div key={exam.id} className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-6 hover:border-cyan-500/20 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-slate-850 dark:text-white font-extrabold text-lg truncate leading-tight">{exam.title}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isStarted
                              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-500/30"
                              : isFinished
                              ? "bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50"
                              : "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30"
                          }`}>
                            {isStarted ? "Đang thi" : isFinished ? "Đã kết thúc" : "Đang mở phòng chờ"}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{exam.description || "Chưa có mô tả chi tiết cho bài thi này."}</p>
                        
                        <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-slate-400" /> {exam.questionCount || exam.versions?.[0]?.questions?.length || 0} câu hỏi</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {exam.duration} phút</span>
                          <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-transparent"><span className="text-slate-450">Mã phòng:</span> <span className="font-mono text-cyan-600 dark:text-cyan-450 font-black tracking-wider text-sm">{exam.accessCode}</span></span>
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">{exam.submissionCount || 0}</span> học sinh đã nộp</span>
                          {exam.aiProctoring && <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-transparent font-bold"><Shield className="w-3.5 h-3.5" /> AI Giám sát</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 flex-wrap md:flex-nowrap">
                        {!isFinished && !isStarted && (
                          <button
                            onClick={() => handleStartExam(exam.id)}
                            className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                          >
                            Bắt đầu thi
                          </button>
                        )}
                        {isStarted && (
                          <>
                            <button
                              onClick={() => router.push(`/teacher/exam-room/${exam.id}`)}
                              className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(0,198,255,0.4)] flex items-center gap-2 animate-pulse hover:animate-none"
                            >
                              <Shield className="w-4 h-4 text-white" />
                              Giám sát trực tiếp
                            </button>
                            <button
                              onClick={() => handleCloseExam(exam.id)}
                              className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                            >
                              Đóng phòng thi
                            </button>
                          </>
                        )}
                        {!isStarted && (
                          <button
                            onClick={() => router.push(`/teacher/exams/results/${exam.accessCode}`)}
                            className="w-full md:w-auto px-5 py-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all border border-slate-200 dark:border-slate-700/60 shadow-sm"
                          >
                            Xem kết quả
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="w-full md:w-auto p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl transition-all border border-rose-500/20 shadow-sm shrink-0 flex items-center justify-center gap-1.5 font-bold text-sm"
                          title="Xóa bài thi khỏi lớp học"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="md:hidden">Xóa</span>
                        </button>
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
          <div className="max-w-4xl mx-auto space-y-6">
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
                    const heights = examStats[exam.id] || Array.from({ length: 11 }, () => 0);
                    return (
                      <div key={exam.id} className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/40 shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 pb-3">
                          <h4 className="text-slate-800 dark:text-white font-bold text-base">{exam.title}</h4>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  const r = await fetch(`http://localhost:8088/api/exams/${exam.accessCode}/results`, {
                                    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
                                  });
                                  const results = await r.json();
                                  let csv = "Họ tên,Email,Điểm,Thời gian nộp\n";
                                  results.forEach((res: any) => {
                                    csv += `${res.studentName || 'Ẩn danh'},${res.studentEmail || ''},${res.score}/${res.maxScore},${res.submittedAt ? new Date(res.submittedAt).toLocaleString('vi-VN') : ''}\n`;
                                  });
                                  const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' });
                                  const link = document.createElement("a");
                                  link.href = URL.createObjectURL(blob);
                                  link.download = `BangDiem_${exam.title}.csv`;
                                  link.click();
                                } catch (e: any) { toast.error("Không thể xuất bảng điểm: " + e.message); }
                              }}
                              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100/50 dark:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-200 dark:border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-500/30 transition-colors"
                            >
                              Xuất CSV
                            </button>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/30">
                              {exam.submissionCount || 0} lượt nộp
                            </span>
                          </div>
                        </div>
                        {/* SVG Bar Chart */}
                        <div className="mt-2">
                          <div className="flex items-end gap-1.5 h-20">
                            {heights.map((h, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group/bar cursor-pointer">
                                <div
                                  className="w-full rounded-t bg-gradient-to-t from-cyan-600/80 to-cyan-400/80 group-hover/bar:from-cyan-500 group-hover/bar:to-cyan-300 transition-all"
                                  style={{ height: `${h}%` }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex mt-1">
                            {Array.from({ length: 11 }, (_, i) => (
                              <span key={i} className="flex-1 text-center text-[10px] text-slate-600">{i}</span>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 text-center mt-1">Phân bố điểm (0–10)</p>
                        </div>
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

  useEffect(() => {
    if (isOpen) {
      fetchRepositoryExams();
    }
  }, [isOpen]);

  const fetchRepositoryExams = async () => {
    setLoading(true);
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const user = JSON.parse(u);
        const res = await fetch(`http://localhost:8088/api/exams/teacher/${user.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setExams(data.filter((exam: any) => !exam.isPractice && !exam.isBankItem));
        }
      }
    } catch (e: any) {
      toast.error("Không thể tải kho lưu trữ: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (examId: string) => {
    try {
      await classroomApi.linkExamFromBank(classroomId, examId);
      toast.success("Giao bài thi thành công!");
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error("Không thể giao bài thi: " + e.message);
    }
  };

  if (!isOpen) return null;

  const filtered = exams.filter(item =>
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyan-400" /> Giao đề thi từ Kỳ thi của tôi
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-sm">
            Đóng
          </button>
        </div>

        <div className="p-4 bg-slate-950 shrink-0">
          <input
            type="text"
            placeholder="Tìm kiếm đề thi từ Kỳ thi của tôi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-center py-10 text-sm">Không tìm thấy đề thi nào trong Kỳ thi của tôi.</p>
          ) : (
            filtered.map((exam) => (
              <div key={exam.id} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-white font-semibold text-sm">{exam.title}</h4>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span>{exam.versions?.[0]?.questions?.length || exam.questionCount || 0} câu hỏi</span>
                    <span>•</span>
                    <span>{exam.duration} phút</span>
                    {exam.subject && (
                      <>
                        <span>•</span>
                        <span className="text-cyan-400">{exam.subject}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleLink(exam.id)}
                  className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white border border-cyan-500/20 rounded-xl text-xs font-semibold transition-all shrink-0"
                >
                  Giao đề
                </button>
              </div>
            ))
          )}
        </div>
      </div>
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

      const res = await fetch("http://localhost:8088/api/exams", {
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
