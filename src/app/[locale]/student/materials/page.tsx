"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";

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
  const locale = useLocale();
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

  useEffect(() => {
    setDocxHtml(null);
    setPptxSlideCount(0);
    setCurrentSlide(0);
    setPptxRenderer(null);
    setPptxLoading(false);
    if (!previewItem?.fileUrl) {
      setBlobUrl(null);
      return;
    }
    
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

      if (previewItem.fileType === 'docx' || mime.includes("wordprocessingml.document")) {
        renderDocx(blob);
      }
      
      if (previewItem.fileType === 'pptx' || mime.includes("presentationml.presentation")) {
        renderPptx(blob);
      }

      return () => URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Lỗi parse file preview:", e);
      setBlobUrl(null);
    }
  }, [previewItem]);

  const renderDocx = async (blob: Blob) => {
    try {
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
      if (!(window as any).JSZip) {
        const jsZipScript = document.createElement("script");
        jsZipScript.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
        jsZipScript.async = true;
        document.body.appendChild(jsZipScript);
        await new Promise(r => jsZipScript.onload = r);
      }

      if (!(window as any).Chart) {
        const chartScript = document.createElement("script");
        chartScript.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
        chartScript.async = true;
        document.body.appendChild(chartScript);
        await new Promise(r => chartScript.onload = r);
      }

      if (!(window as any).PptxViewJS) {
        const pptxScript = document.createElement("script");
        pptxScript.src = "https://cdn.jsdelivr.net/npm/pptxviewjs@1.1.9/dist/PptxViewJS.min.js";
        pptxScript.async = true;
        document.body.appendChild(pptxScript);
        await new Promise(r => pptxScript.onload = r);
      }

      await new Promise(r => setTimeout(r, 150));

      const lib = (window as any).PptxViewJS;
      if (!lib) throw new Error("PptxViewJS not exposed to window");

      const PPTXViewer = lib.PPTXViewer;
      setPptxRenderer({ PPTXViewer, blob });
      setPptxLoading(false);
    } catch (err: any) {
      console.error("Lỗi nạp UMD PowerPoint:", err);
      setPptxLoading("ERR: " + (err.message || "Failed to load UMD"));
    }
  };

  useEffect(() => {
    if (!pptxRenderer?.PPTXViewer || !pptxRenderer?.blob) return;
    
    const runRender = async () => {
      const canvas = document.getElementById("pptx-canvas") as HTMLCanvasElement;
      if (!canvas) return;

      try {
        if (!pptxRenderer.instance) {
          const viewerInstance = new pptxRenderer.PPTXViewer({ canvas });
          
          viewerInstance.on('loadComplete', (data: any) => {
            const count = viewerInstance.getSlideCount();
            setPptxSlideCount(count > 0 ? count : 1);
            viewerInstance.goToSlide(0).catch(()=>{});
          });

          const buffer = await pptxRenderer.blob.arrayBuffer();
          await viewerInstance.loadFile(buffer);
          
          await viewerInstance.render().catch(()=>{});
          
          setPptxRenderer((prev: any) => ({ ...prev, instance: viewerInstance }));
        } else {
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
  const totalDownloads = materials.reduce((sum, m) => sum + (m.downloadCount || 0), 0);
  const recentCount = materials.filter(m => Date.now() - new Date(m.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000).length;
  const fileTypeLabel = (type?: string) => ({
    pdf: "PDF",
    pptx: "Slide",
    docx: "Word",
    video: "Video",
    link: "Link",
  }[type || ""] || (type || t("file")).toUpperCase());
  const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US") : "—";

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-cyan-900/40 bg-white dark:bg-[#071A33] shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400" />
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_420px] lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-700 dark:border-cyan-800/60 dark:bg-cyan-950/40 dark:text-cyan-200">
              <span className="material-symbols-outlined text-base">auto_stories</span>
              {t('tag_repo')}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{t('title')}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{t('subtitle')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "folder_open", label: t('stat_docs'), value: materials.length },
              { icon: "school", label: t('stat_subjects'), value: subjects.length - 1 },
              { icon: "download", label: t('stat_downloads'), value: totalDownloads },
              { icon: "new_releases", label: t('stat_new'), value: recentCount },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-cyan-900/40 dark:bg-[#0B2445]">
                <span className="material-symbols-outlined text-xl text-sky-600 dark:text-cyan-300">{item.icon}</span>
                <p className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{item.value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {!loading && featured.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg">star</span>{t('featured')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map(m => {
              const ft = FILE_TYPES[m.fileType]||FILE_TYPES.pdf;
              return (
                <div key={m.id} className="group rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md dark:border-cyan-900/40 dark:bg-[#071A33] dark:hover:border-cyan-700/50">
                  <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${ft.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined ${ft.color} text-2xl`}>{ft.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-950 transition-colors group-hover:text-sky-700 dark:text-white dark:group-hover:text-cyan-200 leading-snug">{m.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{m.description}</p>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-2">{m.uploaderName} · {CAT_LABELS[m.category]||m.category}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={()=>setPreviewItem(m)} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-700 dark:bg-[#0B2445] dark:text-slate-300 dark:hover:bg-cyan-950/50 dark:hover:text-cyan-200 transition-all" title={t('btn_preview')}>
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <button onClick={()=>trackDownload(m)} className="p-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 dark:bg-cyan-400 dark:text-[#06172E] dark:hover:bg-cyan-300 transition-all" title={t('btn_download')}>
                      <span className="material-symbols-outlined text-lg">download</span>
                    </button>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Search & Filters */}
      <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-cyan-900/40 dark:bg-[#071A33]">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_190px_170px]">
          <label className="relative block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-cyan-900/50 dark:bg-[#0B2445] dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-950"
              placeholder={t('search_placeholder')} />
          </label>
          
          <select value={category} onChange={e=>setCategory(e.target.value)}
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-cyan-900/50 dark:bg-[#0B2445] dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-950">
            {categories.map(c => <option key={c} value={c}>{c==="all"?t("all"):(CAT_LABELS[c]||c)}</option>)}
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-cyan-900/50 dark:bg-[#0B2445] dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-950">
            <option value="date">{t('sort_date')}</option>
            <option value="downloads">{t('sort_downloads')}</option>
          </select>
        </div>
      </section>

      {/* Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-950 dark:text-white">{t('all_title')}</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-[#0B2445] dark:text-slate-300">{filtered.length} {t('materials_count')}</span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/70 bg-white p-16 text-center shadow-sm dark:border-cyan-900/40 dark:bg-[#071A33]">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 block mb-4">search_off</span>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{t('empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(m => {
              const ft = FILE_TYPES[m.fileType]||FILE_TYPES.pdf;
              return (
                <div key={m.id} className="group flex min-h-[230px] flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md dark:border-cyan-900/40 dark:bg-[#071A33] dark:hover:border-cyan-700/50">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${ft.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-symbols-outlined ${ft.color}`}>{ft.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-950 dark:text-white text-sm leading-snug group-hover:text-sky-700 dark:group-hover:text-cyan-200 transition-colors line-clamp-2">{m.title}</h3>
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">{m.subject || t('uncategorized')} {m.subject&&"·"} {CAT_LABELS[m.category]||m.category}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500 dark:bg-[#0B2445] dark:text-slate-300">{fileTypeLabel(m.fileType)}</span>
                  </div>
                  {m.description && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{m.description}</p>}
                  {m.tags?.length>0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.tags.slice(0,3).map(t=>(
                        <span key={t} className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-cyan-950/50 dark:text-cyan-300">#{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-100 dark:border-cyan-950/50 flex items-center justify-between mt-auto gap-3">
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300 font-bold">{m.uploaderName}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(m.createdAt)} · {m.fileSizeBytes?fmt(m.fileSizeBytes):"—"} · {m.downloadCount} {t('downloads')}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>setPreviewItem(m)}
                        className="p-2 rounded-xl text-slate-500 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-400 dark:hover:bg-cyan-950/50 dark:hover:text-cyan-200 transition-all" title={t('btn_preview')}>
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button onClick={()=>trackDownload(m)}
                        className="p-2 rounded-xl text-slate-500 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-400 dark:hover:bg-cyan-950/50 dark:hover:text-cyan-200 transition-all" title={t('btn_download')}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md animate-in fade-in duration-200 sm:p-6">
          <div className="flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl animate-in zoom-in-95 duration-300 dark:border-cyan-900/40 dark:bg-[#06172E]">
            
            {/* Modal Header */}
            <div className="z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-md dark:border-cyan-900/40 dark:bg-[#071A33]/95">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${(FILE_TYPES[previewItem.fileType]||FILE_TYPES.pdf).bg} shadow-sm`}>
                  <span className={`material-symbols-outlined text-2xl ${(FILE_TYPES[previewItem.fileType]||FILE_TYPES.pdf).color}`}>{(FILE_TYPES[previewItem.fileType]||FILE_TYPES.pdf).icon}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black leading-tight text-slate-950 dark:text-white">{previewItem.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>{previewItem.uploaderName}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span>{CAT_LABELS[previewItem.category]||previewItem.category}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase text-slate-600 dark:bg-cyan-950/50 dark:text-cyan-200">{fileTypeLabel(previewItem.fileType)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <button onClick={()=>trackDownload(previewItem)}
                  className="hidden items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:bg-slate-800 active:scale-95 dark:bg-cyan-400 dark:text-[#06172E] dark:hover:bg-cyan-300 sm:flex">
                  <span className="material-symbols-outlined text-base">download</span>{t('btn_download')}
                </button>
                <button onClick={()=>setPreviewItem(null)} className="rounded-2xl p-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-cyan-950/50 dark:hover:text-white" aria-label={t('btn_close_preview')}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Modal Content Split */}
            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden bg-slate-100 lg:grid-cols-[minmax(0,1fr)_320px] dark:bg-[#020B18]">
              
              {/* Left/Main Pane: The actual viewer */}
              <div className="relative flex min-h-0 items-center justify-center overflow-hidden border-b border-slate-200 bg-slate-100 lg:border-b-0 lg:border-r dark:border-cyan-900/40 dark:bg-[#020B18]">
                {!blobUrl ? (
                   <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
                      <p className="text-sm font-medium">{t('loading_file')}</p>
                   </div>
                ) : previewItem.fileType === 'pdf' || previewItem.fileUrl?.includes("application/pdf") ? (
                  <iframe 
                    src={`${blobUrl}#toolbar=1&navpanes=0&view=FitH`} 
                    className="h-full w-full border-none bg-slate-200 shadow-inner dark:bg-slate-950"
                    title="PDF Viewer"
                  />
                ) : previewItem.fileType === 'video' || previewItem.fileUrl?.includes("video/") ? (
                  <video src={blobUrl} controls controlsList="nodownload" className="max-w-full max-h-full bg-black object-contain" />
                ) : previewItem.fileType === 'image' || previewItem.fileUrl?.includes("image/") ? (
                  <Image src={blobUrl} alt={previewItem.title} fill unoptimized className="object-contain drop-shadow-2xl p-4" />
                ) : (previewItem.fileType === 'docx' || previewItem.fileUrl?.includes("wordprocessingml.document")) ? (
                   docxHtml === "ERR" ? (
                    <div className="flex flex-col items-center justify-center text-center p-8">
                      <span className="material-symbols-outlined text-6xl text-red-400 mb-4">error_outline</span>
                      <h4 className="font-bold text-on-surface dark:text-slate-200">{t('error_word')}</h4>
                      <p className="text-sm text-on-surface-variant dark:text-slate-400">{t('error_word_desc')}</p>
                    </div>
                  ) : !docxHtml ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                      <p className="text-sm font-medium text-blue-600">{t('converting_word')}</p>
                    </div>
                  ) : (
                    <div className="h-full w-full overflow-y-auto bg-slate-200/70 p-4 shadow-inner scrollbar-thin sm:p-8 dark:bg-[#020B18]">
                      <style>{`
                        .docx-preview-content { font-size: 16px; }
                        .docx-preview-content p { margin-bottom: 1rem; line-height: 1.65; }
                        .docx-preview-content h1 { font-size: 1.8em; font-weight: 800; margin: 1.5em 0 0.5em; color: #1e293b; }
                        .docx-preview-content h2 { font-size: 1.5em; font-weight: 700; margin: 1.2em 0 0.5em; color: #1e293b; }
                        .docx-preview-content h3 { font-size: 1.25em; font-weight: 600; margin: 1em 0 0.5em; color: #334155; }
                        .docx-preview-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                        .docx-preview-content td, .docx-preview-content th { border: 1px solid #cbd5e1; padding: 8px; }
                        .docx-preview-content ul, .docx-preview-content ol { padding-left: 1.5em; margin-bottom: 1rem; }
                        .docx-preview-content li { margin-bottom: 0.25rem; }
                      `}</style>
                      <div 
                        className="docx-preview-content mx-auto min-h-full max-w-[900px] rounded-xl border border-slate-200 bg-white p-8 text-slate-800 shadow-xl sm:p-12"
                        dangerouslySetInnerHTML={{ __html: docxHtml }} 
                      />
                    </div>
                  )
                ) : (previewItem.fileType === 'pptx' || previewItem.fileUrl?.includes("presentationml.presentation")) ? (
                  pptxLoading === true ? (
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
                      <p className="text-sm font-bold text-orange-500">{t('preparing_slide')}</p>
                    </div>
                  ) : (!pptxRenderer || typeof pptxLoading === "string") ? (
                    <div className="flex flex-col items-center justify-center text-center p-8">
                      <span className="material-symbols-outlined text-6xl text-red-400 mb-4">warning_amber</span>
                      <h4 className="font-bold text-on-surface dark:text-slate-200">{t('error_slide')}</h4>
                      <p className="text-sm text-on-surface-variant dark:text-slate-400 max-w-md mb-4">{t('error_slide_desc')}</p>
                      {typeof pptxLoading === "string" && (
                        <p className="text-[10px] font-mono bg-red-50 text-red-600 p-2 rounded border border-red-100 max-w-md overflow-hidden truncate">
                          Debug: {pptxLoading}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col bg-slate-100 dark:bg-[#07111F]">
                      <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-5 py-3 text-sm backdrop-blur dark:border-cyan-900/40 dark:bg-[#0B2445]/80">
                        <div className="flex items-center gap-2 font-black text-slate-800 dark:text-white">
                          <span className="material-symbols-outlined text-orange-500">slideshow</span>
                          {t('slide_title')}
                        </div>
                        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600 dark:border-cyan-900/40 dark:bg-[#071A33] dark:text-cyan-200">
                          Slide {currentSlide + 1} / {pptxSlideCount || 1}
                        </div>
                      </div>

                      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-5 sm:p-8">
                        <div className="relative flex aspect-video w-full max-w-[min(100%,calc((90vh-250px)*1.777))] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-cyan-900/40 dark:bg-white">
                          <canvas id="pptx-canvas" className="h-full w-full object-contain" />
                        </div>
                        
                        <button 
                          disabled={currentSlide === 0}
                          onClick={()=>setCurrentSlide(s => Math.max(0, s-1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-slate-200 bg-white/90 p-3 text-slate-800 shadow-lg transition-all hover:-translate-x-0.5 hover:bg-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-25 dark:border-cyan-900/40 dark:bg-[#0B2445]/90 dark:text-white"
                          title={t('slide_prev')}
                        >
                          <span className="material-symbols-outlined text-2xl">chevron_left</span>
                        </button>
                        <button 
                          disabled={currentSlide >= pptxSlideCount - 1}
                          onClick={()=>setCurrentSlide(s => Math.min(pptxSlideCount - 1, s+1))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-slate-200 bg-white/90 p-3 text-slate-800 shadow-lg transition-all hover:translate-x-0.5 hover:bg-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-25 dark:border-cyan-900/40 dark:bg-[#0B2445]/90 dark:text-white"
                          title={t('slide_next')}
                        >
                          <span className="material-symbols-outlined text-2xl">chevron_right</span>
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3 text-sm text-slate-600 dark:border-cyan-900/40 dark:bg-[#0B2445] dark:text-slate-300">
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-[#071A33]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-sky-500 transition-all"
                              style={{ width: `${((currentSlide + 1) / Math.max(pptxSlideCount || 1, 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 gap-2">
                          <button 
                            disabled={currentSlide === 0}
                            onClick={()=>setCurrentSlide(0)}
                            className="rounded-xl p-2 transition hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-cyan-950/40" title={t('slide_first')}>
                            <span className="material-symbols-outlined text-lg">first_page</span>
                          </button>
                          <button 
                            disabled={currentSlide >= pptxSlideCount - 1}
                            onClick={()=>setCurrentSlide(pptxSlideCount - 1)}
                            className="rounded-xl p-2 transition hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-cyan-950/40" title={t('slide_last')}>
                            <span className="material-symbols-outlined text-lg">last_page</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <span className="material-symbols-outlined mb-4 text-6xl text-sky-300">insert_drive_file</span>
                    <h4 className="font-bold text-on-surface dark:text-slate-200 mb-2">{t('req_download')}</h4>
                    <p className="text-sm text-on-surface-variant dark:text-slate-400 max-w-xs mb-6">{t('req_download_desc', { type: previewItem.fileType })}</p>
                    <button onClick={()=>trackDownload(previewItem)} className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 font-bold text-white transition-all hover:bg-slate-800 dark:bg-cyan-400 dark:text-[#06172E]">
                       <span className="material-symbols-outlined text-lg">download_for_offline</span> {t('btn_download_now')} ({previewItem.fileSizeBytes?fmt(previewItem.fileSizeBytes):t('unknown_size')})
                    </button>
                  </div>
                )}
              </div>

              {/* Right Pane: Sidebar for info */}
              <div className="flex max-h-[34vh] flex-col gap-4 overflow-y-auto border-t border-slate-200 bg-white p-4 lg:max-h-none lg:border-l lg:border-t-0 lg:p-5 dark:border-cyan-900/40 dark:bg-[#071A33]">
                <button onClick={()=>trackDownload(previewItem)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800 active:scale-95 dark:bg-cyan-400 dark:text-[#06172E] dark:hover:bg-cyan-300 sm:hidden">
                  <span className="material-symbols-outlined text-base">download</span>{t('btn_download')}
                </button>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-cyan-900/40 dark:bg-[#0B2445]">
                  <h4 className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('desc_title')}</h4>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    {previewItem.description || <span className="italic opacity-50">{t('desc_empty')}</span>}
                  </p>
                </div>

                {previewItem.tags?.length>0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-cyan-900/40 dark:bg-[#0B2445]">
                    <h4 className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('tags_title')}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {previewItem.tags.map(t=>(
                        <span key={t} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-sm dark:bg-cyan-950/50 dark:text-cyan-200">#{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="px-1 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('info_title')}</h4>
                  {[
                    { icon: "database", label: t("modal_size"), value: previewItem.fileSizeBytes ? fmt(previewItem.fileSizeBytes) : "—" },
                    { icon: "download", label: t("modal_downloads"), value: `${previewItem.downloadCount} ${t('downloads')}` },
                    { icon: "calendar_today", label: t("modal_date"), value: new Date(previewItem.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US") },
                  ].map(({icon, label, value})=>(
                    <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-cyan-900/40 dark:bg-[#0B2445]">
                      <span className="material-symbols-outlined text-lg text-slate-500 dark:text-slate-400">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="mb-1 text-[10px] font-bold uppercase leading-none text-slate-400 dark:text-slate-500">{label}</p>
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">{value}</p>
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
