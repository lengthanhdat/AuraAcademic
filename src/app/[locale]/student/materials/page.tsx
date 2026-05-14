"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const FILE_TYPES: Record<string, { icon: string; color: string; bg: string }> = {
  pdf:   { icon: "picture_as_pdf", color: "text-red-600",    bg: "bg-red-50"    },
  pptx:  { icon: "slideshow",      color: "text-orange-500", bg: "bg-orange-50" },
  docx:  { icon: "description",    color: "text-blue-600",   bg: "bg-blue-50"   },
  video: { icon: "play_circle",    color: "text-violet-600", bg: "bg-violet-50" },
  link:  { icon: "link",           color: "text-teal-600",   bg: "bg-teal-50"   },
};



type Material = {
  id: string; title: string; description: string; subject: string;
  category: string; fileType: string; fileName: string; fileSizeBytes: number;
  tags: string[]; fileUrl: string; status: string; uploaderName: string;
  createdAt: string; downloadCount: number;
};

export default function StudentMaterials() {
  const t = useTranslations('StudentMaterials');
  const CAT_LABELS: Record<string, string> = { lecture: t('cat_lecture'), exercise: t('cat_exercise'), reference: t('cat_reference'), guide: t('cat_guide'), faq: t('cat_faq') };
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"date"|"downloads">("date");
  const [previewItem, setPreviewItem] = useState<Material|null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  
  // PPTX state hooks
  const [pptxLoading, setPptxLoading] = useState<boolean | string>(false);
  const [pptxSlideCount, setPptxSlideCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pptxRenderer, setPptxRenderer] = useState<any>(null);

  // Xử lý chuyển đổi Base64 -> Blob URL an toàn để trình duyệt xem mượt mà
  useEffect(() => {
    setDocxHtml(null); // Reset HTML khi đổi file
    setPptxSlideCount(0);
    setCurrentSlide(0);
    setPptxRenderer(null);
    setPptxLoading(false);
    if (!previewItem?.fileUrl) {
      setBlobUrl(null);
      return;
    }
    
    // Nếu fileUrl đã là link https:// thì dùng luôn
    if (!previewItem.fileUrl.startsWith("data:")) {
      setBlobUrl(previewItem.fileUrl);
      return;
    }

    try {
      const [header, base64Data] = previewItem.fileUrl.split(",");
      const mime = header.match(/:(.*?);/)?.[1] || "application/octet-stream";
      const byteChars = atob(base64Data);
      const byteArrays = [];
      for (let i = 0; i < byteChars.length; i += 512) {
        const slice = byteChars.slice(i, i + 512);
        const byteNumbers = new Array(slice.length);
        for (let j = 0; j < slice.length; j++) byteNumbers[j] = slice.charCodeAt(j);
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      const blob = new Blob(byteArrays, { type: mime });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      // XỬ LÝ ĐẶC BIỆT CHO DOCX
      if (previewItem.fileType === 'docx' || mime.includes("wordprocessingml.document")) {
        renderDocx(blob);
      }
      
      // XỬ LÝ ĐẶC BIỆT CHO PPTX
      if (previewItem.fileType === 'pptx' || mime.includes("presentationml.presentation")) {
        renderPptx(blob);
      }

      // Dọn dẹp bộ nhớ khi đóng modal
      return () => URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Lỗi parse file preview:", e);
      setBlobUrl(null);
    }
  }, [previewItem]);

  const renderDocx = async (blob: Blob) => {
    try {
      // Tải động thư viện mammoth để parse Docx -> Html trên Client
      if (!(window as any).mammoth) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
      }
      
      const arrayBuffer = await blob.arrayBuffer();
      const result = await (window as any).mammoth.convertToHtml({ arrayBuffer });
      setDocxHtml(result.value);
    } catch (err) {
      console.error("Lỗi render docx:", err);
      setDocxHtml("ERR");
    }
  };

  const renderPptx = async (blob: Blob) => {
    setPptxLoading(true);
    try {
      // Bước 1: Nạp thư viện nén JSZip bắt buộc (Standard UMD script)
      if (!(window as any).JSZip) {
        const jsZipScript = document.createElement("script");
        jsZipScript.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
        jsZipScript.async = true;
        document.body.appendChild(jsZipScript);
        await new Promise(r => jsZipScript.onload = r);
      }

      // Bước 1.5: Nạp Chart.js (Một số slide có đồ thị yêu cầu bắt buộc này)
      if (!(window as any).Chart) {
        const chartScript = document.createElement("script");
        chartScript.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
        chartScript.async = true;
        document.body.appendChild(chartScript);
        await new Promise(r => chartScript.onload = r);
      }

      // Bước 2: Nạp thư viện PptxViewJS nguyên khối (Standard UMD script)
      if (!(window as any).PptxViewJS) {
        const pptxScript = document.createElement("script");
        pptxScript.src = "https://cdn.jsdelivr.net/npm/pptxviewjs@1.1.9/dist/PptxViewJS.min.js";
        pptxScript.async = true;
        document.body.appendChild(pptxScript);
        await new Promise(r => pptxScript.onload = r);
      }

      // Chờ thêm 100ms đảm bảo window đã nhận diện namespace toàn cục
      await new Promise(r => setTimeout(r, 150));

      const lib = (window as any).PptxViewJS;
      if (!lib) throw new Error("PptxViewJS not exposed to window");

      // Khởi tạo Presentation để lấy số slide trước
      // Thư viện này cần Canvas để gắn kết lúc Render
      // Sẽ lưu instance thư viện lại vào state
      const PPTXViewer = lib.PPTXViewer;
      // Lưu trữ reference thư viện và blob để useEffect xử lý render canvas sau
      setPptxRenderer({ PPTXViewer, blob });
      // Mặc định set tạm slide, số lượng thật sẽ update khi parse xong ở hook
      setPptxLoading(false);
    } catch (err: any) {
      console.error("Lỗi nạp UMD PowerPoint:", err);
      setPptxLoading("ERR: " + (err.message || "Failed to load UMD"));
    }
  };

  // Hook render Canvas PowerPoint khi đổi slide hoặc khi lib sẵn sàng
  useEffect(() => {
    if (!pptxRenderer?.PPTXViewer || !pptxRenderer?.blob) return;
    
    const runRender = async () => {
      const canvas = document.getElementById("pptx-canvas") as HTMLCanvasElement;
      if (!canvas) return;

      try {
        // Nếu chưa có instance renderer thật sự, khởi tạo nó gắn với canvas
        if (!pptxRenderer.instance) {
          const viewerInstance = new pptxRenderer.PPTXViewer({ canvas });
          
          // Quan trọng: Lắng nghe sự kiện đã nạp xong hoàn toàn trước khi cập nhật UI
          viewerInstance.on('loadComplete', (data: any) => {
            const count = viewerInstance.getSlideCount();
            console.log("Loaded slides count:", count);
            setPptxSlideCount(count > 0 ? count : 1);
            viewerInstance.goToSlide(0).catch(()=>{});
          });

          // CHUYỂN ĐỔI BLOB SANG ARRAYBUFFER ĐỂ THƯ VIỆN TIÊU THỤ CHUẨN XÁC
          const buffer = await pptxRenderer.blob.arrayBuffer();
          await viewerInstance.loadFile(buffer);
          
          // Chạy render lần đầu để dựng hình cơ bản
          await viewerInstance.render().catch(()=>{});
          
          // Cập nhật instance
          setPptxRenderer((prev: any) => ({ ...prev, instance: viewerInstance }));
        } else {
          // Chuyển slide bằng instance đã cache
          await pptxRenderer.instance.goToSlide(currentSlide).catch(()=>{});
        }
      } catch (err: any) {
        console.error("Render error:", err);
      }
    };
    runRender();
  }, [pptxRenderer?.PPTXViewer, currentSlide]);

  useEffect(() => { fetchMaterials(); }, []);

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:8088/api/materials/published", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) setMaterials(await res.json());
    } catch {/**/} finally { setLoading(false); }
  };

  const trackDownload = async (m: Material) => {
    const token = localStorage.getItem("accessToken");
    await fetch(`http://localhost:8088/api/materials/${m.id}/download`, {
      method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).catch(()=>{});
    // Trigger download by creating link from base64
    if (m.fileUrl?.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = m.fileUrl;
      link.download = m.fileName || m.title;
      link.click();
    } else if (m.fileUrl) {
      window.open(m.fileUrl, "_blank");
    }
  };

  const subjects = ["all", ...Array.from(new Set(materials.map(m => m.subject).filter(Boolean)))];
  const categories = ["all", ...Array.from(new Set(materials.map(m => m.category).filter(Boolean)))];

  const featured = materials.filter(m => ["guide","faq"].includes(m.category)).slice(0,2);

  const filtered = materials
    .filter(m =>
      (subject==="all"||m.subject===subject) &&
      (category==="all"||m.category===category) &&
      (m.title.toLowerCase().includes(search.toLowerCase())||
       m.description?.toLowerCase().includes(search.toLowerCase())||
       m.tags?.some(t=>t.toLowerCase().includes(search.toLowerCase())))
    )
    .sort((a,b) => sortBy==="date"
      ? new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()
      : b.downloadCount-a.downloadCount);

  const fmt = (b: number) => b>=1048576?`${(b/1048576).toFixed(1)}MB`:`${(b/1024).toFixed(0)}KB`;

  return (
    <main className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-extrabold text-on-surface dark:text-slate-200 tracking-tight mb-1">{t('title')}</h1>
        <p className="text-on-surface-variant dark:text-slate-400">{t('subtitle')}</p>
      </section>

      {/* Featured */}
      {!loading && featured.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-on-surface-variant dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg">star</span>Tài liệu nổi bật
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map(m => {
              const ft = FILE_TYPES[m.fileType]||FILE_TYPES.pdf;
              return (
                <div key={m.id} className="group bg-white dark:bg-[#0A1F3E]/90 hover:bg-slate-50 dark:hover:bg-[#0C2E5E]/60 rounded-2xl p-6 border border-slate-200/60 dark:border-cyan-950/40 flex gap-4 transition-all hover:shadow-md">
                  <div className={`w-12 h-12 rounded-xl ${ft.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined ${ft.color} text-2xl`}>{ft.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-on-surface dark:text-slate-200 group-hover:text-primary transition-colors leading-snug">{m.title}</h3>
                    <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 line-clamp-2">{m.description}</p>
                    <p className="text-[10px] text-on-surface-variant dark:text-slate-300 mt-2">{m.uploaderName} · {CAT_LABELS[m.category]||m.category}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={()=>setPreviewItem(m)} className="p-2 rounded-xl bg-surface/80 hover:bg-white dark:bg-[#0A1F3E] text-on-surface-variant dark:text-slate-400 hover:text-primary transition-all" title={t('btn_download')}>
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <button onClick={()=>trackDownload(m)} className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all" title={t('btn_download')}>
                      <span className="material-symbols-outlined text-lg">download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Search & Filters */}
      <section className="bg-white dark:bg-[#0A1F3E]/90 border border-slate-200/60 dark:border-cyan-950/40 shadow-sm rounded-2xl p-5 shadow-sm space-y-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-lg">search</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] focus:border-blue-400 outline-none transition-colors text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder={t('search_placeholder')} />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400">{t('subject_label')}</span>
          {subjects.map(s=>(
            <button key={s} onClick={()=>setSubject(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                subject===s
                  ? "bg-[#0C2E5E] dark:bg-[#00C6FF] text-white dark:text-[#051329] border-[#0C2E5E] dark:border-[#00C6FF] shadow-sm"
                  : "bg-slate-100 dark:bg-[#0A1F3E] text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-cyan-950/50 hover:bg-slate-200 dark:hover:bg-cyan-950/50"
              }`}>
              {s==="all"?t("all"):s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400">{t('type_label')}</span>
            {categories.map(c=>(
              <button key={c} onClick={()=>setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                  category===c
                    ? "bg-[#0C2E5E] dark:bg-[#00C6FF] text-white dark:text-[#051329] border-[#0C2E5E] dark:border-[#00C6FF] shadow-sm"
                    : "bg-slate-100 dark:bg-[#0A1F3E] text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-cyan-950/50 hover:bg-slate-200 dark:hover:bg-cyan-950/50"
                }`}>
                {c==="all"?t("all"):(CAT_LABELS[c]||c)}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] focus:border-blue-400 outline-none transition-colors text-xs font-bold focus:outline-none focus:border-primary">
            <option value="date">{t('sort_date')}</option>
            <option value="downloads">{t('sort_downloads')}</option>
          </select>
        </div>
      </section>

      {/* Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-on-surface dark:text-slate-200">{t('all_title')}</h2>
          <span className="text-xs text-on-surface-variant dark:text-slate-400">{filtered.length} {t('materials_count')}</span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
            <p className="text-on-surface-variant dark:text-slate-400 text-sm">{t('loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#0A1F3E]/90 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl p-16 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant dark:text-slate-400/30 block mb-4">search_off</span>
            <p className="text-on-surface-variant dark:text-slate-400 font-medium">{t('empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(m => {
              const ft = FILE_TYPES[m.fileType]||FILE_TYPES.pdf;
              return (
                <div key={m.id} className="group bg-white dark:bg-[#0A1F3E]/90 border border-slate-200/60 dark:border-cyan-950/40 shadow-sm rounded-2xl p-5 shadow-sm hover:shadow-md border border-transparent hover:border-primary/10 transition-all hover:-translate-y-0.5 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${ft.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-symbols-outlined ${ft.color}`}>{ft.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-on-surface dark:text-slate-200 text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{m.title}</h3>
                      <p className="text-[10px] text-on-surface-variant dark:text-slate-400 mt-0.5">{m.subject} {m.subject&&"·"} {CAT_LABELS[m.category]||m.category}</p>
                    </div>
                  </div>
                  {m.description && <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed line-clamp-2">{m.description}</p>}
                  {m.tags?.length>0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.tags.slice(0,3).map(t=>(
                        <span key={t} className="px-2 py-0.5 bg-surface-container dark:bg-cyan-950/50 rounded-full text-[10px] font-bold text-on-surface-variant dark:text-cyan-300">#{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-100 dark:border-cyan-950/50 flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-[10px] text-on-surface-variant dark:text-slate-300 font-medium">{m.uploaderName}</p>
                      <p className="text-[10px] text-on-surface-variant dark:text-slate-300">{m.fileSizeBytes?fmt(m.fileSizeBytes):""} · {m.downloadCount} {t('downloads')}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>setPreviewItem(m)}
                        className="p-2 rounded-xl hover:bg-surface-container dark:bg-cyan-950/20 text-on-surface-variant dark:text-slate-400 hover:text-primary transition-all" title={t('btn_download')}>
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button onClick={()=>trackDownload(m)}
                        className="p-2 rounded-xl hover:bg-primary/10 text-on-surface-variant dark:text-slate-400 hover:text-primary transition-all" title={t('btn_download')}>
                        <span className="material-symbols-outlined text-lg">download</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-container-low dark:bg-cyan-950/30 dark:bg-[#0A1F3E]/80 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/10">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-cyan-950/40 bg-white/80 dark:bg-[#0A1F3E]/90 backdrop-blur-md z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${(FILE_TYPES[previewItem.fileType]||FILE_TYPES.pdf).bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <span className={`material-symbols-outlined ${(FILE_TYPES[previewItem.fileType]||FILE_TYPES.pdf).color}`}>{(FILE_TYPES[previewItem.fileType]||FILE_TYPES.pdf).icon}</span>
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-on-surface dark:text-slate-200 truncate leading-tight">{previewItem.title}</h3>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400/80 mt-0.5 flex items-center gap-1.5">
                    <span className="font-medium">{previewItem.uploaderName}</span>
                    <span className="opacity-40">•</span>
                    <span>{CAT_LABELS[previewItem.category]||previewItem.category}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={()=>trackDownload(previewItem)}
                  className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/20 active:scale-95">
                  <span className="material-symbols-outlined text-base">download</span>Tải xuống
                </button>
                <div className="w-px h-6 bg-outline-variant mx-1" />
                <button onClick={()=>setPreviewItem(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-cyan-950/50 dark:text-slate-200 text-on-surface-variant hover:text-on-surface dark:text-slate-200 transition-all">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Modal Content Split */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#121212]/5">
              
              {/* Left/Main Pane: The actual viewer */}
              <div className="flex-1 bg-slate-900/5 relative flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-outline-variant">
                {!blobUrl ? (
                   <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm font-medium">Đang tải tệp tin...</p>
                   </div>
                ) : previewItem.fileType === 'pdf' || previewItem.fileUrl?.includes("application/pdf") ? (
                  <iframe 
                    src={`${blobUrl}#toolbar=0&navpanes=0`} 
                    className="w-full h-full border-none shadow-inner bg-slate-800"
                    title="PDF Viewer"
                  />
                ) : previewItem.fileType === 'video' || previewItem.fileUrl?.includes("video/") ? (
                  <video src={blobUrl} controls controlsList="nodownload" className="max-w-full max-h-full bg-black object-contain" />
                ) : previewItem.fileType === 'image' || previewItem.fileUrl?.includes("image/") ? (
                  <img src={blobUrl} alt={previewItem.title} className="max-w-full max-h-full object-contain drop-shadow-2xl p-4" />
                ) : (previewItem.fileType === 'docx' || previewItem.fileUrl?.includes("wordprocessingml.document")) ? (
                   docxHtml === "ERR" ? (
                    <div className="flex flex-col items-center justify-center text-center p-8">
                      <span className="material-symbols-outlined text-6xl text-red-400 mb-4">error_outline</span>
                      <h4 className="font-bold text-on-surface dark:text-slate-200">Lỗi đọc tài liệu Word</h4>
                      <p className="text-sm text-on-surface-variant dark:text-slate-400">Không thể mở tệp xem trước.</p>
                    </div>
                  ) : !docxHtml ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                      <div className="w-10 h-10 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-sm font-medium text-blue-600">Đang chuyển đổi Docx...</p>
                    </div>
                  ) : (
                    <div className="w-full h-full overflow-y-auto bg-[#f8fafc] p-8 sm:p-12 shadow-inner scrollbar-thin">
                      <style>{`
                        .docx-preview-content p { margin-bottom: 1rem; line-height: 1.6; }
                        .docx-preview-content h1 { font-size: 1.8em; font-weight: 800; margin: 1.5em 0 0.5em; color: #1e293b; }
                        .docx-preview-content h2 { font-size: 1.5em; font-weight: 700; margin: 1.2em 0 0.5em; color: #1e293b; }
                        .docx-preview-content h3 { font-size: 1.25em; font-weight: 600; margin: 1em 0 0.5em; color: #334155; }
                        .docx-preview-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                        .docx-preview-content td, .docx-preview-content th { border: 1px solid #cbd5e1; padding: 8px; }
                        .docx-preview-content ul, .docx-preview-content ol { padding-left: 1.5em; margin-bottom: 1rem; }
                        .docx-preview-content li { margin-bottom: 0.25rem; }
                      `}</style>
                      <div 
                        className="max-w-3xl mx-auto bg-white dark:bg-[#0A1F3E] border border-slate-200 shadow-lg rounded-sm p-8 sm:p-12 docx-preview-content text-slate-800 min-h-[800px]"
                        dangerouslySetInnerHTML={{ __html: docxHtml }} 
                      />
                    </div>
                  )
                ) : (previewItem.fileType === 'pptx' || previewItem.fileUrl?.includes("presentationml.presentation")) ? (
                  pptxLoading === true ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                      <div className="w-10 h-10 border-4 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
                      <p className="text-sm font-medium text-orange-500">Đang chuẩn bị bản trình chiếu...</p>
                    </div>
                  ) : (!pptxRenderer || typeof pptxLoading === "string") ? (
                    <div className="flex flex-col items-center justify-center text-center p-8">
                      <span className="material-symbols-outlined text-6xl text-red-400 mb-4">warning_amber</span>
                      <h4 className="font-bold text-on-surface dark:text-slate-200">Không thể giải mã bản trình chiếu</h4>
                      <p className="text-sm text-on-surface-variant dark:text-slate-400 max-w-md mb-4">Rất tiếc, trình duyệt không thể tự dựng hình tệp tin PPTX này.</p>
                      {typeof pptxLoading === "string" && (
                        <p className="text-[10px] font-mono bg-red-50 text-red-600 p-2 rounded border border-red-100 max-w-md overflow-hidden truncate">
                          Debug: {pptxLoading}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-[#1e1e1e] flex flex-col">
                      {/* Navigation Overlay Bottom */}
                      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                        <div className="relative bg-white dark:bg-[#0A1F3E] shadow-2xl max-w-full flex items-center justify-center">
                          <canvas id="pptx-canvas" className="max-w-full max-h-[calc(85vh-180px)] object-contain" />
                        </div>
                        
                        {/* Previous/Next Hover zones */}
                        <button 
                          disabled={currentSlide === 0}
                          onClick={()=>setCurrentSlide(s => Math.max(0, s-1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all disabled:opacity-20 group cursor-pointer active:scale-90"
                        >
                          <span className="material-symbols-outlined text-2xl">chevron_left</span>
                        </button>
                        <button 
                          disabled={currentSlide >= pptxSlideCount - 1}
                          onClick={()=>setCurrentSlide(s => Math.min(pptxSlideCount - 1, s+1))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all disabled:opacity-20 group cursor-pointer active:scale-90"
                        >
                          <span className="material-symbols-outlined text-2xl">chevron_right</span>
                        </button>
                      </div>
                      
                      {/* Control Bar */}
                      <div className="bg-black/90 backdrop-blur-md px-6 py-3 flex items-center justify-between text-white/90 text-sm border-t border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-orange-400 flex items-center gap-1"><span className="material-symbols-outlined text-base">slideshow</span> SLIDE</span>
                          <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                             <span className="font-black text-white">{currentSlide + 1}</span>
                             <span className="opacity-40">/</span>
                             <span className="font-medium text-white/60">{pptxSlideCount}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            disabled={currentSlide === 0}
                            onClick={()=>setCurrentSlide(0)}
                            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30" title="Về đầu trang">
                            <span className="material-symbols-outlined text-lg">first_page</span>
                          </button>
                          <button 
                            disabled={currentSlide >= pptxSlideCount - 1}
                            onClick={()=>setCurrentSlide(pptxSlideCount - 1)}
                            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30" title="Cuối trang">
                            <span className="material-symbols-outlined text-lg">last_page</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">insert_drive_file</span>
                    <h4 className="font-bold text-on-surface dark:text-slate-200 mb-2">Định dạng này yêu cầu tải xuống</h4>
                    <p className="text-sm text-on-surface-variant dark:text-slate-400 max-w-xs mb-6">Rất tiếc, trình duyệt không hỗ trợ xem trước trực tiếp định dạng {previewItem.fileType}. Vui lòng tải về máy để xem nội dung.</p>
                    <button onClick={()=>trackDownload(previewItem)} className="px-6 py-2.5 bg-surface-container-high dark:bg-cyan-950/50 dark:bg-cyan-950/50 text-on-surface dark:text-slate-200 font-bold rounded-xl hover:bg-outline-variant transition-all flex items-center gap-2">
                       <span className="material-symbols-outlined text-lg">download_for_offline</span> Tải ngay ({previewItem.fileSizeBytes?fmt(previewItem.fileSizeBytes):"Unknown"})
                    </button>
                  </div>
                )}
              </div>

              {/* Right Pane: Sidebar for info */}
              <div className="w-full lg:w-72 flex-shrink-0 bg-slate-50 dark:bg-[#0A1F3E] border-l border-slate-200 dark:border-cyan-950/40 overflow-y-auto p-6 space-y-6 flex flex-col">
                <div>
                  <h4 className="text-xs font-black text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-2">Mô tả tài liệu</h4>
                  <p className="text-sm text-on-surface dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-[#051329] p-4 rounded-xl border border-slate-200 dark:border-cyan-950/40 border border-outline-variant">
                    {previewItem.description || <span className="italic opacity-50">Không có mô tả bổ sung.</span>}
                  </p>
                </div>

                {previewItem.tags?.length>0 && (
                  <div>
                    <h4 className="text-xs font-black text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-2">Từ khóa (Tags)</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {previewItem.tags.map(t=>(
                        <span key={t} className="px-2.5 py-1 bg-primary/10 dark:bg-cyan-950/40 text-primary dark:text-cyan-300 rounded-lg text-[11px] font-bold">#{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-6 space-y-2">
                  <h4 className="text-xs font-black text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-3">Thông tin tệp</h4>
                  {[
                    { icon: "database", label: t("modal_size"), value: previewItem.fileSizeBytes ? fmt(previewItem.fileSizeBytes) : "—" },
                    { icon: "download", label: t("modal_downloads"), value: `${previewItem.downloadCount} lượt` },
                    { icon: "calendar_today", label: t("modal_date"), value: new Date(previewItem.createdAt).toLocaleDateString("vi-VN") },
                  ].map(({icon, label, value})=>(
                    <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#051329] rounded-xl border border-slate-200 dark:border-cyan-950/40">
                      <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 text-lg">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-on-surface-variant dark:text-slate-400 font-bold uppercase leading-none mb-1">{label}</p>
                        <p className="text-sm font-black text-on-surface dark:text-slate-200 truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
