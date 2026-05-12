"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/navigation";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const nextLocale = locale === "vi" ? "en" : "vi";
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <button
      onClick={toggleLocale}
      disabled={isPending}
      title={locale === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 transition-all text-xs font-bold text-on-surface-variant hover:text-primary disabled:opacity-50"
    >
      <img 
        src={locale === "vi" ? "https://flagcdn.com/w20/vn.png" : "https://flagcdn.com/w20/gb.png"} 
        width="16" 
        height="12" 
        alt={locale === "vi" ? "Vietnam Flag" : "UK Flag"} 
        className="rounded-[2px] shadow-sm"
      />
      <span className="uppercase tracking-wide">{locale === "vi" ? "VI" : "EN"}</span>
    </button>
  );
}
