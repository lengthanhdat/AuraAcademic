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
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1">{t('title')}</h1>
        <p className="text-on-surface-variant">{t('subtitle')}</p>
      </section>

      {/* Featured */}
      {!loading && featured.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg">star</span>Tài liệu nổi bật
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map(m => {
              const ft = FILE_TYPES[m.fileType]||FILE_TYPES.pdf;
              return (
                <div key={m.id} className="group bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 rounded-2xl p-6 border border-primary/10 flex gap-4 transition-all hover:shadow-md">
                  <div className={`w-12 h-12 rounded-xl ${ft.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined ${ft.color} text-2xl`}>{ft.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">{m.title}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{m.description}</p>
                    <p className="text-[10px] text-on-surface-variant/60 mt-2">{m.uploaderName} · {CAT_LABELS[m.category]||m.category}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={()=>setPreviewItem(m)} className="p-2 rounded-xl bg-surface/80 hover:bg-white text-on-surface-variant hover:text-primary transition-all" title={t('btn_download')}>
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
      <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder={t('search_placeholder')} />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-on-surface-variant">{t('subject_label')}</span>
          {subjects.map(s=>(
            <button key={s} onClick={()=>setSubject(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${subject===s?"bg-primary text-white":"bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
              {s==="all"?t("all"):s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs font-bold text-on-surface-variant">{t('type_label')}</span>
            {categories.map(c=>(
              <button key={c} onClick={()=>setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${category===c?"bg-surface-container-highest text-on-surface":"bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
                {c==="all"?t("all"):(CAT_LABELS[c]||c)}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-outline-variant bg-surface text-xs font-bold focus:outline-none focus:border-primary">
            <option value="date">{t('sort_date')}</option>
            <option value="downloads">{t('sort_downloads')}</option>
          </select>
        </div>
      </section>

      {/* Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-on-surface">{t('all_title')}</h2>
          <span className="text-xs text-on-surface-variant">{filtered.length} {t('materials_count')}</span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
            <p className="text-on-surface-variant text-sm">{t('loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-16 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 block mb-4">search_off</span>
            <p className="text-on-surface-variant font-medium">{t('empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(m => {
              const ft = FILE_TYPES[m.fileType]||FILE_TYPES.pdf;
              return (
                <div key={m.id} className="group bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md border border-transparent hover:border-primary/10 transition-all hover:-translate-y-0.5 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${ft.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-symbols-outlined ${ft.color}`}>{ft.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-on-surface text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{m.title}</h3>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{m.subject} {m.subject&&"·"} {CAT_LABELS[m.category]||m.category}</p>
                    </div>
                  </div>
                  {m.description && <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{m.description}</p>}
                  {m.tags?.length>0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.tags.slice(0,3).map(t=>(
                        <span key={t} className="px-2 py-0.5 bg-surface-container rounded-full text-[10px] font-bold text-on-surface-variant">#{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="pt-3 border-t border-surface-container flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-[10px] text-on-surface-variant/60 font-medium">{m.uploaderName}</p>
                      <p className="text-[10px] text-on-surface-variant/60">{m.fileSizeBytes?fmt(m.fileSizeBytes):""} · {m.downloadCount} {t('downloads')}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>setPreviewItem(m)}
                        className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all" title={t('btn_download')}>
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button onClick={()=>trackDownload(m)}
                        className="p-2 rounded-xl hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all" title={t('btn_download')}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container">
              <div>
                <h3 className="font-bold text-on-surface">{previewItem.title}</h3>
                <p className="text-xs text-on-surface-variant">{previewItem.uploaderName} · {CAT_LABELS[previewItem.category]||previewItem.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>trackDownload(previewItem)}
                  className="px-3 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 flex items-center gap-1.5 transition-all">
                  <span className="material-symbols-outlined text-sm">download</span>Tải xuống
                </button>
                <button onClick={()=>setPreviewItem(null)} className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-all">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {previewItem.description && (
                <div className="bg-surface-container p-4 rounded-xl">
                  <p className="text-sm text-on-surface-variant leading-relaxed">{previewItem.description}</p>
                </div>
              )}
              {previewItem.tags?.length>0&&(
                <div className="flex flex-wrap gap-2">
                  {previewItem.tags.map(t=>(
                    <span key={t} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">#{t}</span>
                  ))}
                </div>
              )}
              {previewItem.fileUrl?.startsWith("data:image/") && (
                <img src={previewItem.fileUrl} alt={previewItem.title} className="rounded-xl max-h-80 object-contain mx-auto" />
              )}
              {previewItem.fileUrl?.startsWith("data:video/") && (
                <video src={previewItem.fileUrl} controls className="w-full rounded-xl" />
              )}
              {previewItem.fileUrl?.startsWith("data:application/pdf") && (
                <div className="bg-surface-container rounded-xl p-8 text-center">
                  <span className="material-symbols-outlined text-5xl text-red-500 block mb-3">picture_as_pdf</span>
                  <p className="text-sm text-on-surface-variant mb-4">{t('preview_pdf')}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: t("modal_size"), value: previewItem.fileSizeBytes ? `${(previewItem.fileSizeBytes/1048576).toFixed(1)} MB` : "—" },
                  { label: t("modal_downloads"), value: `${previewItem.downloadCount}` },
                  { label: t("modal_date"), value: new Date(previewItem.createdAt).toLocaleDateString("vi-VN") },
                ].map(({label,value})=>(
                  <div key={label} className="bg-surface-container p-3 rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant">{label}</p>
                    <p className="font-black text-on-surface">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
