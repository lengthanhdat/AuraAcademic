"use client";

import { useEffect, useRef, useState } from "react";
import { useAlert } from "@/components/ui/AlertProvider";

const CATEGORIES = ["lecture", "exercise", "reference", "guide", "faq"];
const CAT_LABELS: Record<string, string> = {
  lecture: "Bài giảng", exercise: "Bài tập", reference: "Tham khảo",
  guide: "Hướng dẫn", faq: "FAQ"
};
const FILE_TYPES: Record<string, { icon: string; color: string; bg: string }> = {
  pdf:   { icon: "picture_as_pdf", color: "text-red-600",    bg: "bg-red-50"    },
  pptx:  { icon: "slideshow",      color: "text-orange-500", bg: "bg-orange-50" },
  docx:  { icon: "description",    color: "text-blue-600",   bg: "bg-blue-50"   },
  video: { icon: "play_circle",    color: "text-violet-600", bg: "bg-violet-50" },
  link:  { icon: "link",           color: "text-teal-600",   bg: "bg-teal-50"   },
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  pending_review: { label: "Chờ duyệt",  cls: "bg-amber-100 text-amber-800",   icon: "schedule" },
  approved:       { label: "Đã duyệt",   cls: "bg-blue-100 text-blue-800",     icon: "check_circle" },
  published:      { label: "Công khai",  cls: "bg-green-100 text-green-800",   icon: "public" },
  rejected:       { label: "Từ chối",    cls: "bg-red-100 text-red-800",       icon: "cancel" },
};

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

const TRANS: Record<string, string> = {
  profanity:      "Ngôn ngữ thô tục",
  sexual_content: "Nội dung khiêu dâm",
  violence:       "Bạo lực",
  hate_speech:    "Phát ngôn thù ghét",
  political:      "Chính trị nhạy cảm",
  copyright:      "Vi phạm bản quyền",
  ai_rejected:    "AI TỪ CHỐI",
  upload_error:   "LỖI TẢI LÊN",
  uploading:      "Đang tải lên...",
  ai_checking:    "AI đang kiểm duyệt...",
  search_material:"Tìm kiếm tài liệu...",
  all:            "Tất cả",
  edit:           "Chỉnh sửa",
  delete:         "Xóa",
  title:          "Tiêu đề",
  subject:        "Môn học",
  description:    "Mô tả",
  tags:           "Thẻ (tag)",
};
const t = (key: string) => TRANS[key] ?? key;

type Material = {
  id: string; title: string; description: string; subject: string;
  category: string; fileType: string; fileName: string; fileSizeBytes: number;
  tags: string[]; status: string; createdAt: string; downloadCount: number;
  rejectionReason?: string;
};

type UploadItem = {
  key: string; file: File; title: string; subject: string; category: string;
  tags: string; fileType: string; progress: number; status: "idle"|"uploading"|"done"|"error"; error?: string;
};

