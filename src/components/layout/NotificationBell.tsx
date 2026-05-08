"use client";

import { useEffect, useState, useRef } from "react";

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  read: boolean;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRead, setFilterRead] = useState("all");

  // Pagination states
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get auth token safely
  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("accessToken") || "";
  };

  // Fetch paginated & filtered notifications list
  const fetchNotifications = async (resetPage = false) => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const targetPage = resetPage ? 0 : page;
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: "10",
        type: filterType,
        readState: filterRead,
        query: searchQuery,
      });

      const res = await fetch(`http://localhost:8088/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (resetPage) {
          setNotifications(data.items);
          setPage(1);
        } else {
          setNotifications(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const uniqueNewItems = data.items.filter((item: NotificationItem) => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          });
          setPage(prev => prev + 1);
        }
        setUnreadCount(data.unreadCount);
        setTotalItems(data.totalItems);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch on filter change
  useEffect(() => {
    fetchNotifications(true);
  }, [filterType, filterRead]);

  // Subscribe to real-time notification push (SSE)
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const eventSource = new EventSource(`http://localhost:8088/api/notifications/stream?token=${token}`);

    eventSource.addEventListener("NOTIFICATION", (event: any) => {
      try {
        const newNotif: NotificationItem = JSON.parse(event.data);
        
        // Prepend new notification to the active display list
        setNotifications(prev => {
          if (prev.some(item => item.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount(prev => prev + 1);
        setTotalItems(prev => prev + 1);

        // Show a temporary in-app audio-visual alert or toast if possible
        if ("Notification" in window && Notification.permission === "granted") {
          new window.Notification(newNotif.title, { body: newNotif.content });
        }
      } catch (err) {
        console.error("Error parsing real-time notification:", err);
      }
    });

    eventSource.onerror = () => {
      // Auto-reconnect managed by EventSource
    };

    // Request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      eventSource.close();
    };
  }, []);

  // Handle outside clicks to close the dropdown panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8088/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(item => (item.id === id ? { ...item, read: true } : item))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Error marking read:", e);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8088/api/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(item => ({ ...item, read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error("Error marking all read:", e);
    }
  };

  // Delete a notification
  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering markAsRead on parent click
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8088/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(item => item.id !== id));
        setTotalItems(prev => Math.max(0, prev - 1));
        // Recalculate unread count
        fetchNotifications(true);
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Map type to icons & colors beautifully
  const getNotifMeta = (type: string) => {
    switch (type?.toUpperCase()) {
      case "SYSTEM":
        return { icon: "lock_open", color: "text-rose-500 bg-rose-50 border-rose-100" };
      case "EXAM":
        return { icon: "quiz", color: "text-purple-500 bg-purple-50 border-purple-100" };
      case "MATERIAL":
        return { icon: "library_books", color: "text-emerald-500 bg-emerald-50 border-emerald-100" };
      case "WARNING":
        return { icon: "warning", color: "text-amber-500 bg-amber-50 border-amber-100" };
      default:
        return { icon: "info", color: "text-blue-500 bg-blue-50 border-blue-100" };
    }
  };

  // Safe date formatter helper (Native, dependency-free relative time)
  const formatTime = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      if (diffMs < 0) return "Vừa xong";

      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Hôm qua";
      if (diffDays < 30) return `${diffDays} ngày trước`;

      return date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });
    } catch {
      return "Vừa xong";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-on-surface-variant hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors duration-200 outline-none"
      >
        <span className="material-symbols-outlined text-2xl flex items-center justify-center">
          {unreadCount > 0 ? "notifications_active" : "notifications"}
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 sm:right-0 mt-3 w-screen max-w-[360px] sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 flex flex-col overflow-hidden max-h-[550px] animate-slide-up">
          <style>{`
            @keyframes slide-up {
              from { transform: translateY(10px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            .animate-slide-up {
              animation: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
          `}</style>

          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-headline font-black text-[#00355f] text-sm tracking-tight">Thông báo</h3>
              <p className="text-[10px] text-slate-500 font-medium">Bạn có {unreadCount} thông báo chưa đọc</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-[#0f4c81] hover:underline"
              >
                Đánh dấu đọc tất cả
              </button>
            )}
          </div>

          {/* Search and Filters Section */}
          <div className="p-3 bg-slate-50/30 border-b border-slate-100 space-y-2">
            {/* Search Input */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-[#00355f]/15 transition-all">
              <span className="material-symbols-outlined text-slate-400 text-base">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchNotifications(true)}
                placeholder="Tìm kiếm thông báo..."
                className="w-full bg-transparent border-none text-xs text-slate-700 placeholder-slate-400 focus:ring-0 outline-none px-1.5"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); fetchNotifications(true); }} className="material-symbols-outlined text-slate-400 text-sm">close</button>
              )}
            </div>

            {/* Select Filters */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 outline-none"
              >
                <option value="all">Tất cả loại</option>
                <option value="SYSTEM">Hệ thống</option>
                <option value="EXAM">Kỳ thi</option>
                <option value="MATERIAL">Tài liệu</option>
                <option value="WARNING">Cảnh báo</option>
              </select>

              <select
                value={filterRead}
                onChange={e => setFilterRead(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="unread">Chưa đọc</option>
                <option value="read">Đã đọc</option>
              </select>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[300px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">notifications_off</span>
                <p className="text-xs text-slate-400 font-medium">Không tìm thấy thông báo nào</p>
              </div>
            ) : (
              notifications.map(item => {
                const meta = getNotifMeta(item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-4 flex gap-3 transition-colors duration-200 cursor-pointer ${
                      item.read ? "bg-white hover:bg-slate-50/50" : "bg-blue-50/20 hover:bg-blue-50/40"
                    }`}
                  >
                    {/* Icon container */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${meta.color}`}>
                      <span className="material-symbols-outlined text-lg">{meta.icon}</span>
                    </div>

                    {/* Text contents */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs tracking-tight leading-snug truncate ${item.read ? "text-slate-700 font-semibold" : "text-[#00355f] font-black"}`}>
                          {item.title}
                        </p>
                        {!item.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed break-words line-clamp-2">
                        {item.content}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        {formatTime(item.createdAt)}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={e => deleteNotification(item.id, e)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded-lg self-center opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer - Load More */}
          {notifications.length < totalItems && (
            <button
              onClick={() => fetchNotifications()}
              disabled={loading}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-center text-xs font-bold text-[#00355f] border-t border-slate-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {loading ? (
                <span>Đang tải...</span>
              ) : (
                <>
                  <span>Xem thêm</span>
                  <span className="material-symbols-outlined text-xs">expand_more</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
