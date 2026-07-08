"use client";

import { useEffect, useRef, useState } from "react";
import { useAlert } from "@/components/ui/AlertProvider";

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  pending_review: { label: "Chờ duyệt",  cls: "bg-amber-100 text-amber-800",   icon: "schedule" },
  published:      { label: "Công khai",  cls: "bg-green-100 text-green-800",   icon: "public" },
  rejected:       { label: "Từ chối",    cls: "bg-red-100 text-red-800",       icon: "cancel" },
};

const FILE_TYPES: Record<string, { icon: string; color: string; bg: string }> = {
  pdf:   { icon: "picture_as_pdf", color: "text-red-600",    bg: "bg-red-50"    },
  pptx:  { icon: "slideshow",      color: "text-orange-500", bg: "bg-orange-50" },
  docx:  { icon: "description",    color: "text-blue-600",   bg: "bg-blue-50"   },
  video: { icon: "play_circle",    color: "text-indigo-600", bg: "bg-indigo-50" },
  link:  { icon: "link",           color: "text-teal-600",   bg: "bg-teal-50"   },
};

const MAX_SIZE = 50 * 1024 * 1024;

type Material = {
  id: string; title: string; description: string; subject: string;
  category: string; fileType: string; fileName: string; fileSizeBytes: number;
  tags: string[]; status: string; uploaderName: string; uploaderRole: string;
  createdAt: string; downloadCount: number; rejectionReason?: string;
};

type UploadItem = {
  key: string; file: File; title: string; subject: string; category: string;
  tags: string; fileType: string; progress: number; status: "idle"|"uploading"|"done"|"error"; error?: string;
};

const CATS = ["lecture","exercise","reference","guide","faq"];
const CAT_LABELS: Record<string,string> = { lecture:"Bài giảng",exercise:"Bài tập",reference:"Tham khảo",guide:"Hướng dẫn",faq:"FAQ" };

