"use client";
import { useState } from "react";

const MOCK_MEDIA = [
  { id: 1, name: "landing-banner-1.webp", type: "image/webp", size: "1.2 MB", date: "2026-05-01" },
  { id: 2, name: "logo-transparent.png", type: "image/png", size: "150 KB", date: "2026-04-20" },
  { id: 3, name: "ai-detection-demo.mp4", type: "video/mp4", size: "15.4 MB", date: "2026-04-15" },
  { id: 4, name: "teacher-guide.pdf", type: "application/pdf", size: "2.1 MB", date: "2026-03-10" },
];

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState("media");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  return (
    <div className="p-6 space-y-6 bg-[#0f172a] min-h-screen relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-xl animate-bounce">
          ✓ {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Nội dung & Media</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý nội dung trang chủ và thư viện tệp tin hệ thống</p>
        </div>
        <button onClick={() => showToast("Đã mở hộp thoại tải lên")} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg shadow-violet-500/20">
          <span className="material-symbols-outlined text-lg">upload</span>Tải tệp lên
        </button>
      </div>

      <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-700/50">
          {[
            { id: "media", icon: "perm_media", label: "Thư viện Media" },
            { id: "pages", icon: "web", label: "Trang tĩnh" },
            { id: "announcements", icon: "campaign", label: "Thông báo chung" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === t.id ? "border-violet-500 text-violet-400 bg-violet-500/5" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
              <span className="material-symbols-outlined text-lg">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "media" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {MOCK_MEDIA.map(m => {
                  const isImg = m.type.startsWith("image");
                  const icon = isImg ? "image" : m.type.startsWith("video") ? "movie" : "description";
                  return (
                    <div key={m.id} className="group relative border border-slate-700/50 rounded-xl overflow-hidden bg-slate-800/30 hover:border-violet-500/50 transition-all">
                      <div className="h-32 bg-slate-800 flex items-center justify-center relative overflow-hidden">
                        {isImg ? (
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20" />
                        ) : null}
                        <span className={`material-symbols-outlined text-4xl ${isImg ? "text-violet-400" : "text-slate-500"}`}>{icon}</span>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-violet-600 transition-colors"><span className="material-symbols-outlined text-sm">visibility</span></button>
                          <button onClick={() => showToast("Đã xoá tệp")} className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-red-600 transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold text-white truncate" title={m.name}>{m.name}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px] text-slate-500 uppercase">{m.type.split("/")[1]}</span>
                          <span className="text-[10px] font-mono text-slate-400">{m.size}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "pages" && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">construction</span>
              <h3 className="text-white font-bold mb-1">Trình quản lý trang đang được phát triển</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">Tính năng chỉnh sửa nội dung trang chủ (Hero Banner, Giới thiệu) sẽ sớm có mặt trong phiên bản tới.</p>
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">campaign</span>
              <h3 className="text-white font-bold mb-1">Chưa có thông báo nào</h3>
              <p className="text-slate-500 text-sm">Bạn có thể tạo popup thông báo xuất hiện khi người dùng đăng nhập.</p>
              <button className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700">Tạo thông báo mới</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
