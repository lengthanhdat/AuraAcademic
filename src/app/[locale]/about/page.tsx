"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Target, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations("About");

  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#030712] transition-colors duration-500">
      <Navbar />
      
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-28 md:py-36">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2E5E] dark:text-white mb-4">
            {t("title")} <span className="text-[#00C6FF]">AuraAcademic</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            {t("subtitle")}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 md:p-12">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h3 className="text-2xl font-bold text-[#0C2E5E] dark:text-white mb-4">{t("story_title")}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
              {t("story_desc")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                <Target className="w-10 h-10 text-[#00C6FF] mb-4" />
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t("vision_title")}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t("vision_desc")}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                <ShieldCheck className="w-10 h-10 text-[#00C6FF] mb-4" />
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t("core_title")}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t("core_desc")}</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-[#0C2E5E] dark:text-white mb-4">{t("tech_title")}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {t("tech_desc")}
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
