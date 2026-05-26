"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { toast } from "sonner";
import { classroomApi } from "@/lib/classroomApi";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  ArrowLeft, BookOpen, MessageSquare, FileText,
  Send, Radio, ChevronRight, PlayCircle, Trophy, Clock
} from "lucide-react";

type Tab = "timeline" | "materials" | "exams" | "chat";

interface ClassroomMsg {
  id?: string;
  classroomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp?: string;
}

// Embedded exam state interface removed

export default function StudentClassroomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.id as string;

  const [tab, setTab] = useState<Tab>("timeline");
  const [data, setData] = useState<{ classroom: any; exams: any[]; materials: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    router.push(`/student/lobby?code=${exam.accessCode}`);
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
    { key: "timeline",  label: "Bảng tin",   icon: <Radio className="w-4 h-4" /> },
    { key: "materials", label: "Tài liệu",   icon: <BookOpen className="w-4 h-4" /> },
    { key: "exams",     label: "Bài thi",    icon: <Trophy className="w-4 h-4" />, badge: exams.length },
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
          <div className="max-w-2xl mx-auto">
            <div className="text-center text-slate-500 py-16 border border-dashed border-slate-700/50 rounded-2xl">
              <Radio className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>Chưa có thông báo nào từ giáo viên.</p>
            </div>
          </div>
        )}

        {/* TÀI LIỆU */}
        {tab === "materials" && (
          <div className="max-w-3xl mx-auto">
            <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-4">Tài liệu học tập ({materials.length})</h3>
            {materials.length === 0 ? (
              <div className="text-center text-slate-400 dark:text-slate-500 py-12 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>Giáo viên chưa chia sẻ tài liệu nào.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((m: any) => (
                  <a
                    key={m.id}
                    href={m.fileUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-slate-700/50 rounded-xl px-5 py-4 hover:border-cyan-500/40 transition-all shadow-sm group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-white font-medium truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{m.title}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{m.subject || "Tài liệu"}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BÀI THI */}
        {tab === "exams" && (
          <div className="max-w-3xl mx-auto">
            <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-4">Bài thi được giao ({exams.length})</h3>
            {exams.length === 0 ? (
              <div className="text-center text-slate-400 dark:text-slate-500 py-12 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>Giáo viên chưa giao bài thi nào.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exams.map((exam: any) => (
                  <div key={exam.id} className="bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 hover:border-cyan-500/30 dark:hover:border-cyan-500/30 transition-all shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-slate-850 dark:text-white font-bold text-lg">{exam.title}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-2 leading-relaxed">{exam.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                          <span className="text-slate-500 dark:text-slate-400">
                            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{exam.questionCount ?? exam.questions?.length ?? 0}</span> câu hỏi
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{exam.duration ?? 60}</span> phút
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => startExam(exam)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_12px_rgba(0,198,255,0.25)] text-sm shrink-0"
                      >
                        <PlayCircle className="w-4 h-4" /> Làm bài
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    <div key={msg.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2.5 ${
                        isMe
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-sm"
                          : isTeacher
                          ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-white rounded-bl-sm"
                          : "bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                      }`}>
                        {!isMe && (
                          <p className={`text-xs font-bold mb-1 ${isTeacher ? "text-amber-600 dark:text-amber-400" : "text-cyan-600 dark:text-cyan-300"}`}>
                            {isTeacher ? "👨‍🏫 " : ""}{msg.senderName}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
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
