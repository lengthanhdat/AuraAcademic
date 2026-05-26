"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { toast } from "sonner";
import { classroomApi } from "@/lib/classroomApi";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  ArrowLeft, Users, BookOpen, MessageSquare, BarChart3,
  Radio, CheckCircle, XCircle, Mail, Send, FileText,
  Clock, Award, Copy, RefreshCw
} from "lucide-react";

type Tab = "stream" | "members" | "materials" | "chat" | "gradebook";

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
  const [data, setData] = useState<{ classroom: any; exams: any[]; materials: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
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

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
    </div>
  );
  if (!data) return (
    <div className="flex items-center justify-center min-h-screen text-slate-400">Không tìm thấy lớp học.</div>
  );

  const { classroom, exams, materials } = data;

  const TABS: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "stream",    label: "Bảng tin",   icon: <Radio className="w-4 h-4" /> },
    { key: "members",   label: "Thành viên", icon: <Users className="w-4 h-4" />, badge: classroom?.pendingStudentIds?.length || 0 },
    { key: "materials", label: "Tài liệu",   icon: <BookOpen className="w-4 h-4" /> },
    { key: "chat",      label: "Thảo luận",  icon: <MessageSquare className="w-4 h-4" /> },
    { key: "gradebook", label: "Bảng điểm",  icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#060f1e]">
      {/* ── HEADER ── */}
      <div className="relative bg-gradient-to-r from-slate-900 via-[#0a1f3e] to-slate-900 border-b border-slate-800/60 px-8 pt-8 pb-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-32 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <button onClick={() => router.push("/teacher/classrooms")} className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-sm mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{classroom?.name}</h1>
            <p className="text-slate-400 mt-1 text-sm">{classroom?.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
              <span className="text-slate-400">
                <span className="text-cyan-400 font-bold">{classroom?.studentIds?.length || 0}</span> học sinh
              </span>
              {classroom?.pendingStudentIds?.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                  {classroom.pendingStudentIds.length} chờ duyệt
                </span>
              )}
              <button
                onClick={() => copyCode(classroom?.code)}
                className="flex items-center gap-1.5 bg-slate-800/60 rounded-lg px-3 py-1 hover:bg-slate-700/60 transition-colors group"
              >
                <span className="text-slate-400 text-xs">Mã:</span>
                <span className="font-mono text-cyan-400 font-bold tracking-widest">{classroom?.code}</span>
                <Copy className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>
              <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-500 hover:text-cyan-400 transition-colors">
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
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all rounded-t-xl whitespace-nowrap ${
                tab === t.key
                  ? "bg-[#060f1e] text-cyan-400 border-x border-t border-slate-700/60"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              {t.icon}{t.label}
              {(t.badge ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold bg-amber-500 text-white rounded-full flex items-center justify-center">
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
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">GV</div>
                <span className="text-slate-400 text-sm">Đăng thông báo cho lớp...</span>
              </div>
              <textarea
                rows={3}
                placeholder="Nhập nội dung thông báo, nhắc nhở, bài tập..."
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-cyan-500 transition-all"
              />
              <div className="flex justify-end mt-3">
                <button className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_12px_rgba(0,198,255,0.25)]">
                  Đăng thông báo
                </button>
              </div>
            </div>
            <div className="text-center text-slate-500 py-12 border border-dashed border-slate-700/50 rounded-2xl">
              Chưa có bài đăng nào. Hãy đăng thông báo đầu tiên cho lớp!
            </div>
          </div>
        )}

        {/* THÀNH VIÊN */}
        {tab === "members" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Invite */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" /> Mời học sinh qua Email
              </h3>
              <form onSubmit={handleInvite} className="flex gap-3">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@truong.edu.vn"
                  className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
                >
                  {inviting ? "Đang mời..." : "Mời ngay"}
                </button>
              </form>
            </div>

            {/* Pending */}
            {classroom?.pendingStudentIds?.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
                <h3 className="text-amber-400 font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Chờ phê duyệt ({classroom.pendingStudentIds.length})
                </h3>
                <div className="space-y-3">
                  {classroom.pendingStudentIds.map((sid: string) => (
                    <div key={sid} className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold">?</div>
                        <span className="text-slate-300 text-sm font-mono">{sid}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(sid)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                        </button>
                        <button
                          onClick={() => handleReject(sid)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
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
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> Học sinh ({classroom?.studentIds?.length || 0})
              </h3>
              {(classroom?.studentIds?.length || 0) === 0 ? (
                <p className="text-slate-500 text-center py-6">Chưa có học sinh nào. Mời hoặc chờ học sinh nhập mã lớp.</p>
              ) : (
                <div className="space-y-2">
                  {classroom.studentIds.map((sid: string) => (
                    <div key={sid} className="flex items-center gap-3 px-4 py-3 bg-slate-900/40 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center text-cyan-400 text-sm font-bold">H</div>
                      <span className="text-slate-300 text-sm font-mono">{sid}</span>
                      <span className="ml-auto text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">Thành viên</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TÀI LIỆU */}
        {tab === "materials" && (
          <div className="max-w-3xl mx-auto">
            <h3 className="text-white font-semibold mb-4">Tài liệu của lớp ({materials.length})</h3>
            {materials.length === 0 ? (
              <div className="text-center text-slate-500 py-16 border border-dashed border-slate-700/50 rounded-2xl">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Chưa có tài liệu nào. Gán tài liệu từ hệ thống cho lớp này.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((m: any) => (
                  <a
                    key={m.id}
                    href={m.fileUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 bg-slate-800/40 border border-slate-700/50 rounded-xl px-5 py-4 hover:border-cyan-500/40 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate group-hover:text-cyan-400 transition-colors">{m.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{m.subject || "Chưa phân loại"}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* THẢO LUẬN */}
        {tab === "chat" && (
          <div className="max-w-3xl mx-auto">
            <div
              className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col"
              style={{ height: "calc(100vh - 290px)", minHeight: "400px" }}
            >
              <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700/50 bg-slate-900/40 shrink-0">
                <div className={`w-2 h-2 rounded-full transition-colors ${wsConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                <span className="text-xs text-slate-400">{wsConnected ? "Realtime đang kết nối" : "Đang kết nối..."}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {chatMsgs.length === 0 && (
                  <div className="text-center text-slate-500 py-10 text-sm">Chưa có tin nhắn nào. Bắt đầu thảo luận!</div>
                )}
                {chatMsgs.map((msg, i) => {
                  const isMe = msg.senderId === userRef.current?.id;
                  return (
                    <div key={msg.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2.5 ${
                        isMe
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-sm"
                          : "bg-slate-700/60 text-slate-200 rounded-bl-sm"
                      }`}>
                        {!isMe && <p className="text-xs text-cyan-300 font-medium mb-1">{msg.senderName}</p>}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-slate-700/50 bg-slate-900/40 flex gap-3 shrink-0">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder="Nhắn nhủ tới học sinh..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
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

        {/* BẢNG ĐIỂM */}
        {tab === "gradebook" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" /> Bài thi trong lớp ({exams.length})
              </h3>
              {exams.length === 0 ? (
                <div className="text-center text-slate-500 py-10">
                  <Award className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>Chưa có bài thi nào được gán cho lớp này.</p>
                  <p className="text-xs mt-1">Gán bài thi từ Kho đề để thống kê điểm số.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {exams.map((exam: any) => {
                    // Tạo phổ điểm minh họa (10 cột: 0-10)
                    const heights = Array.from({ length: 11 }, () => Math.floor(Math.random() * 90 + 5));
                    return (
                      <div key={exam.id} className="bg-slate-900/60 rounded-2xl p-5 border border-slate-700/40">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-white font-semibold">{exam.title}</h4>
                          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                            {exam.questionCount || 0} câu
                          </span>
                        </div>
                        {/* SVG Bar Chart */}
                        <div className="mt-2">
                          <div className="flex items-end gap-1.5 h-20">
                            {heights.map((h, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group/bar cursor-pointer" title={`Điểm ${i}: ${h}%`}>
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

      </div>
    </div>
  );
}
