"use client";

import React, { useState, useEffect, useRef } from "react";
import { chatApi, ChatRoom, ChatMessage } from "@/lib/chatApi";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Search, Send, Sparkles, MessageSquare, CheckCheck, Loader2, Bot, User as UserIcon, CornerDownLeft, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AdminChatDashboard() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isTogglingAi, setIsTogglingAi] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const stompClientRef = useRef<Client | null>(null);
  const messageSubRef = useRef<any>(null);
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);

  // 1. Load Admin Info & Initial Data (Rooms list + AI Status)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      setCurrentUser(u);
    } catch (e) {}

    // Load initial state
    loadAllRooms();
    
    chatApi.getAiStatus()
      .then(status => setAiEnabled(status.enabled))
      .catch(err => console.error("Lỗi tải cấu hình AI:", err));
  }, []);

  const loadAllRooms = () => {
    setIsLoadingRooms(true);
    chatApi.getAllRooms()
      .then(data => setRooms(data))
      .catch(err => console.error("Lỗi lấy danh sách phòng:", err))
      .finally(() => setIsLoadingRooms(false));
  };

  // 2. Thiết lập kết nối WebSocket toàn cục cho Admin (Lắng nghe cập nhật Hàng chờ Phòng)
  useEffect(() => {
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
      
      // Lắng nghe kênh '/topic/rooms' để nhận cập nhật nóng hàng đợi mỗi khi có tin nhắn mới từ bất kỳ phòng nào!
      client.subscribe("/topic/rooms", (message) => {
        const updatedRooms: ChatRoom[] = JSON.parse(message.body);
        setRooms(updatedRooms);
      });
    };

    client.onDisconnect = () => setIsConnected(false);
    client.onStompError = () => setIsConnected(false);

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, []);

  // 3. Lắng nghe tin nhắn trong phòng CHỈ ĐỊNH (khi admin chọn chat với ai đó)
  useEffect(() => {
    // Hủy đăng ký kênh của phòng cũ (nếu có) để tránh rò rỉ bộ nhớ
    if (messageSubRef.current) {
      messageSubRef.current.unsubscribe();
      messageSubRef.current = null;
    }

    if (!activeRoomId || !stompClientRef.current?.connected) return;

    // Subscribe lắng nghe tin nhắn của phòng cụ thể đang mở
    const sub = stompClientRef.current.subscribe(`/topic/chat/${activeRoomId}`, (message) => {
      const newMsg: ChatMessage = JSON.parse(message.body);
      
      setMessages((prev) => {
        const isDuplicate = prev.some(m => m.id === newMsg.id || (m.content === newMsg.content && m.timestamp === newMsg.timestamp));
        if (isDuplicate) return prev;
        return [...prev, newMsg];
      });
      
      // Tự động đánh dấu đã đọc (seen = true) vì Admin đang mở màn hình này
      chatApi.markAsRead(activeRoomId).catch(() => {});
    });

    messageSubRef.current = sub;
  }, [activeRoomId, isConnected]);

  // Tự động cuộn xuống cuối khi có tin mới
  useEffect(() => {
    if (scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 4. Sự kiện Click Chọn phòng chat cụ thể
  const handleSelectRoom = (room: ChatRoom) => {
    setActiveRoomId(room.id);
    setIsLoadingHistory(true);
    
    // Reset badge unread ảo cục bộ trên giao diện trước cho mượt
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unreadCount: 0 } : r));

    chatApi.getHistory(room.id)
      .then(history => {
        setMessages(history);
        return chatApi.markAsRead(room.id);
      })
      .catch(err => console.error("Lỗi tải lịch sử:", err))
      .finally(() => setIsLoadingHistory(false));
  };

  // 5. Gửi tin nhắn phản hồi từ Admin
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeRoomId || !currentUser?.id) return;

    const payload: ChatMessage = {
      roomId: activeRoomId,
      senderId: currentUser.id,
      senderName: currentUser.fullName || currentUser.name || "Admin",
      senderRole: "admin",
      content: inputText.trim(),
      seen: true
    };

    // Optimistic rendering UI
    const optMsg: ChatMessage = {
      ...payload,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, optMsg]);
    setInputText("");

    // Dispatch command qua WebSocket
    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(payload),
      });
    }
  };

  // 6. Gạt Switch Bật/Tắt AI Tự Động Phản Hồi
  const handleToggleAi = async () => {
    if (isTogglingAi) return;
    setIsTogglingAi(true);
    try {
      const targetState = !aiEnabled;
      const res = await chatApi.toggleAiStatus(targetState);
      setAiEnabled(res.enabled);
    } catch (err) {
      console.error("Không thể cấu hình AI:", err);
    } finally {
      setIsTogglingAi(false);
    }
  };

  // Bộ lọc tìm kiếm phòng chat theo tên user
  const filteredRooms = rooms.filter(r => 
    r.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.userRole?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lấy thông tin phòng đang hoạt động
  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-80px)] bg-slate-50/50 dark:bg-[#051329] p-6 md:p-8 transition-colors duration-300 font-body overflow-hidden select-none">
      
      {/* --- TIÊU ĐỀ TRANG + AI SWITCH BAR --- */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#00C6FF] to-[#0072FF] shadow-[0_4px_20px_rgba(0,198,255,0.3)] flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#0C2E5E] dark:text-[#E2E8F0]">
              Trung tâm Hỗ trợ <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C6FF] to-[#0072FF]">Trực tuyến</span>
            </h1>
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-12">
            Phản hồi & Giải đáp câu hỏi Realtime
          </p>
        </div>

        {/* AI AUTOPILOT MODULE */}
        <div className="flex items-center space-x-4 rounded-2xl bg-white dark:bg-[#0A1F3E]/90 backdrop-blur-md border border-slate-200 dark:border-cyan-950/40 px-5 py-3.5 shadow-sm border-l-4 border-l-cyan-400">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${aiEnabled ? "bg-cyan-500/10 text-cyan-400 animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#0C2E5E] dark:text-[#E2E8F0] tracking-wide flex items-center gap-1">
                AI Tự động trả lời 
                {aiEnabled && <Sparkles className="h-3 w-3 text-cyan-400" />}
              </h4>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {aiEnabled ? "Mô hình Gemini 2.5 & Groq đang trực" : "Đã tạm dừng hoạt động tự động"}
              </p>
            </div>
          </div>
          
          {/* Custom Glowing Toggle Switch */}
          <button
            onClick={handleToggleAi}
            disabled={isTogglingAi}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 outline-none ring-0 ${
              aiEnabled 
                ? "bg-gradient-to-r from-[#00C6FF] to-[#0072FF] shadow-[0_0_15px_rgba(0,198,255,0.4)]" 
                : "bg-slate-200 dark:bg-slate-800"
            } ${isTogglingAi ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 shadow-md ${
              aiEnabled ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
      </div>

      {/* --- KHU VỰC LÀM VIỆC CHÍNH (SPLIT SCREEN) --- */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* ─── CỘT TRÁI: DANH SÁCH HÀNG CHỜ PHÒNG CHAT (SIDEBAR) ─── */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-[#0A1F3E]/95 backdrop-blur-md border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl shadow-sm overflow-hidden shrink-0">
          
          {/* Thanh tìm kiếm và làm mới */}
          <div className="p-4 border-b border-slate-100 dark:border-cyan-950/30 flex items-center gap-2 bg-slate-50/30 dark:bg-[#0F2950]/10 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên người dùng hoặc vai trò..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl py-2 pl-9 pr-4 text-xs text-[#0C2E5E] dark:text-[#E2E8F0] placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/10 transition-all font-semibold"
              />
            </div>
            <button 
              onClick={loadAllRooms} 
              className="p-2 bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl text-slate-400 hover:text-cyan-500 transition-all"
              title="Làm mới hàng chờ"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingRooms ? "animate-spin text-cyan-500" : ""}`} />
            </button>
          </div>

          {/* Cuộn danh sách các Room */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-cyan-950/60">
            {isLoadingRooms ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Đang kết nối MongoDB...</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center px-4 space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-[#0F2950]/30 flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400">Không có phòng chat nào</h4>
                  <p className="text-[10px] font-medium text-slate-400 mt-1">Chờ phản hồi đầu tiên từ người dùng hệ thống.</p>
                </div>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isActive = room.id === activeRoomId;
                const roleColor = room.userRole === "teacher" 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                  : "bg-blue-500/10 text-blue-500 border-blue-500/20";
                
                return (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3 group active:scale-[0.99] ${
                      isActive
                        ? "bg-gradient-to-br from-[#00C6FF]/10 to-transparent border-cyan-500/40 shadow-sm shadow-cyan-500/5 dark:from-[#00C6FF]/5"
                        : "bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200 dark:hover:bg-[#0F2950]/20 dark:hover:border-cyan-950/20"
                    }`}
                  >
                    {/* Avatar Giả lập */}
                    <div className="relative shrink-0">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm border ${
                        isActive ? "bg-cyan-500 text-white border-cyan-400/50" : "bg-slate-100 dark:bg-[#051329] text-slate-400 dark:text-cyan-500/60 border-slate-200 dark:border-cyan-950/30 group-hover:scale-105 transition-transform"
                      }`}>
                        <UserIcon className="h-5 w-5" />
                      </div>
                      {/* Nhãn trạng thái online (Giả định online) */}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 border-2 border-white dark:border-[#0A1F3E] rounded-full"></span>
                    </div>

                    {/* Meta content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-xs font-black truncate ${isActive ? "text-[#00C6FF]" : "text-[#0C2E5E] dark:text-[#E2E8F0]"}`}>
                          {room.userName || "Thành viên Aura"}
                        </h3>
                        {room.lastMessageTime && (
                          <span className="text-[9px] font-bold text-slate-400 tracking-tight uppercase">
                            {new Date(room.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[9px] font-extrabold tracking-widest uppercase px-1.5 py-0.5 rounded border ${roleColor}`}>
                          {room.userRole === "teacher" ? "Giảng viên" : "Học sinh"}
                        </span>
                      </div>

                      <p className={`text-xs truncate leading-relaxed ${
                        room.unreadCount > 0 ? "font-bold text-[#0C2E5E] dark:text-cyan-100" : "text-slate-400 font-medium"
                      }`}>
                        {room.lastMessage || "Bắt đầu trò chuyện..."}
                      </p>
                    </div>

                    {/* Số tin nhắn chưa đọc */}
                    {room.unreadCount > 0 && (
                      <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white animate-pulse">
                        {room.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── CỘT PHẢI: CHI TIẾT NỘI DUNG PHÒNG CHAT (MESSENGER WINDOW) ─── */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0A1F3E]/95 backdrop-blur-md border border-slate-200/50 dark:border-cyan-950/40 rounded-2xl shadow-sm overflow-hidden min-w-0">
          
          {activeRoomId ? (
            <>
              {/* HEADER KHUNG CHAT ĐANG CHỌN */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-cyan-950/30 bg-slate-50/30 dark:bg-[#0F2950]/10 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00C6FF]/20 to-[#0072FF]/20 border border-[#00C6FF]/30 text-[#00C6FF] flex items-center justify-center shadow-sm">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#0C2E5E] dark:text-[#E2E8F0] flex items-center gap-2">
                      {activeRoom?.userName}
                      <span className="h-2 w-2 bg-emerald-400 rounded-full"></span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">
                      ID Phòng: <span className="text-cyan-600/80 dark:text-cyan-500/80">{activeRoom?.id?.substring(0,8)}...</span>
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-black text-cyan-600 dark:text-[#00C6FF] bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400 animate-ping"}`}></span>
                  {isConnected ? "CỔNG KẾT NỐI LIVE" : "ĐANG KẾT NỐI LẠI"}
                </div>
              </div>

              {/* VÙNG NỘI DUNG TIN NHẮN CHAT */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 dark:bg-[#051329]/30 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-cyan-950/60">
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                    <p className="text-xs font-bold tracking-widest uppercase animate-pulse">Tải lại lịch sử hội thoại...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3 text-slate-400 italic">
                    <p className="text-sm font-medium">Chưa có lịch sử trò chuyện nào trong phòng này.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderRole === "admin";
                    const isAi = msg.senderRole === "ai";
                    
                    return (
                      <div key={idx} className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : "flex-row animate-slideIn"}`}>
                        {/* Avatar Người gửi */}
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black border shrink-0 shadow-sm ${
                          isMe 
                            ? "bg-[#0C2E5E] text-[#00C6FF] border-cyan-700/30" 
                            : isAi
                              ? "bg-[#0F2950] text-cyan-400 border-cyan-500/30"
                              : "bg-slate-100 dark:bg-[#0A1F3E] text-slate-400 border-slate-200 dark:border-cyan-950/50"
                        }`}>
                          {isMe ? "AD" : isAi ? "AI" : "US"}
                        </div>

                        {/* Khối hộp tin nhắn */}
                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                          {/* Tên & Giờ */}
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                              {isAi ? "Trợ lý AI Hệ thống" : msg.senderName}
                            </span>
                            {msg.timestamp && (
                              <span className="text-[9px] text-slate-400/70 font-medium">
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              </span>
                            )}
                          </div>

                          {/* Bóng tin nhắn */}
                          <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm border leading-relaxed transition-all duration-300 ${
                            isMe
                              ? "bg-gradient-to-br from-[#0C2E5E] to-[#0F2950] text-white border-cyan-700/40 rounded-tr-none dark:from-[#0A1F3E] dark:to-[#0F2950] dark:border-[#00C6FF]/20 shadow-md shadow-[#0C2E5E]/5"
                              : isAi
                                ? "bg-[#0F2950]/80 text-slate-200 border-cyan-500/30 rounded-tl-none"
                                : "bg-white dark:bg-[#0A1F3E]/40 text-[#0C2E5E] dark:text-slate-200 border-slate-200/50 dark:border-cyan-950/30 rounded-tl-none"
                          }`}>
                            {isAi ? (
                              <div className="prose prose-invert prose-sm max-w-none prose-p:my-0.5 prose-strong:text-cyan-400 text-cyan-50/90 break-words leading-relaxed text-xs sm:text-sm">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words font-medium text-xs sm:text-sm">{msg.content}</p>
                            )}
                          </div>

                          {/* Cờ trạng thái Seen */}
                          {isMe && idx === messages.length - 1 && (
                            <div className="flex items-center gap-1 mt-1 text-[#00C6FF] dark:text-[#00C6FF]/80 text-[10px] font-bold tracking-wide px-1 animate-pulse">
                              <CheckCheck className="h-3.5 w-3.5" />
                              ĐÃ GỬI LIVE
                            </div>
                          )}
                          
                          {isAi && (
                            <div className="flex items-center gap-1 mt-1 text-cyan-400 text-[9px] italic font-bold px-1">
                              <Sparkles className="h-2.5 w-2.5 animate-spin-slow" />
                              Cổng trả lời tự động AI phát hành
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollBottomRef} />
              </div>

              {/* THANH NHẬP TIN NHẮN ĐƯỜNG CUỐI */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-cyan-950/30 bg-slate-50/30 dark:bg-[#0F2950]/10 flex items-center gap-3 shrink-0">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={`Nhập nội dung phản hồi cho ${activeRoom?.userName || 'người dùng'}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={!isConnected}
                    className="w-full bg-white dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl py-3 px-4 pr-10 text-xs sm:text-sm text-[#0C2E5E] dark:text-[#E2E8F0] placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/10 transition-all font-bold disabled:opacity-60 shadow-sm"
                  />
                  <CornerDownLeft className="absolute right-3 top-3.5 h-4 w-4 text-slate-300 dark:text-slate-600 hidden sm:block" />
                </div>
                <button
                  type="submit"
                  disabled={!inputText.trim() || !isConnected}
                  className="h-11 w-11 sm:h-12 sm:px-6 rounded-xl bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] border-l-4 border-l-[#00C6FF] text-white font-black text-xs uppercase tracking-wider hover:shadow-lg transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Gửi</span>
                </button>
              </form>
            </>
          ) : (
            /* GIAO DIỆN LÚC CHƯA CHỌN PHÒNG NÀO */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-4">
              <div className="h-20 w-20 rounded-full bg-[#0F2950]/20 dark:bg-[#0A1F3E] border border-cyan-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,198,255,0.05)]">
                <MessageSquare className="h-9 w-9 text-cyan-500/60 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0C2E5E] dark:text-[#E2E8F0] mb-1">Hãy chọn một phòng chat</h3>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                  Chọn tài khoản người dùng từ hàng chờ phía bên trái để bắt đầu phản hồi trực tiếp hoặc hỗ trợ thủ công.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
