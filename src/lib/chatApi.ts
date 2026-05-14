// Centralized API utility for Chat operations
const BASE = "http://localhost:8088";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Lỗi kết nối" }));
    throw new Error(err.error || err.message || "Lỗi hệ thống Chat");
  }
  return res.json();
}

export interface ChatRoom {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id?: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'teacher' | 'admin' | 'ai';
  content: string;
  timestamp?: string;
  seen: boolean;
}

export const chatApi = {
  /** Lấy danh sách tất cả phòng chat đang mở (Dành cho Admin) */
  getAllRooms: () => apiFetch<ChatRoom[]>("/api/chat/rooms"),

  /** Lấy toàn bộ lịch sử tin nhắn theo ID phòng */
  getHistory: (roomId: string) => apiFetch<ChatMessage[]>(`/api/chat/history/${roomId}`),

  /** Lấy thông tin phòng chat cá nhân hoặc tự tạo mới nếu lần đầu click */
  getOrCreateMyRoom: () => apiFetch<ChatRoom>("/api/chat/my-room"),

  /** Đánh dấu đã đọc toàn bộ nội dung tin nhắn trong phòng */
  markAsRead: (roomId: string) => apiFetch<{ success: boolean; updated: boolean }>(`/api/chat/read/${roomId}`, { method: "POST" }),

  /** Lấy trạng thái hoạt động hiện tại của AI Auto-responder */
  getAiStatus: () => apiFetch<{ enabled: boolean }>("/api/chat/ai/status"),

  /** Kích hoạt gạt switch bật/tắt chế độ AI trả lời tự động (Admin Only) */
  toggleAiStatus: (enabled?: boolean) => apiFetch<{ success: boolean; enabled: boolean }>("/api/chat/ai/toggle", {
    method: "POST",
    body: JSON.stringify(enabled !== undefined ? { enabled } : {}),
  }),

  /** Trả về BASE URL cho socket handshake */
  getWsUrl: () => `${BASE}/ws`,
};
