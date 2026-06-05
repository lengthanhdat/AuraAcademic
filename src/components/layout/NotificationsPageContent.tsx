"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { API_BASE, getAuthHeaders } from "@/lib/api";

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsPageContentProps {
  role: "admin" | "teacher" | "student";
}

const TYPE_OPTIONS = [
  { value: "all", key: "all" },
  { value: "WELCOME", key: "welcome" },
  { value: "SYSTEM", key: "system" },
  { value: "EXAM", key: "exam" },
  { value: "MATERIAL", key: "material" },
  { value: "CLASSROOM", key: "classroom" },
  { value: "WARNING", key: "warning" },
] as const;

export default function NotificationsPageContent({ role }: NotificationsPageContentProps) {
  const t = useTranslations("NotificationsPage");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRead, setFilterRead] = useState("all");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const roleLabel = t(`roles.${role}`);

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("accessToken") || "";
  }, []);

  const buildParams = useCallback((targetPage: number) => {
    const params = new URLSearchParams({
      page: targetPage.toString(),
      limit: "15",
      readState: filterRead,
      query: searchQuery.trim(),
    });

    if (filterType !== "all") params.set("type", filterType);
    return params;
  }, [filterRead, filterType, searchQuery]);

  const fetchNotifications = useCallback(async (resetPage = false) => {
    if (!token) return;

    const targetPage = resetPage ? 0 : page;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/notifications?${buildParams(targetPage)}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch notifications");

      const data = await res.json();
      const items: NotificationItem[] = data.items || [];

      if (resetPage) {
        setNotifications(items);
        setPage(1);
      } else {
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          return [...prev, ...items.filter((item) => !existingIds.has(item.id))];
        });
        setPage((prev) => prev + 1);
      }

      setUnreadCount(data.unreadCount || 0);
      setTotalItems(data.totalItems || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error(t("toast.load_error"));
    } finally {
      setLoading(false);
    }
  }, [buildParams, page, t, token]);

  useEffect(() => {
    fetchNotifications(true);
    // Keep pagination state out of this effect; filters are the intended refresh triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterRead]);

  useEffect(() => {
    if (!token) return;

    const eventSource = new EventSource(`${API_BASE}/notifications/stream?token=${token}`);

    eventSource.addEventListener("NOTIFICATION", (event: MessageEvent) => {
      try {
        const newNotification: NotificationItem = JSON.parse(event.data);

        setNotifications((prev) => {
          if (prev.some((item) => item.id === newNotification.id)) return prev;
          if (filterRead === "read") return prev;
          if (filterType !== "all" && !newNotification.type.toUpperCase().includes(filterType.toUpperCase())) return prev;
          return [newNotification, ...prev];
        });

        setUnreadCount((prev) => prev + 1);
        setTotalItems((prev) => prev + 1);

        if ("Notification" in window && Notification.permission === "granted") {
          new window.Notification(newNotification.title, { body: newNotification.content });
        }
      } catch (error) {
        console.error("Error parsing real-time notification:", error);
      }
    });

    return () => eventSource.close();
  }, [filterRead, filterType, token]);

  const markAsRead = async (id: string) => {
    if (!token) return;
    const target = notifications.find((item) => item.id === id);
    if (!target || target.read) return;

    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (!res.ok) fetchNotifications(true);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      fetchNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    if (!token || unreadCount === 0) return;

    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);

    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      toast.success(t("toast.mark_all_success"));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error(t("toast.mark_all_error"));
      fetchNotifications(true);
    }
  };

  const deleteNotification = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!token) return;

    const deleted = notifications.find((item) => item.id === id);
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setTotalItems((prev) => Math.max(0, prev - 1));
    if (deleted && !deleted.read) setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`${API_BASE}/notifications/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete notification");
      toast.success(t("toast.delete_success"));
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error(t("toast.delete_error"));
      fetchNotifications(true);
    }
  };

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

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      if (diffMs < 0) return t("time.just_now");

      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return t("time.just_now");
      if (diffMins < 60) return t("time.minutes_ago", { count: diffMins });

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return t("time.hours_ago", { count: diffHours });

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return t("time.yesterday");
      if (diffDays < 30) return t("time.days_ago", { count: diffDays });

      return date.toLocaleDateString(undefined, { day: "numeric", month: "numeric", year: "numeric" });
    } catch {
      return t("time.just_now");
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-200/40 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-cyan-950/40 dark:bg-[#0A1F3E]/60">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200">
                <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                {roleLabel}
              </div>
              <h1 className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0]">{t("title")}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t.rich("unread_count", {
                  count: unreadCount,
                  countTag: (chunks) => <span className="font-extrabold text-[#00C6FF]">{chunks}</span>,
                })}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="self-start rounded-xl bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] sm:self-auto dark:from-[#0A1F3E] dark:to-[#0E3E7A]"
              >
                {t("mark_all_read")}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/40 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-cyan-950/40 dark:bg-[#0A1F3E]/60 md:flex-row">
          <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 transition-all focus-within:ring-2 focus-within:ring-[#0C2E5E]/15 dark:border-cyan-900/50 dark:bg-[#051329] dark:focus-within:border-cyan-500/60 dark:focus-within:ring-cyan-500/15">
            <span className="material-symbols-outlined mr-2 text-lg text-slate-400 dark:text-slate-500">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && fetchNotifications(true)}
              placeholder={t("search_placeholder")}
              className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  fetchNotifications(true);
                }}
                className="material-symbols-outlined text-base text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
                title={t("clear_search")}
              >
                close
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 outline-none dark:border-cyan-900/50 dark:bg-[#051329] dark:text-slate-200"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`types.${option.key}`)}
                </option>
              ))}
            </select>

            <select
              value={filterRead}
              onChange={(event) => setFilterRead(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 outline-none dark:border-cyan-900/50 dark:bg-[#051329] dark:text-slate-200"
            >
              <option value="all">{t("states.all")}</option>
              <option value="unread">{t("states.unread")}</option>
              <option value="read">{t("states.read")}</option>
            </select>

            <button
              onClick={() => fetchNotifications(true)}
              className="rounded-xl border border-slate-200/50 bg-slate-100 px-5 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 dark:border-cyan-900/30 dark:bg-cyan-950/40 dark:text-cyan-200 dark:hover:bg-cyan-950/60"
            >
              {t("filter")}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {!loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/40 bg-white/40 p-16 text-center backdrop-blur-md dark:border-cyan-950/40 dark:bg-[#0A1F3E]/40">
              <span className="material-symbols-outlined mb-3 text-5xl text-slate-300 dark:text-slate-600">notifications_off</span>
              <p className="font-semibold text-slate-500 dark:text-slate-400">{t("empty_title")}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{t("empty_desc")}</p>
            </div>
          ) : (
            notifications.map((item) => {
              const meta = getNotifMeta(item.type);
              return (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`group flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm backdrop-blur-md transition-all hover:scale-[1.005] dark:border-cyan-950/40 dark:bg-[#0A1F3E]/80 ${
                    item.read
                      ? "border-slate-100 opacity-75 hover:border-slate-200 dark:hover:border-cyan-900/60"
                      : "border-l-4 border-l-[#00C6FF] bg-blue-50/10 dark:border-cyan-900/80 dark:bg-cyan-500/5"
                  }`}
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm ring-4 ring-white/60 dark:ring-white/5 ${meta.color}`}>
                    <span className="material-symbols-outlined text-xl">{meta.icon}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className={`break-words text-sm leading-snug tracking-tight ${item.read ? "font-semibold text-slate-700 dark:text-slate-300" : "font-black text-[#0C2E5E] dark:text-cyan-100"}`}>
                        {item.title}
                      </p>
                      {!item.read && <span className="mt-1 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-blue-500 dark:bg-cyan-400" />}
                    </div>
                    <p className="mt-1 break-words text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.content}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-cyan-950/50 dark:text-slate-400">
                        {item.type}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{formatTime(item.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    onClick={(event) => deleteNotification(item.id, event)}
                    className="shrink-0 rounded-xl p-2 text-slate-300 opacity-0 transition-opacity hover:bg-slate-50 hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-cyan-950/40 dark:hover:text-rose-400 md:opacity-100"
                    title={t("delete_title")}
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {notifications.length < totalItems && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => fetchNotifications()}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-xs font-bold text-[#0C2E5E] shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-cyan-950 dark:bg-[#0A1F3E] dark:text-cyan-200 dark:hover:bg-[#0E3E7A]/25"
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
          </div>
        )}
      </div>
    </div>
  );
}
