"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("NotificationBell");
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/notifications?${params}`, {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterRead]);

  // Subscribe to real-time notification push (SSE)
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/notifications/stream?token=${token}`);

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

        // Show a Toast notification instantly using sonner
        toast.success(newNotif.title, {
          description: newNotif.content,
          action: {
            label: t("view"),
            onClick: () => {
              const path = window.location.pathname;
              const matches = path.match(/^\/([a-z]{2})\/(admin|teacher|student)/);
              if (matches) {
                const [, locale, role] = matches;
                window.location.href = `/${locale}/${role}/notifications`;
              } else {
                window.location.href = "/notifications";
              }
            }
          }
        });

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/notifications/${id}/read`, {
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
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/notifications/read-all", {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/notifications/${id}`, {
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
      case "WELCOME":
        return { icon: "waving_hand", color: "text-sky-600 bg-sky-50 border-sky-100 shadow-sky-100 dark:text-cyan-200 dark:bg-cyan-500/10 dark:border-cyan-400/25 dark:shadow-cyan-950/30" };
      case "VERIFICATION_APPROVED":
        return { icon: "verified", color: "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100 dark:text-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-400/25 dark:shadow-emerald-950/30" };
      case "VERIFICATION_REJECTED":
        return { icon: "gpp_bad", color: "text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100 dark:text-rose-200 dark:bg-rose-500/10 dark:border-rose-400/25 dark:shadow-rose-950/30" };
      case "CLASSROOM":
      case "CLASSROOM_JOIN_REQUEST":
      case "CLASSROOM_MEMBER_ADDED":
      case "CLASSROOM_MEMBER_REMOVED":
        return { icon: "groups", color: "text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-100 dark:text-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-400/25 dark:shadow-indigo-950/30" };
      case "SYSTEM":
        return { icon: "settings_suggest", color: "text-slate-600 bg-slate-50 border-slate-200 shadow-slate-100 dark:text-slate-200 dark:bg-slate-500/10 dark:border-slate-400/20 dark:shadow-slate-950/30" };
      case "EXAM":
      case "EXAM_ASSIGNED":
      case "EXAM_RESULT":
        // Purple Ban: replaced violet with blue
        return { icon: "assignment", color: "text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100 dark:text-blue-200 dark:bg-blue-500/10 dark:border-blue-400/25 dark:shadow-blue-950/30" };
      case "MATERIAL":
      case "MATERIAL_APPROVED":
      case "MATERIAL_REJECTED":
        return { icon: "library_books", color: "text-teal-600 bg-teal-50 border-teal-100 shadow-teal-100 dark:text-teal-200 dark:bg-teal-500/10 dark:border-teal-400/25 dark:shadow-teal-950/30" };
      case "WARNING":
        return { icon: "warning", color: "text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100 dark:text-amber-200 dark:bg-amber-500/10 dark:border-amber-400/25 dark:shadow-amber-950/30" };
      default:
        return { icon: "info", color: "text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100 dark:text-cyan-200 dark:bg-cyan-500/10 dark:border-cyan-400/25 dark:shadow-cyan-950/30" };
    }
  };

  // Safe date formatter helper (Native, dependency-free relative time)
  const formatTime = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      if (diffMs < 0) return t("time.just_now");

      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return t("time.just_now");
      if (diffMins < 60) return t("time.minutes_ago", { count: diffMins });

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return t("time.hours_ago", { count: diffHours });

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return t("time.yesterday");
      if (diffDays < 30) return t("time.days_ago", { count: diffDays });

      return date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });
    } catch {
      return t("time.just_now");
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
        <div className="absolute right-0 sm:right-0 mt-3 w-screen max-w-[360px] sm:w-[400px] rounded-2xl border border-slate-100 bg-white shadow-2xl z-50 flex flex-col overflow-hidden max-h-[550px] animate-slide-up dark:border-cyan-900/50 dark:bg-[#071829] dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
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
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 dark:border-cyan-900/40 dark:bg-[#0A1F3E]">
            <div>
              <h3 className="font-headline font-black text-[#00355f] text-sm tracking-tight dark:text-cyan-100">{t("title")}</h3>
              <p className="text-[10px] text-slate-500 font-medium dark:text-slate-400">{t("unread_count", { count: unreadCount })}</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-[#0f4c81] hover:underline dark:text-cyan-300"
              >
                {t("mark_all_read")}
              </button>
            )}
          </div>

          {/* Search and Filters Section */}
          <div className="p-3 bg-slate-50/30 border-b border-slate-100 space-y-2 dark:border-cyan-900/40 dark:bg-[#061326]">
            {/* Search Input */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-[#00355f]/15 transition-all dark:border-cyan-900/50 dark:bg-[#0A1F3E] dark:focus-within:border-cyan-500/60 dark:focus-within:ring-cyan-500/15">
              <span className="material-symbols-outlined text-slate-400 text-base dark:text-slate-500">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchNotifications(true)}
                placeholder={t("search_placeholder")}
                className="w-full bg-transparent border-none text-xs text-slate-700 placeholder-slate-400 focus:ring-0 outline-none px-1.5 dark:text-slate-100 dark:placeholder-slate-500"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); fetchNotifications(true); }} className="material-symbols-outlined text-slate-400 text-sm hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200">close</button>
              )}
            </div>

            {/* Select Filters */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 outline-none dark:border-cyan-900/50 dark:bg-[#0A1F3E] dark:text-slate-200"
              >
                <option value="all">{t("types.all")}</option>
                <option value="WELCOME">{t("types.welcome")}</option>
                <option value="SYSTEM">{t("types.system")}</option>
                <option value="EXAM">{t("types.exam")}</option>
                <option value="MATERIAL">{t("types.material")}</option>
                <option value="CLASSROOM">{t("types.classroom")}</option>
                <option value="WARNING">{t("types.warning")}</option>
              </select>

              <select
                value={filterRead}
                onChange={e => setFilterRead(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 outline-none dark:border-cyan-900/50 dark:bg-[#0A1F3E] dark:text-slate-200"
              >
                <option value="all">{t("states.all")}</option>
                <option value="unread">{t("states.unread")}</option>
                <option value="read">{t("states.read")}</option>
              </select>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[300px] dark:divide-cyan-950/50 dark:bg-[#071829]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-slate-300 text-4xl mb-2 dark:text-slate-600">notifications_off</span>
                <p className="text-xs text-slate-400 font-medium dark:text-slate-500">{t("empty")}</p>
              </div>
            ) : (
              notifications.map(item => {
                const meta = getNotifMeta(item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-4 flex gap-3 transition-colors duration-200 cursor-pointer group ${
                      item.read
                        ? "bg-white hover:bg-slate-50/50 dark:bg-[#071829] dark:hover:bg-[#0A1F3E]"
                        : "bg-blue-50/20 hover:bg-blue-50/40 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/15"
                    }`}
                  >
                    {/* Icon container */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 shadow-sm ring-1 ring-white/70 dark:ring-white/5 ${meta.color}`}>
                      <span className="material-symbols-outlined text-lg">{meta.icon}</span>
                    </div>

                    {/* Text contents */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs tracking-tight leading-snug truncate ${item.read ? "text-slate-700 font-semibold dark:text-slate-300" : "text-[#00355f] font-black dark:text-cyan-100"}`}>
                          {item.title}
                        </p>
                        {!item.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5 dark:bg-cyan-400" />}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed break-words line-clamp-2 dark:text-slate-400">
                        {item.content}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium dark:text-slate-500">
                        {formatTime(item.createdAt)}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={e => deleteNotification(item.id, e)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded-lg self-center opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity dark:text-slate-600 dark:hover:text-rose-300"
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
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-center text-xs font-bold text-[#00355f] border-t border-slate-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 dark:border-cyan-900/40 dark:bg-[#0A1F3E] dark:text-cyan-200 dark:hover:bg-cyan-950/50"
            >
              {loading ? (
                <span>{t("loading")}</span>
              ) : (
                <>
                  <span>{t("load_more")}</span>
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
