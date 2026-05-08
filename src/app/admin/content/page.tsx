"use client";
import { useState, useEffect } from "react";

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState("media");
  const [toast, setToast] = useState("");
  
  // Media states
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<any>(null);

  // Announcements states
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New announcement form states
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("SYSTEM");

  const showToast = (msg: string) => { 
    setToast(msg); 
    setTimeout(() => setToast(""), 3000); 
  };

  // Fetch all uploaded media/materials
  const fetchMedia = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setLoadingMedia(true);
    try {
      const res = await fetch("http://localhost:8088/api/materials/admin/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMediaList(data);
      }
    } catch (e) {
      console.error("Error fetching media:", e);
    } finally {
      setLoadingMedia(false);
    }
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setLoadingAnnouncements(true);
    try {
      const res = await fetch("http://localhost:8088/api/notifications?type=all&limit=50", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const globals = data.items.filter((item: any) => item.userId === "ALL");
        setAnnouncements(globals);
      }
    } catch (e) {
      console.error("Error fetching announcements:", e);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  // Dynamic fetch based on tab active
  useEffect(() => {
    if (activeTab === "media") {
      fetchMedia();
    } else if (activeTab === "announcements") {
      fetchAnnouncements();
    }
  }, [activeTab]);

  // Handle file uploads natively and convert to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast("Tệp vượt quá kích thước giới hạn 50MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      
      let fileType = "pdf";
      if (["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) fileType = "image";
      else if (["mp4", "mov", "avi", "webm"].includes(extension)) fileType = "video";
      else if (extension === "docx") fileType = "docx";
      else if (extension === "pptx") fileType = "pptx";

      const token = localStorage.getItem("accessToken");
      if (!token) return;

      showToast("Đang tải tệp lên máy chủ...");
      try {
        const res = await fetch("http://localhost:8088/api/materials/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fileUrl: base64,
            fileSizeBytes: file.size,
            fileName: file.name,
            title: file.name.split(".")[0],
            description: "Được lưu trữ trong Thư viện Media hệ thống.",
            category: "media",
            fileType: fileType
          })
        });

        if (res.ok) {
          showToast("Đã thêm tệp tin vào Thư viện Media thành công!");
          fetchMedia();
        } else {
          showToast("Có lỗi xảy ra khi tải tệp lên");
        }
      } catch {
        showToast("Lỗi kết nối máy chủ");
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete media item
  const handleDeleteMedia = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa tệp tin này khỏi Thư viện Media không?")) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8088/api/materials/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Xóa tệp tin thành công!");
        fetchMedia();
      } else {
        showToast("Không thể xóa tệp tin");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  // Create global announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      showToast("Vui lòng điền đầy đủ tiêu đề và nội dung");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8088/api/notifications/system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          type: newType
        })
      });

      if (res.ok) {
        showToast("Đã phát hành thông báo hệ thống thành công!");
        setShowCreateModal(false);
        setNewTitle("");
        setNewContent("");
        setNewType("SYSTEM");
        fetchAnnouncements();
      } else {
        showToast("Lỗi khi phát hành thông báo");
      }
    } catch (e) {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  // Delete global announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo hệ thống này không?")) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8088/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Đã xóa thông báo thành công!");
        fetchAnnouncements();
      } else {
        showToast("Không thể xóa thông báo");
      }
    } catch (e) {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  // Safe file size formatter
  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="p-6 space-y-6 bg-[#0f172a] min-h-screen relative font-body">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-xl animate-bounce">
          ✓ {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white font-headline">Nội dung & Media</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý nội dung trang chủ và thư viện tệp tin hệ thống</p>
        </div>
        
        {/* Native Upload Button Trigger */}
        <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg shadow-violet-500/20 cursor-pointer transition-transform active:scale-95">
          <span className="material-symbols-outlined text-lg">upload</span>
          Tải tệp lên
          <input type="file" onChange={handleFileChange} className="hidden" />
        </label>
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
              {loadingMedia ? (
                <div className="text-center py-16">
                  <p className="text-slate-400 text-xs font-semibold animate-pulse">Đang tải tài nguyên Media...</p>
                </div>
              ) : mediaList.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">folder_open</span>
                  <h3 className="text-white font-bold mb-1">Thư viện Media trống</h3>
                  <p className="text-slate-500 text-sm">Hãy tải lên tệp tin ảnh, video, tài liệu đầu tiên của bạn.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {mediaList.map(m => {
                    const isImg = m.fileType === "image";
                    const isVideo = m.fileType === "video";
                    const icon = isImg ? "image" : isVideo ? "movie" : "description";
                    
                    return (
                      <div key={m.id} className="group relative border border-slate-700/50 rounded-xl overflow-hidden bg-slate-800/30 hover:border-violet-500/50 transition-all flex flex-col justify-between">
                        <div className="h-32 bg-slate-800/80 flex items-center justify-center relative overflow-hidden">
                          {isImg && m.fileUrl ? (
                            <img src={m.fileUrl} alt={m.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : isVideo && m.fileUrl ? (
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 to-indigo-500/15 flex items-center justify-center">
                              <span className="material-symbols-outlined text-4xl text-violet-400">play_circle</span>
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-700/10 to-slate-900/10" />
                          )}
                          
                          <span className={`material-symbols-outlined text-4xl relative z-10 ${isImg ? "opacity-0" : isVideo ? "opacity-0" : "text-slate-500"}`}>
                            {icon}
                          </span>

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                            <button
                              onClick={() => setSelectedPreview(m)}
                              className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-violet-600 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span>
                            </button>
                            <button
                              onClick={(e) => handleDeleteMedia(m.id, e)}
                              className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900/20">
                          <p className="text-xs font-bold text-white truncate" title={m.title}>{m.title}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{m.fileType || "File"}</span>
                            <span className="text-[10px] font-mono text-slate-400">{formatSize(m.fileSizeBytes)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-700/30">
                <h2 className="text-lg font-bold text-white">Danh sách thông báo hệ thống</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-lg shadow-violet-500/20"
                >
                  <span className="material-symbols-outlined text-sm">add_alert</span>Tạo thông báo mới
                </button>
              </div>

              {loadingAnnouncements ? (
                <div className="text-center py-16">
                  <p className="text-slate-400 text-xs font-semibold animate-pulse">Đang tải danh sách thông báo...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">campaign</span>
                  <h3 className="text-white font-bold mb-1">Chưa có thông báo nào</h3>
                  <p className="text-slate-500 text-sm">Bạn có thể tạo popup thông báo xuất hiện khi người dùng đăng nhập.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700"
                  >
                    Tạo thông báo mới
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {announcements.map((item: any) => {
                    const badgeColor = 
                      item.type === "SYSTEM" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      item.type === "EXAM" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      item.type === "MATERIAL" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20";
                    
                    return (
                      <div key={item.id} className="p-5 bg-slate-800/30 border border-slate-700/50 rounded-2xl flex flex-col justify-between hover:border-violet-500/30 transition-all">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${badgeColor}`}>
                              {item.type}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(item.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white tracking-tight">{item.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{item.content}</p>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-700/10 mt-4">
                          <button
                            onClick={() => handleDeleteAnnouncement(item.id)}
                            className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>Xóa thông báo
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1e293b] border border-slate-700 max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl animate-zoom-in">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
              <h3 className="font-headline font-black text-white text-base truncate max-w-md">{selectedPreview.title}</h3>
              <button onClick={() => setSelectedPreview(null)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center justify-center bg-slate-950/25 min-h-[300px] max-h-[500px] overflow-y-auto">
              {selectedPreview.fileType === "image" && selectedPreview.fileUrl ? (
                <img src={selectedPreview.fileUrl} alt={selectedPreview.title} className="max-w-full max-h-[400px] object-contain rounded-lg border border-slate-800" />
              ) : selectedPreview.fileType === "video" && selectedPreview.fileUrl ? (
                <video src={selectedPreview.fileUrl} controls className="max-w-full max-h-[400px] rounded-lg border border-slate-800" />
              ) : (
                <div className="text-center space-y-4">
                  <span className="material-symbols-outlined text-6xl text-violet-400 animate-pulse">description</span>
                  <p className="text-sm text-slate-300">Tài liệu không thể xem trước trực tiếp.</p>
                  <a
                    href={selectedPreview.fileUrl}
                    download={selectedPreview.fileName}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-bold rounded-xl text-xs hover:bg-violet-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>Tải xuống tệp tin ({formatSize(selectedPreview.fileSizeBytes)})
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Announcement Premium Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1e293b] border border-slate-700 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl animate-zoom-in">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
              <h3 className="font-headline font-black text-white text-base">Phát hành thông báo mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiêu đề thông báo</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Nhập tiêu đề ngắn gọn..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phân loại loại thông báo</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  <option value="SYSTEM">Hệ thống (Toàn cục)</option>
                  <option value="EXAM">Kỳ thi (Khảo thí)</option>
                  <option value="MATERIAL">Tài liệu (Học liệu)</option>
                  <option value="WARNING">Cảnh báo (An ninh)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung chi tiết</label>
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  rows={4}
                  placeholder="Nhập nội dung đầy đủ để truyền tải thông điệp..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-violet-500/20 hover:opacity-90 transition-all"
                >
                  Phát hành thông báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
