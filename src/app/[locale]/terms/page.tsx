"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

export default function TermsPage() {
  const t = useTranslations("Terms");

  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#030712] transition-colors duration-500">
      <Navbar />
      
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-28 md:py-36">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2E5E] dark:text-white mb-3">
            {t("title")} <span className="text-[#00C6FF]">Sử dụng</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{t("subtitle")}</p>
        </div>

        <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 md:p-12">
          <div className="flex items-start gap-3 p-4 mb-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/5">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#00C6FF]" />
            <p className="text-sm leading-relaxed font-medium">
              {t("alert")}
            </p>
          </div>

          <div className="text-slate-600 dark:text-slate-300 leading-relaxed [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-[#0C2E5E] dark:[&>h3]:text-white [&>h3]:mt-8 [&>h3]:mb-4 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul>li]:mb-2 [&>p>strong]:text-slate-900 dark:[&>p>strong]:text-white">
            <h3>{t("section1_title")}</h3>
            <p>
              {t("section1_desc")}
            </p>

            <h3>{t("section2_title")}</h3>
            <ul>
              <li>{t("section2_li1")}</li>
              <li>{t("section2_li2")}</li>
              <li>{t("section2_li3")}</li>
            </ul>

            <h3>{t("section3_title")}</h3>
            <p>
              {t("section3_desc")}
            </p>

            <h3>{t("section4_title")}</h3>
            <p>
              {t("section4_desc")}
            </p>

            <h3>{t("section5_title")}</h3>
            <p>
              {t("section5_desc")}
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
