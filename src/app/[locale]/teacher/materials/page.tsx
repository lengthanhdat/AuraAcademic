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
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/materials/my", {
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
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/materials/upload", {
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
          const uploaded = await res.json().catch(() => null);
          setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "done", progress: 100 } : i));
          const isPublished = uploaded?.status === "published";
          showAlert({
            title: "Upload thành công",
            message: isPublished
              ? `"${item.title}" đã được kiểm duyệt và công khai.`
              : `"${item.title}" đã được tải lên và đang chờ quản trị viên duyệt.`,
            type: "success"
          });
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/materials/${id}`, {
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/materials/${editItem.id}`, {
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

  const formatDate = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
  };

  const fileTypeLabel = (type?: string) => ({
    pdf: "PDF",
    pptx: "Slide",
    docx: "Word",
    video: "Video",
    link: "Link",
  }[type || ""] || (type || "Tệp").toUpperCase());

  const totalDownloads = materials.reduce((s,m)=>s+(m.downloadCount || 0),0);
  const publishedCount = materials.filter(m=>m.status==="published").length;
  const pendingCount = materials.filter(m=>m.status==="pending_review").length;
  const rejectedCount = materials.filter(m=>m.status==="rejected").length;
  const idleQueueCount = queue.filter(i => i.status === "idle").length;

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-cyan-900/40 dark:bg-[#071A33]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400" />
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_520px] lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-700 dark:border-cyan-800/60 dark:bg-cyan-950/40 dark:text-cyan-200">
              <span className="material-symbols-outlined text-base">library_books</span>
              Trung tâm tài liệu
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Tài liệu giảng dạy</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Tải lên, phân loại và theo dõi tài liệu học tập mà học sinh có thể xem trong kho tài liệu.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Tổng tài liệu", value: materials.length, icon: "folder", color: "text-sky-600", bg: "bg-sky-50" },
              { label: "Đã công khai", value: publishedCount, icon: "public", color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Chờ duyệt", value: pendingCount, icon: "schedule", color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Lượt tải", value: totalDownloads, icon: "download", color: "text-violet-600", bg: "bg-violet-50" },
            ].map(({ label, value, icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-cyan-900/40 dark:bg-[#0B2445]">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                  <span className={`material-symbols-outlined ${color}`}>{icon}</span>
                </div>
                <p className="text-2xl font-black text-slate-950 dark:text-white">{value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div
          ref={dropRef}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          className={`group flex min-h-[320px] cursor-pointer flex-col justify-between rounded-3xl border-2 border-dashed p-6 transition-all duration-200
            ${dragging ? "scale-[1.01] border-sky-500 bg-sky-50 shadow-lg shadow-sky-100 dark:border-cyan-400 dark:bg-cyan-950/30" : "border-slate-300 bg-white hover:border-sky-400 hover:bg-sky-50/60 dark:border-cyan-900/50 dark:bg-[#071A33] dark:hover:border-cyan-500 dark:hover:bg-cyan-950/20"}`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input id="file-input" type="file" className="hidden" multiple
            accept=".pdf,.pptx,.ppt,.docx,.doc,video/*"
            onChange={e => addFiles(e.target.files)} />
          <div>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 transition-transform group-hover:-translate-y-1 dark:bg-cyan-950/50 dark:text-cyan-200">
              <span className="material-symbols-outlined text-3xl">cloud_upload</span>
            </div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Tải tài liệu mới</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Kéo thả file vào đây hoặc bấm để chọn nhiều file cùng lúc. Hỗ trợ PDF, PPTX, DOCX và Video, tối đa 50MB mỗi file.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 sm:grid-cols-4">
            {["PDF", "PPTX", "DOCX", "Video"].map(type => (
              <span key={type} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm dark:border-cyan-900/40 dark:bg-[#0B2445]">{type}</span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-cyan-900/40 dark:bg-[#071A33]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Quy trình đăng tải</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Chuẩn bị file, bổ sung thông tin, rồi công khai cho học sinh.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-[#0B2445] dark:text-slate-300">{queue.length} file chờ</span>
          </div>

          <div className="space-y-3">
            {[
              { icon: "upload_file", title: "Chọn tài liệu", text: "Tải lên một hoặc nhiều file bài giảng, bài tập, hướng dẫn." },
              { icon: "sell", title: "Gắn thông tin", text: "Đặt tiêu đề, môn học, danh mục và tag để học sinh dễ tìm." },
              { icon: "verified", title: "Theo dõi trạng thái", text: "Tài liệu hợp lệ sẽ xuất hiện trong kho học sinh sau khi xử lý." },
            ].map(step => (
              <div key={step.title} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-cyan-900/40 dark:bg-[#0B2445]">
                <span className="material-symbols-outlined text-sky-600 dark:text-cyan-300">{step.icon}</span>
                <div>
                  <p className="font-black text-slate-800 dark:text-white">{step.title}</p>
                  <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upload Queue */}
      {queue.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-cyan-900/40 dark:bg-[#071A33]">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-cyan-900/40 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-black text-slate-950 dark:text-white">
                <span className="material-symbols-outlined text-sky-600 dark:text-cyan-300">upload_file</span>
                Hàng chờ upload
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{idleQueueCount} file sẵn sàng, {queue.length - idleQueueCount} file đã xử lý hoặc đang xử lý.</p>
            </div>
            <button onClick={uploadAll}
              disabled={idleQueueCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-400 dark:text-[#06172E] dark:hover:bg-cyan-300">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Upload tất cả
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-cyan-900/40">
            {queue.map(item => (
              <div key={item.key} className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${FILE_TYPES[item.fileType]?.bg || "bg-slate-50 dark:bg-cyan-950/30"}`}>
                    <span className={`material-symbols-outlined ${FILE_TYPES[item.fileType]?.color || "text-slate-500"}`}>{FILE_TYPES[item.fileType]?.icon || "description"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-black text-slate-900 dark:text-white">{item.file.name}</p>
                    <p className="text-xs font-semibold text-slate-400">{fileTypeLabel(item.fileType)} · {fmt(item.file.size)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "done" && <span className="text-green-600 material-symbols-outlined">check_circle</span>}
                    {item.status === "idle" && (
                      <button onClick={() => uploadItem(item)}
                        className="rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-700 transition-all hover:bg-sky-100 dark:bg-cyan-950/40 dark:text-cyan-200">
                        Upload
                      </button>
                    )}
                    <button onClick={() => removeFromQueue(item.key)} className="material-symbols-outlined text-xl text-slate-400 transition-colors hover:text-red-600">close</button>
                  </div>
                </div>

                {item.status === "idle" && (
                  <div className="grid gap-3 md:grid-cols-[minmax(180px,1fr)_160px_160px]">
                    <input
                      value={item.title}
                      onChange={e => setQueue(q => q.map(i => i.key === item.key ? { ...i, title: e.target.value } : i))}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-cyan-900/50 dark:bg-[#0B2445] dark:text-white"
                      placeholder="Tiêu đề tài liệu"
                    />
                    <input
                      value={item.subject}
                      onChange={e => setQueue(q => q.map(i => i.key === item.key ? { ...i, subject: e.target.value } : i))}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-cyan-900/50 dark:bg-[#0B2445] dark:text-white"
                      placeholder="Môn học"
                    />
                    <select
                      value={item.category}
                      onChange={e => setQueue(q => q.map(i => i.key === item.key ? { ...i, category: e.target.value } : i))}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-cyan-900/50 dark:bg-[#0B2445] dark:text-white"
                    >
                      {CATEGORIES.map(c=><option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                    </select>
                    <input
                      value={item.tags}
                      onChange={e => setQueue(q => q.map(i => i.key === item.key ? { ...i, tags: e.target.value } : i))}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-cyan-900/50 dark:bg-[#0B2445] dark:text-white md:col-span-3"
                      placeholder="Tag, cách nhau bằng dấu phẩy"
                    />
                  </div>
                )}

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

                {/* Progress bar + AI review label */}
                {item.status === "uploading" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-cyan-200">
                        <span className="material-symbols-outlined text-[12px] animate-pulse">smart_toy</span>
                        {item.progress < 40 ? t("uploading") : t("ai_checking")}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-cyan-950/30">
                      <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My Materials */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-cyan-900/40 dark:bg-[#071A33]">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-cyan-900/40 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-black text-slate-950 dark:text-white">
              <span className="material-symbols-outlined text-sky-600 dark:text-cyan-300">folder_open</span>
              Tài liệu của tôi
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} tài liệu đang hiển thị · {rejectedCount} tài liệu bị từ chối</p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(240px,1fr)_180px] lg:w-[560px]">
            <label className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400">search</span>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-cyan-900/50 dark:bg-[#0B2445] dark:text-white"
                placeholder={t("search_material")} />
            </label>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-cyan-900/50 dark:bg-[#0B2445] dark:text-white">
              <option value="all">{t('all')}</option>
              {Object.keys(STATUS_CONFIG).map(s=><option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined mb-3 block text-5xl text-slate-300 dark:text-slate-600">folder_off</span>
            <p className="font-semibold text-slate-500 dark:text-slate-400">Chưa có tài liệu nào.</p>
          </div>
        ) : (
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(m => {
              const ft = FILE_TYPES[m.fileType] || FILE_TYPES.pdf;
              const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending_review;
              return (
                <div key={m.id} className="group flex min-h-[250px] flex-col rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5 transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-md dark:border-cyan-900/40 dark:bg-[#0B2445] dark:hover:border-cyan-700/50">
                  <div className="mb-4 flex items-start gap-3">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${ft.bg}`}>
                      <span className={`material-symbols-outlined ${ft.color}`}>{ft.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-black leading-snug text-slate-950 dark:text-white">{m.title}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase text-slate-400">{fileTypeLabel(m.fileType)}</p>
                    </div>
                    <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${sc.cls}`}>
                        <span className="material-symbols-outlined text-[10px]">{sc.icon}</span>{sc.label}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">school</span>{m.subject || "Chưa có môn học"}</p>
                    <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">category</span>{CAT_LABELS[m.category]||m.category}</p>
                    <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">database</span>{m.fileName ? fmt(m.fileSizeBytes) : "--"} · {formatDate(m.createdAt)}</p>
                  </div>

                  {m.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {m.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 shadow-sm dark:bg-cyan-950/50 dark:text-cyan-200">#{tag}</span>
                      ))}
                    </div>
                  )}

                  {m.status==="rejected" && m.rejectionReason && (
                    <p className="mt-4 flex items-start gap-1 rounded-xl border border-red-100 bg-red-50 p-2 text-xs text-red-600">
                      <span className="material-symbols-outlined text-sm">info</span>{m.rejectionReason}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-slate-200/70 pt-4 dark:border-cyan-900/40">
                    <span className="inline-flex items-center gap-1 text-xs font-black text-slate-500 dark:text-slate-400">
                      <span className="material-symbols-outlined text-sm">download</span>{m.downloadCount} tải
                    </span>
                    <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(m)}
                      className="rounded-xl p-2 text-slate-500 transition-all hover:bg-sky-50 hover:text-sky-700 dark:text-slate-400 dark:hover:bg-cyan-950/50 dark:hover:text-cyan-200"
                      title={t("edit")}>
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onClick={() => handleDelete(m.id)}
                      className="rounded-xl p-2 text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30"
                      title={t("delete")}>
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-cyan-900/40 dark:bg-[#071A33]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-cyan-900/40">
              <div>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">Chỉnh sửa tài liệu</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Cập nhật thông tin hiển thị trong kho tài liệu học sinh.</p>
              </div>
              <button onClick={()=>setEditItem(null)} className="material-symbols-outlined rounded-2xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600 dark:hover:bg-cyan-950/40">close</button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { field: "title", label: t("title"), type: "text" },
                  { field: "subject", label: t("subject"), type: "text" },
                  { field: "description", label: t("description"), type: "text" },
                  { field: "tags", label: t("tags"), type: "text" },
                ].map(({ field, label }) => (
                  <label key={field} className={field === "description" || field === "tags" ? "md:col-span-2" : ""}>
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                    <input value={(editForm as any)[field]}
                      onChange={e => setEditForm(f=>({...f,[field]:e.target.value}))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-cyan-900/50 dark:bg-[#0B2445] dark:text-white" />
                  </label>
                ))}
              </div>

              <label>
                <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Danh mục</span>
                <select value={editForm.category} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-cyan-900/50 dark:bg-[#0B2445] dark:text-white">
                  {CATEGORIES.map(c=><option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                </select>
              </label>

              <div className="flex gap-3 pt-2">
                <button onClick={()=>setEditItem(null)}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-700 transition-all hover:bg-slate-50 dark:border-cyan-900/50 dark:text-slate-200 dark:hover:bg-cyan-950/30">
                  Hủy
                </button>
                <button onClick={saveEdit}
                  className="flex-1 rounded-2xl bg-slate-900 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-cyan-400 dark:text-[#06172E] dark:hover:bg-cyan-300">
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
