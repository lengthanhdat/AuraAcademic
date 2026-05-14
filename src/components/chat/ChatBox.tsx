"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Loader2, Sparkles, CornerDownLeft } from "lucide-react";
import { chatApi, ChatMessage, ChatRoom } from "@/lib/chatApi";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import ReactMarkdown from "react-markdown";

export function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadBubble, setUnreadBubble] = useState(0);

  const stompClientRef = useRef<Client | null>(null);
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  // Track nội dung tin đang được gửi đi để dedup khi WS broadcast về
  const pendingSet = useRef<Set<string>>(new Set());
  const isOpenRef = useRef(false);

  // 1. Khởi tạo thông tin User & Room
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(storedUser);

    if (storedUser.id) {
      // Lấy thông tin phòng
      chatApi.getOrCreateMyRoom()
        .then((myRoom) => {
          setRoom(myRoom);
          // Lấy lịch sử ban đầu
          return chatApi.getHistory(myRoom.id);
        })
        .then((history) => {
          setMessages(history);
          // Tính toán unread count nhãn đỏ bên ngoài bubble
          const unreadCount = history.filter(m => !m.seen && m.senderRole !== 'student' && m.senderRole !== 'teacher').length;
          setUnreadBubble(unreadCount);
        })
        .catch((err) => console.error("Lỗi thiết lập ChatBox:", err));
    }
  }, []);

  // Sync isOpenRef để subscription đọc được giá trị mới nhất
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // 2. Tự động kết nối WebSocket khi Room sẵn sàng (chỉ 1 lần)
  useEffect(() => {
    if (!room?.id || stompClientRef.current) return;

    const socketUrl = chatApi.getWsUrl();
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      client.subscribe(`/topic/chat/${room.id}`, (message) => {
        const newMsg: ChatMessage = JSON.parse(message.body);

        // Nếu tin nhắn này do chính mình gửi và đang trong pending → bỏ qua (đã hiển thị optimistic)
        const pendingKey = `${newMsg.senderId}::${newMsg.content}`;
        if (pendingSet.current.has(pendingKey)) {
          pendingSet.current.delete(pendingKey);
          // Cập nhật id thực từ server vào bản optimistic cuối cùng
          setMessages(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].content === newMsg.content && !updated[i].id) {
                updated[i] = { ...updated[i], id: newMsg.id, timestamp: newMsg.timestamp };
                break;
              }
            }
            return updated;
          });
          return;
        }

        // Tin từ người khác (admin / ai / user khác) → append bình thường
        setMessages(prev => [...prev, newMsg]);

        // Badge unread khi chat box đang đóng
        if (!isOpenRef.current) {
          if (newMsg.senderRole === 'admin' || newMsg.senderRole === 'ai') {
            setUnreadBubble(prev => prev + 1);
          }
        }
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP Broker Error:", frame.headers["message"]);
      setIsConnected(false);
    };

    client.onDisconnect = () => setIsConnected(false);

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [room?.id]);

  // 3. Tự động cuộn xuống tin nhắn mới
  useEffect(() => {
    if (scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // 4. Xóa unread badge khi mở chat
  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && room?.id) {
      setUnreadBubble(0);
      chatApi.markAsRead(room.id).catch(() => {});
    }
  };

  // 5. Gửi tin nhắn qua socket
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !room?.id || !currentUser?.id) return;

    const content = inputText.trim();
    const payload: ChatMessage = {
      roomId: room.id,
      senderId: currentUser.id,
      senderName: currentUser.fullName || currentUser.name || "Người dùng",
      senderRole: currentUser.role || "student",
      content,
      seen: false,
    };

    // Track tin này đang gửi → khi WS broadcast về sẽ chỉ update id, không append thêm
    const pendingKey = `${currentUser.id}::${content}`;
    pendingSet.current.add(pendingKey);

    // Optimistic render: thêm ngay vào UI, chưa có id
    setMessages(prev => [...prev, { ...payload, timestamp: new Date().toISOString() }]);
    setInputText("");

    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(payload),
      });
    } else {
      // Nếu mất kết nối, xóa pending và báo lỗi
      pendingSet.current.delete(pendingKey);
      console.error("Mất kết nối Websocket.");
    }
  };

  if (!currentUser?.id) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-body select-none">
      {/* --- BONG BÓNG CHAT (FABB) --- */}
      {!isOpen && (
        <button
          onClick={handleToggleOpen}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00C6FF] to-[#0072FF] text-white shadow-[0_0_20px_rgba(0,198,255,0.4)] hover:shadow-[0_0_30px_rgba(0,198,255,0.6)] transition-all duration-300 active:scale-95 hover:scale-110"
        >
          <div className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping opacity-75 group-hover:animate-none"></div>
          <MessageSquare className="h-6 w-6" />
          
          {unreadBubble > 0 && (
            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-[#f8fafc] dark:ring-[#051329] animate-bounce">
              {unreadBubble > 9 ? "9+" : unreadBubble}
            </div>
          )}
        </button>
      )}

      {/* --- KHUNG CỬA SỔ CHAT (GLASSMORPHISM) --- */}
      {isOpen && (
        <div className="flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200/50 dark:border-[#00C6FF]/30 bg-white/90 dark:bg-[#051329]/95 shadow-2xl shadow-cyan-900/20 backdrop-blur-xl animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#0A1F3E] to-[#0F2950] dark:from-[#051329] dark:to-[#0A1F3E] p-4 text-white border-b border-slate-700/30">
            <div className="flex items-center space-x-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
                <Sparkles className="h-4 w-4 text-cyan-100" />
                <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0A1F3E] ${isConnected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}></span>
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-1">
                  Trợ lý AuraAcademic
                </h3>
                <p className="text-[10px] text-cyan-300 font-medium opacity-90">
                  {isConnected ? "Đang trực tuyến" : "Đang kết nối lại..."}
                </p>
              </div>
            </div>
            <button 
              onClick={handleToggleOpen} 
              className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Vùng Danh sách Tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {/* Tin chào mừng */}
            <div className="flex items-start space-x-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0F2950] text-cyan-400 border border-cyan-500/20 text-[10px] font-bold shadow-sm">
                AI
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-slate-100 dark:bg-[#0A1F3E]/60 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-cyan-900/20 shadow-sm">
                Xin chào <strong>{currentUser.fullName || "bạn"}</strong>! Tôi là Trợ lý Trí tuệ nhân tạo được tích hợp sẵn. Nếu bạn có bất kỳ thắc mắc học thuật hay kỹ thuật nào, hãy gửi tin ngay để tôi hỗ trợ nhé! 🚀🌌
              </div>
            </div>

            {messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUser.id;
              const isAi = msg.senderRole === 'ai';
              
              return (
                <div key={idx} className={`flex items-start space-x-2 ${isMe ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
                  {/* Icon Đại diện (nếu không phải bản thân) */}
                  {!isMe && (
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border shadow-sm ${
                      isAi 
                        ? "bg-[#00C6FF]/10 text-[#00C6FF] border-[#00C6FF]/30" 
                        : "bg-blue-950 text-blue-400 border-blue-800/50"
                    }`}>
                      {isAi ? "AI" : "AD"}
                    </div>
                  )}

                  {/* Khung tin nhắn */}
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm border transition-all duration-200 ${
                    isMe 
                      ? "bg-gradient-to-br from-[#0072FF] to-[#00C6FF] text-white border-[#00C6FF]/20 rounded-tr-none" 
                      : isAi
                        ? "bg-[#0A1F3E] text-slate-200 border-[#00C6FF]/20 rounded-tl-none dark:text-cyan-50/90 shadow-[0_2px_10px_rgba(0,198,255,0.05)]"
                        : "bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200/50 dark:border-slate-700/40 rounded-tl-none"
                  }`}>
                    {/* Nếu là AI thì render Markdown bóng bẩy */}
                    {isAi ? (
                      <div className="prose prose-invert prose-xs max-w-none text-xs leading-relaxed break-words prose-strong:text-[#00C6FF] prose-p:my-0.5">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="break-words whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    )}
                    
                    {/* Label "Được AI phản hồi" tinh tế */}
                    {isAi && idx === messages.length - 1 && (
                      <div className="mt-1.5 flex items-center text-[9px] text-cyan-400/70 italic font-medium border-t border-cyan-900/30 pt-1">
                        <Sparkles className="mr-1 h-2.5 w-2.5 text-cyan-400" />
                        Phản hồi tự động bởi AI
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Element ẩn để cuộn xuống */}
            <div ref={scrollBottomRef} />
          </div>

          {/* Input Toolbar */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0A1F3E]/40 p-3 flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Nhập nội dung câu hỏi..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={!isConnected}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#051329] px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 dark:focus:border-[#00C6FF]/60 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-60 pr-8"
              />
              <CornerDownLeft className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-400 dark:text-slate-600 hidden sm:block" />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || !isConnected}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00C6FF] to-[#0072FF] text-white shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-95 transition-all disabled:from-slate-400 disabled:to-slate-500 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
