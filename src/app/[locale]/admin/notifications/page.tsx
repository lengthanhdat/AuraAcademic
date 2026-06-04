"use client";
import { useState } from "react";

const MOCK_NOTIFS = [
  { id: "1", type: "warning", title: "2 IP đáng ngờ bị phát hiện", body: "Các địa chỉ 103.22.56.1 và 45.33.12.5 đã thử đăng nhập nhiều lần.", time: "5 phút trước", read: false },
  { id: "2", type: "error", title: "Phát hiện 3 trường hợp gian lận", body: "AI giám sát phát hiện hành vi bất thường trong bài thi Toán HK1.", time: "22 phút trước", read: false },
  { id: "3", type: "info", title: "5 người dùng mới đăng ký", body: "Hệ thống có thêm 5 tài khoản học sinh trong hôm nay.", time: "1 giờ trước", read: false },
  { id: "4", type: "success", title: "Backup dữ liệu hoàn thành", body: "Dữ liệu đã được sao lưu tự động lúc 03:00 AM.", time: "6 giờ trước", read: true },
  { id: "5", type: "info", title: "Cập nhật hệ thống v1.1.0", body: "Phiên bản mới đã sẵn sàng triển khai, bao gồm các cải thiện hiệu suất.", time: "1 ngày trước", read: true },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const unread = notifs.filter(n => !n.read).length;

  const markRead = (id: string) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const markAll = () => setNotifs(p => p.map(n => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifs(p => p.filter(n => n.id !== id));

  const typeStyle: any = {
    warning: { icon: "warning", cls: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    error: { icon: "gpp_bad", cls: "text-red-400 bg-red-400/10 border-red-400/20" },
    info: { icon: "info", cls: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    success: { icon: "check_circle", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  };

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0C2E5E] dark:text-[#E2E8F0]">Thông báo</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{unread} thông báo chưa đọc</p>
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="px-4 py-2 bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/50 dark:text-slate-200 border border-slate-200 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all">
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifs.map(n => {
          const { icon, cls } = typeStyle[n.type];
          return (
            <div key={n.id} onClick={() => markRead(n.id)}
              className={`flex items-start gap-4 p-5 bg-white dark:bg-[#0A1F3E]/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-cyan-950/40 border rounded-2xl cursor-pointer transition-all hover:border-slate-600 ${n.read ? "border-slate-100 opacity-60" : "border-slate-200/50"}`}>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${cls}`}>
                <span className="material-symbols-outlined text-xl" style={{fontVariationSettings:"'FILL' 1"}}>{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-bold ${n.read ? "text-slate-500 dark:text-slate-400" : "text-white"}`}>{n.title}</p>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-[#00C6FF] flex-shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{n.body}</p>
                <p className="text-xs text-slate-600 mt-2">{n.time}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); dismiss(n.id); }} className="text-slate-600 hover:text-slate-500 dark:text-slate-400 transition-colors flex-shrink-0">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          );
        })}
        {notifs.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-700 block mb-3" style={{fontVariationSettings:"'FILL' 1"}}>notifications_off</span>
            <p className="text-slate-500 dark:text-slate-400">Không có thông báo nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}