export default function AdminMaterials() {
  const { showAlert } = useAlert();
  const [tab, setTab] = useState<"pending"|"all"|"upload">("pending");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [pending, setPending] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string|null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const token = () => localStorage.getItem("accessToken");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [allRes, pendRes] = await Promise.all([
        fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/materials/admin/all", { headers: { Authorization: `Bearer ${token()}` } }),
        fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/materials/admin/pending", { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      if (allRes.ok) setMaterials(await allRes.json());
      if (pendRes.ok) setPending(await pendRes.json());
    } catch {/**/} finally { setLoading(false); }
  };

  const review = async (id: string, action: "approve"|"reject", reason?: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/materials/admin/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ action, reason: reason || "" })
    });
    if (res.ok) {
      fetchAll();
      showAlert({ title: action === "approve" ? "Đã duyệt" : "Đã từ chối", message: "Trạng thái tài liệu đã được cập nhật.", type: "success" });
      setRejectTarget(null); setRejectReason("");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/materials/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token()}` }
    });
    if (res.ok) { fetchAll(); showAlert({ title: "Đã xóa", message: "", type: "success" }); }
  };

  const detectFileType = (file: File): string => {
    const n = file.name.toLowerCase();
    if (n.endsWith(".pdf")) return "pdf";
    if (n.endsWith(".pptx")||n.endsWith(".ppt")) return "pptx";
    if (n.endsWith(".docx")||n.endsWith(".doc")) return "docx";
    if (file.type.startsWith("video/")) return "video";
    return "pdf";
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > MAX_SIZE) { showAlert({ title: "File quá lớn", message: `${file.name} > 50MB`, type: "error" }); return; }
      setQueue(q => [...q, {
        key: `${file.name}-${Date.now()}`, file,
        title: file.name.replace(/\.[^/.]+$/, ""), subject: "", category: "guide",
        tags: "", fileType: detectFileType(file), progress: 0, status: "idle"
      }]);
    });
  };

  const uploadItem = async (item: UploadItem) => {
    setQueue(q => q.map(i => i.key===item.key ? {...i,status:"uploading",progress:10} : i));
    const reader = new FileReader();
    reader.onload = async () => {
      setQueue(q => q.map(i => i.key===item.key ? {...i,progress:50} : i));
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/materials/upload", {
          method: "POST",
          headers: { "Content-Type":"application/json", Authorization:`Bearer ${token()}` },
          body: JSON.stringify({
            title: item.title||item.file.name, subject: item.subject,
            category: item.category, fileType: item.fileType, fileName: item.file.name,
            fileSizeBytes: item.file.size, fileUrl: reader.result,
            tags: item.tags.split(",").map(t=>t.trim()).filter(Boolean),
          })
        });
        setQueue(q => q.map(i => i.key===item.key ? (res.ok?{...i,status:"done",progress:100}:{...i,status:"error",error:"Lỗi server"}) : i));
        if (res.ok) fetchAll();
      } catch { setQueue(q => q.map(i => i.key===item.key ? {...i,status:"error",error:"Lỗi kết nối"} : i)); }
    };
    reader.readAsDataURL(item.file);
  };

  const fmt = (b: number) => b>=1048576 ? `${(b/1048576).toFixed(1)}MB` : `${(b/1024).toFixed(0)}KB`;

  const filteredAll = materials.filter(m =>
    (filterRole==="all"||m.uploaderRole===filterRole) &&
    (m.title.toLowerCase().includes(search.toLowerCase())||m.uploaderName?.toLowerCase().includes(search.toLowerCase()))
  );

  const MaterialCard = ({ m, showActions }: { m: Material; showActions?: boolean }) => {
    const ft = FILE_TYPES[m.fileType]||FILE_TYPES.pdf;
    const sc = STATUS_CONFIG[m.status]||STATUS_CONFIG.pending_review;
    return (
      <div className="px-6 py-5 flex items-start gap-4 hover:bg-slate-50 dark:bg-[#051329] dark:hover:bg-[#0C2E5E]/25 transition-colors">
        <div className={`w-10 h-10 rounded-xl ${ft.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <span className={`material-symbols-outlined ${ft.color}`}>{ft.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="font-bold text-on-surface dark:text-[#E2E8F0] text-sm">{m.title}</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-0.5 ${sc.cls}`}>
              <span className="material-symbols-outlined text-[10px]">{sc.icon}</span>{sc.label}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
            {m.uploaderName} · {m.uploaderRole==="teacher"?"Giảng viên":"Admin"} · {m.subject} · {CAT_LABELS[m.category]||m.category}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-300">{new Date(m.createdAt).toLocaleDateString("vi-VN")} · {fmt(m.fileSizeBytes)} · {m.downloadCount} lượt tải</p>
          {m.status==="rejected"&&m.rejectionReason&&(
            <p className="text-xs text-red-600 mt-1">Lý do: {m.rejectionReason}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {showActions && m.status==="pending_review" && (
            <>
              <button onClick={()=>review(m.id,"approve")}
                className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg hover:bg-green-200 transition-all flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">check</span>Duyệt
              </button>
              <button onClick={()=>{ setRejectTarget(m.id); setRejectReason(""); }}
                className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-all flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">close</span>Từ chối
              </button>
            </>
          )}
          <button onClick={()=>handleDelete(m.id)}
            className="p-2 rounded-xl hover:bg-red-50 text-on-surface-variant dark:text-slate-400 hover:text-red-600 transition-all">
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section>
        <h1 className="text-3xl font-extrabold text-on-surface dark:text-[#E2E8F0] tracking-tight mb-1">Quản lý tài liệu</h1>
        <p className="text-on-surface-variant dark:text-slate-400">Duyệt tài liệu giảng viên và quản lý tài liệu hệ thống.</p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Chờ duyệt", value: pending.length, icon: "schedule", color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Đã công khai", value: materials.filter(m=>m.status==="published").length, icon: "public", color: "text-green-500", bg: "bg-green-50" },
          { label: "Từ chối", value: materials.filter(m=>m.status==="rejected").length, icon: "cancel", color: "text-red-500", bg: "bg-red-50" },
          { label: "Tổng tài liệu", value: materials.length, icon: "folder", color: "text-blue-500", bg: "bg-blue-50" },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-[#0A1F3E]/95 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl p-5 shadow-sm flex items-center gap-4">
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-cyan-950/40">
        {([["pending","Chờ duyệt","schedule"],["all","Tất cả","folder"],["upload","Upload hệ thống","upload"]] as const).map(([key,label,icon])=>(
          <button key={key} onClick={()=>setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${tab===key?"border-primary text-primary":"border-transparent text-on-surface-variant dark:text-slate-400 hover:text-on-surface"}`}>
            <span className="material-symbols-outlined text-lg">{icon}</span>{label}
            {key==="pending"&&pending.length>0&&(
              <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Pending Review */}
      {tab==="pending" && (
        <section className="bg-white dark:bg-[#0A1F3E]/95 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"/></div>
          ) : pending.length===0 ? (
            <div className="p-16 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant dark:text-slate-400/30 block mb-3">done_all</span>
              <p className="text-on-surface-variant dark:text-slate-400 font-medium">Không có tài liệu nào cần duyệt.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-cyan-950/40">
              {pending.map(m=><MaterialCard key={m.id} m={m} showActions />)}
            </div>
          )}
        </section>
      )}

      {/* Tab: All Materials */}
      {tab==="all" && (
        <section className="bg-white dark:bg-[#0A1F3E]/95 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-cyan-950/40 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-base">search</span>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] text-sm focus:outline-none focus:border-primary"
                placeholder="Tìm kiếm..." />
            </div>
            <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] text-xs font-bold focus:outline-none">
              <option value="all">Tất cả vai trò</option>
              <option value="teacher">Giảng viên</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {loading ? <div className="p-16 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"/></div>
            : <div className="divide-y divide-slate-100 dark:divide-cyan-950/40">{filteredAll.map(m=><MaterialCard key={m.id} m={m} />)}</div>}
        </section>
      )}

      {/* Tab: Upload System Docs */}
      {tab==="upload" && (
        <section className="space-y-6">
          <div
            onDragOver={e=>{e.preventDefault();setDragging(true)}}
            onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files)}}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
              ${dragging?"border-primary bg-primary/5":"border-outline-variant/40 bg-surface-container dark:bg-[#051329]-lowest hover:border-primary/40"}`}
            onClick={()=>document.getElementById("admin-file-input")?.click()}
          >
            <input id="admin-file-input" type="file" className="hidden" multiple
              accept=".pdf,.pptx,.ppt,.docx,.doc,video/*"
              onChange={e=>addFiles(e.target.files)} />
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
            </div>
            <h3 className="font-bold text-on-surface dark:text-[#E2E8F0] mb-1">Upload tài liệu hệ thống</h3>
            <p className="text-xs text-on-surface-variant dark:text-slate-400">Hướng dẫn, FAQ, Quy trình · PDF, PPTX, DOCX, Video · Tối đa 50MB</p>
          </div>

          {queue.length>0&&(
            <div className="bg-white dark:bg-[#0A1F3E]/95 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-cyan-950/40 flex items-center justify-between">
                <h2 className="font-bold text-on-surface dark:text-[#E2E8F0]">Hàng chờ ({queue.length})</h2>
                <button onClick={()=>queue.filter(i=>i.status==="idle").forEach(uploadItem)}
                  className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>Upload tất cả
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-cyan-950/40">
                {queue.map(item=>(
                  <div key={item.key} className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${FILE_TYPES[item.fileType]?.bg||"bg-slate-50 dark:bg-[#051329]"}`}>
                        <span className={`material-symbols-outlined ${FILE_TYPES[item.fileType]?.color||"text-slate-500"}`}>{FILE_TYPES[item.fileType]?.icon||"description"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.file.name}</p>
                        <p className="text-xs text-on-surface-variant dark:text-slate-400">{fmt(item.file.size)}</p>
                      </div>
                      {item.status==="idle"&&<button onClick={()=>uploadItem(item)} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20">Upload</button>}
                      {item.status==="done"&&<span className="text-green-600 material-symbols-outlined">check_circle</span>}
                      {item.status==="error"&&<span className="text-red-500 text-xs">{item.error}</span>}
                      <button onClick={()=>setQueue(q=>q.filter(i=>i.key!==item.key))} className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 hover:text-error text-xl">close</button>
                    </div>
                    {item.status==="idle"&&(
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input value={item.title} onChange={e=>setQueue(q=>q.map(i=>i.key===item.key?{...i,title:e.target.value}:i))}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] text-sm focus:outline-none focus:border-primary" placeholder="Tiêu đề..." />
                        <input value={item.subject} onChange={e=>setQueue(q=>q.map(i=>i.key===item.key?{...i,subject:e.target.value}:i))}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] text-sm focus:outline-none focus:border-primary" placeholder="Chủ đề..." />
                        <select value={item.category} onChange={e=>setQueue(q=>q.map(i=>i.key===item.key?{...i,category:e.target.value}:i))}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] text-sm focus:outline-none focus:border-primary">
                          {CATS.map(c=><option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                        </select>
                        <input value={item.tags} onChange={e=>setQueue(q=>q.map(i=>i.key===item.key?{...i,tags:e.target.value}:i))}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] text-sm focus:outline-none focus:border-primary sm:col-span-3" placeholder="Thẻ (cách nhau bằng dấu phẩy)..." />
                      </div>
                    )}
                    {item.status==="uploading"&&(
                      <div className="w-full bg-surface-container dark:bg-[#051329] rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{width:`${item.progress}%`}}/>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0A1F3E]/95 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-on-surface dark:text-[#E2E8F0] text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">cancel</span>Lý do từ chối
            </h3>
            <textarea rows={3} value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] text-sm focus:outline-none focus:border-red-400 resize-none"
              placeholder="Vui lòng nhập lý do từ chối tài liệu này..." />
            <div className="flex gap-3">
              <button onClick={()=>setRejectTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface dark:text-[#E2E8F0] font-bold text-sm">Hủy</button>
              <button onClick={()=>review(rejectTarget,"reject",rejectReason)}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-50 transition-all">
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