export default function TeacherMaterials() {
  const { showAlert } = useAlert();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [editItem, setEditItem] = useState<Material | null>(null);
  const [editForm, setEditForm] = useState({ title:"", description:"", subject:"", category:"lecture", tags:"" });
  const dropRef = useRef<HTMLDivElement>(null);

  const token = () => localStorage.getItem("accessToken");

  useEffect(() => { fetchMaterials(); }, []);

  const fetchMaterials = async () => {
    try {
      const res = await fetch("http://localhost:8088/api/materials/my", {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) setMaterials(await res.json());
    } catch {/**/} finally { setLoading(false); }
  };

  const detectFileType = (file: File): string => {
    const n = file.name.toLowerCase();
    if (n.endsWith(".pdf")) return "pdf";
    if (n.endsWith(".pptx") || n.endsWith(".ppt")) return "pptx";
    if (n.endsWith(".docx") || n.endsWith(".doc")) return "docx";
    if (file.type.startsWith("video/")) return "video";
    return "pdf";
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newItems: UploadItem[] = [];
    Array.from(files).forEach(file => {
      if (file.size > MAX_SIZE) {
        showAlert({ title: "File quá lớn", message: `${file.name} vượt quá 50MB.`, type: "error" });
        return;
      }
      newItems.push({
        key: `${file.name}-${Date.now()}`, file,
        title: file.name.replace(/\.[^/.]+$/, ""),
        subject: "", category: "lecture",
        tags: "", fileType: detectFileType(file),
        progress: 0, status: "idle"
      });
    });
    setQueue(q => [...q, ...newItems]);
  };

  const uploadItem = async (item: UploadItem) => {
    // Bước 1: Đọc file thành base64
    setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "uploading", progress: 15 } : i));
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      // Bước 2: Đang gửi & AI kiểm duyệt (đây là bước nặng nhất ~1-3s)
      setQueue(q => q.map(i => i.key === item.key ? { ...i, progress: 40 } : i));
      try {
        const res = await fetch("http://localhost:8088/api/materials/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
          body: JSON.stringify({
            title: item.title || item.file.name,
            subject: item.subject,
            category: item.category,
            fileType: item.fileType,
            fileName: item.file.name,
            fileSizeBytes: item.file.size,
            fileUrl: base64,
            tags: item.tags.split(",").map(t => t.trim()).filter(Boolean),
          })
        });
        if (res.ok) {
          setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "done", progress: 100 } : i));
          showAlert({ title: "Upload thành công", message: `"${item.title}" đã được AI kiểm duyệt và công khai.`, type: "success" });
          fetchMaterials();
        } else {
          // Đọc lỗi từ server — AI rejection sẽ chứa lý do cụ thể
          const rawMsg = await res.text();
          // Cố parse JSON nếu có (Spring trả về JSON error body)
          let displayMsg = rawMsg;
          try {
            const errObj = JSON.parse(rawMsg);
            displayMsg = errObj.message || errObj.error || rawMsg;
          } catch { /* raw text */ }
          // Lọc prefix "Tài liệu bị từ chối bởi AI kiểm duyệt: " để hiển thị gọn hơn
          const isAiReject = displayMsg.includes("AI kiểm duyệt") || displayMsg.includes("Tài liệu bị từ chối");
          setQueue(q => q.map(i => i.key === item.key ? {
            ...i, status: "error",
            error: displayMsg
          } : i));
          if (isAiReject) {
            showAlert({ title: "❌ AI từ chối tài liệu", message: displayMsg, type: "error" });
          }
        }
      } catch {
        setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "error", error: "Không thể kết nối đến máy chủ." } : i));
      }
    };
    reader.readAsDataURL(item.file);
  };

  const uploadAll = () => queue.filter(i => i.status === "idle").forEach(uploadItem);

  const removeFromQueue = (key: string) => setQueue(q => q.filter(i => i.key !== key));

  const handleDelete = async (id: string) => {
    const res = await fetch(`http://localhost:8088/api/materials/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token()}` }
    });
    if (res.ok) { fetchMaterials(); showAlert({ title: "Đã xóa", message: "Tài liệu đã được xóa.", type: "success" }); }
  };

  const openEdit = (m: Material) => {
    setEditItem(m);
    setEditForm({ title: m.title, description: m.description, subject: m.subject, category: m.category, tags: m.tags?.join(", ") || "" });
  };

  const saveEdit = async () => {
    if (!editItem) return;
    const res = await fetch(`http://localhost:8088/api/materials/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...editForm, tags: editForm.tags.split(",").map(t => t.trim()).filter(Boolean) })
    });
    if (res.ok) {
      setEditItem(null);
      fetchMaterials();
      showAlert({ title: "Đã cập nhật", message: "Thông tin tài liệu đã được lưu.", type: "success" });
    }
  };

  const filtered = materials.filter(m =>
    (filterStatus === "all" || m.status === filterStatus) &&
    (m.title.toLowerCase().includes(search.toLowerCase()) || m.subject?.toLowerCase().includes(search.toLowerCase()))
  );

  const fmt = (bytes: number) => {
    if (bytes >= 1048576) return `${(bytes/1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes/1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  return (
    <main className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-extrabold text-on-surface dark:text-slate-200 tracking-tight mb-1">Tài liệu giảng dạy</h1>
        <p className="text-on-surface-variant dark:text-slate-400">Quản lý và chia sẻ tài liệu học tập với học viên của bạn.</p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng tài liệu", value: materials.length, icon: "folder", color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Chờ duyệt", value: materials.filter(m=>m.status==="pending_review").length, icon: "schedule", color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Đã công khai", value: materials.filter(m=>m.status==="published").length, icon: "public", color: "text-green-500", bg: "bg-green-50" },
          { label: "Lượt tải", value: materials.reduce((s,m)=>s+m.downloadCount,0), icon: "download", color: "text-violet-500", bg: "bg-violet-50" },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-[#0A1F3E]/90 border border-slate-200/60 dark:border-cyan-950/40 shadow-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`material-symbols-outlined ${color}`}>{icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-xl font-black text-on-surface dark:text-[#00C6FF]">{value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Drop Zone */}
      <section
        ref={dropRef}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer
          ${dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-slate-300 dark:border-cyan-950/40 bg-white dark:bg-[#0A1F3E]/90 hover:border-primary/40 hover:bg-primary/2"}`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input id="file-input" type="file" className="hidden" multiple
          accept=".pdf,.pptx,.ppt,.docx,.doc,video/*"
          onChange={e => addFiles(e.target.files)} />
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
        </div>
        <h3 className="font-bold text-on-surface dark:text-slate-200 mb-1">Kéo và thả file vào đây</h3>
        <p className="text-xs text-on-surface-variant dark:text-slate-400">hoặc click để chọn file · PDF, PPTX, DOCX, Video · Tối đa 50MB/file</p>
      </section>

      {/* Upload Queue */}
      {queue.length > 0 && (
        <section className="bg-surface-container-low dark:bg-cyan-950/30 dark:bg-[#0A1F3E]/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-cyan-950/40 flex items-center justify-between">
            <h2 className="font-bold text-on-surface dark:text-slate-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">upload_file</span>
              Hàng chờ upload ({queue.length} file)
            </h2>
            <button onClick={uploadAll}
              className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Upload tất cả
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-cyan-950/40">
            {queue.map(item => (
              <div key={item.key} className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${FILE_TYPES[item.fileType]?.bg || "bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40"}`}>
                    <span className={`material-symbols-outlined ${FILE_TYPES[item.fileType]?.color || "text-slate-500"}`}>{FILE_TYPES[item.fileType]?.icon || "description"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface dark:text-slate-200 text-sm truncate">{item.file.name}</p>
                    <p className="text-xs text-on-surface-variant dark:text-slate-400">{fmt(item.file.size)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "done" && <span className="text-green-600 material-symbols-outlined">check_circle</span>}
                    {item.status === "idle" && (
                      <button onClick={() => uploadItem(item)}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all">
                        Upload
                      </button>
                    )}
                    <button onClick={() => removeFromQueue(item.key)} className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 hover:text-error transition-colors text-xl">close</button>
                  </div>
                </div>

                {/* AI rejection error banner */}
                {item.status === "error" && (() => {
                  const isAiReject = item.error?.includes("AI kiểm duyệt");
                  const violationIcons: Record<string, { icon: string; label: string }> = {
                    PROFANITY:       { icon: "no_adult_content", label: t("profanity") },
                    SEXUAL_CONTENT:  { icon: "block",            label: t("sexual_content") },
                    VIOLENCE:        { icon: "warning",          label: t("violence") },
                    HATE_SPEECH:     { icon: "report",           label: t("hate_speech") },
                    POLITICAL:       { icon: "gavel",            label: t("political") },
                    COPYRIGHT:       { icon: "copyright",        label: t("copyright") },
                  };
                  // Try detect violationType from error message
                  const detectedType = Object.keys(violationIcons).find(k => item.error?.includes(k));
                  const vi = detectedType ? violationIcons[detectedType] : null;
                  return (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                      <span className="material-symbols-outlined text-red-500 text-xl flex-shrink-0 mt-0.5">
                        {isAiReject ? "smart_toy" : "error"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-xs font-black text-red-700 uppercase tracking-wide">
                            {isAiReject ? t("ai_rejected") : t("upload_error")}
                          </p>
                          {vi && (
                            <span className="flex items-center gap-0.5 px-2 py-0.5 bg-red-100 rounded-full text-[10px] font-bold text-red-700">
                              <span className="material-symbols-outlined text-[10px]">{vi.icon}</span>
                              {vi.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-red-600 leading-relaxed">{item.error}</p>
                        {isAiReject && (
                          <p className="text-[10px] text-red-400 mt-1">
                            Vui lòng chỉnh sửa tiêu đề, mô tả và tên file, sau đó thử lại.
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "idle", progress: 0, error: undefined } : i))}
                        className="text-[10px] font-bold text-red-600 hover:underline flex-shrink-0 mt-0.5">
                        Thử lại
                      </button>
                    </div>
                  );
                })()}

                {/* Metadata form */}
                {item.status === "idle" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-13">
                    <input value={item.title} onChange={e => setQueue(q=>q.map(i=>i.key===item.key?{...i,title:e.target.value}:i))}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] focus:border-blue-400 outline-none transition-colors text-sm focus:outline-none focus:border-primary" placeholder="Tiêu đề..." />
                    <input value={item.subject} onChange={e => setQueue(q=>q.map(i=>i.key===item.key?{...i,subject:e.target.value}:i))}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] focus:border-blue-400 outline-none transition-colors text-sm focus:outline-none focus:border-primary" placeholder="Môn học..." />
                    <select value={item.category} onChange={e => setQueue(q=>q.map(i=>i.key===item.key?{...i,category:e.target.value}:i))}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] focus:border-blue-400 outline-none transition-colors text-sm focus:outline-none focus:border-primary">
                      {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                    </select>
                    <input value={item.tags} onChange={e => setQueue(q=>q.map(i=>i.key===item.key?{...i,tags:e.target.value}:i))}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] focus:border-blue-400 outline-none transition-colors text-sm focus:outline-none focus:border-primary sm:col-span-3" placeholder="Thẻ (cách nhau bằng dấu phẩy): toán học, chương 1..." />
                  </div>
                )}

                {/* Progress bar + AI review label */}
                {item.status === "uploading" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] animate-pulse text-primary">smart_toy</span>
                        {item.progress < 40 ? t("uploading") : t("ai_checking")}
                      </span>
                      <span className="text-[10px] text-on-surface-variant dark:text-slate-400">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-surface-container dark:bg-cyan-950/20 rounded-full h-2">
                      <div className="bg-gradient-to-r from-primary to-primary-container h-2 rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My Materials */}
      <section className="bg-surface-container-low dark:bg-cyan-950/30 dark:bg-[#0A1F3E]/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-cyan-950/40 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="font-bold text-on-surface dark:text-slate-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">folder_open</span>
            Tài liệu của tôi
          </h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-base">search</span>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] focus:border-blue-400 outline-none transition-colors text-sm focus:outline-none focus:border-primary"
                placeholder={t("search_material")} />
            </div>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] focus:border-blue-400 outline-none transition-colors text-xs font-bold focus:outline-none">
              <option value="all">{t('all')}</option>
              {Object.keys(STATUS_CONFIG).map(s=><option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant dark:text-slate-400/30 block mb-3">folder_off</span>
            <p className="text-on-surface-variant dark:text-slate-400">Chưa có tài liệu nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-cyan-950/40">
            {filtered.map(m => {
              const ft = FILE_TYPES[m.fileType] || FILE_TYPES.pdf;
              const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending_review;
              return (
                <div key={m.id} className="px-6 py-5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-cyan-950/20 transition-colors">
                  <div className={`w-10 h-10 rounded-xl ${ft.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined ${ft.color}`}>{ft.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-on-surface dark:text-slate-200 text-sm truncate">{m.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${sc.cls}`}>
                        <span className="material-symbols-outlined text-[10px]">{sc.icon}</span>{sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant dark:text-slate-400">
                      {m.subject} {m.subject&&"·"} {CAT_LABELS[m.category]||m.category} {m.fileName&&`· ${fmt(m.fileSizeBytes)}`}
                    </p>
                    {m.status==="rejected" && m.rejectionReason && (
                      <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">info</span>{m.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-on-surface-variant dark:text-slate-400 mr-2">{m.downloadCount} tải</span>
                    <button onClick={() => openEdit(m)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-cyan-950/50 dark:text-slate-200 transition-all text-on-surface-variant dark:text-slate-400 hover:text-primary"
                      title={t("edit")}>
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onClick={() => handleDelete(m.id)}
                      className="p-2 rounded-xl hover:bg-red-50 transition-all text-on-surface-variant dark:text-slate-400 hover:text-red-600"
                      title={t("delete")}>
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-low dark:bg-cyan-950/30 dark:bg-[#0A1F3E]/80 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-on-surface dark:text-slate-200 text-lg">Chỉnh sửa tài liệu</h3>
              <button onClick={()=>setEditItem(null)} className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 hover:text-error transition-colors">close</button>
            </div>
            {[
              { field: "title", label: t("title"), type: "text" },
              { field: "subject", label: t("subject"), type: "text" },
              { field: "description", label: t("description"), type: "text" },
              { field: "tags", label: t("tags"), type: "text" },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="text-[10px] font-bold uppercase text-on-surface-variant dark:text-slate-400 tracking-widest block mb-1">{label}</label>
                <input value={(editForm as any)[field]}
                  onChange={e => setEditForm(f=>({...f,[field]:e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] focus:border-blue-400 outline-none transition-colors text-sm focus:outline-none focus:border-primary" />
              </div>
            ))}
            <div>
              <label className="text-[10px] font-bold uppercase text-on-surface-variant dark:text-slate-400 tracking-widest block mb-1">Danh mục</label>
              <select value={editForm.category} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] focus:border-blue-400 outline-none transition-colors text-sm focus:outline-none focus:border-primary">
                {CATEGORIES.map(c=><option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setEditItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface dark:text-slate-200 font-bold text-sm hover:bg-surface-container dark:bg-cyan-950/20 transition-all">
                Hủy
              </button>
              <button onClick={saveEdit}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all">
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
