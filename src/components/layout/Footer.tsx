import { Link } from "@/navigation";
import { Facebook, Github, Instagram, Mail, MapPin, Phone, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-white dark:bg-[#020b18] pt-16 pb-8 border-t border-slate-200/80 dark:border-cyan-950/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Col */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-90 transition-opacity">
              <Image src="/logoweb.png" alt="AuraAcademic Logo" width={180} height={44} className="h-9 w-auto object-contain dark:hidden" priority />
              <Image src="/logoweb-dark.png" alt="AuraAcademic Logo" width={180} height={44} className="h-9 w-auto object-contain hidden dark:block" priority />
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
              {t("desc")}
            </p>
            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/lengthanhdatt" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://github.com/lengthanhdat" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/lengthanhdat/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E1306C] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-extrabold text-base mb-6 tracking-wide">{t("solutions")}</h4>
            <ul className="space-y-4">
              {[
                { label: t("solution_list.item1"), href: '/solutions/exam-bank' },
                { label: t("solution_list.item2"), href: '/solutions/ai-proctoring' },
                { label: t("solution_list.item3"), href: '/solutions/analytics' },
                { label: t("solution_list.item4"), href: '/solutions/roles' }
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-[#00C6FF] dark:hover:text-[#00C6FF] transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#00C6FF] transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-extrabold text-base mb-6 tracking-wide">{t("explore")}</h4>
            <ul className="space-y-4">
              {[
                { label: t("explore_list.about"), href: '/about' },
                { label: t("explore_list.guide"), href: '/guide' },
                { label: t("explore_list.terms"), href: '/terms' },
                { label: t("explore_list.privacy"), href: '/privacy' }
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-[#00C6FF] dark:hover:text-[#00C6FF] transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#00C6FF] transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-extrabold text-base mb-6 tracking-wide">{t("contact")}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Ho Chi Minh City, Vietnam</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <Phone className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>+84 979 2202 48</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>auraacademicteam@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200/50 dark:border-cyan-950/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 dark:text-slate-500 text-sm font-medium text-center md:text-left">
            &copy; {new Date().getFullYear()} AuraAcademic.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <Heart className="w-3.5 h-3.5" /> {t("built_with")}
            </div>
            
            <div className="flex items-center gap-2 px-1.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hidden sm:flex">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold pl-2 pr-1">Developers</span>
              <a href="https://github.com/lengthanhdat" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm">
                <CircleGitIcon className="w-3.5 h-3.5" /> lengthanhdat
              </a>
              <a href="https://github.com/imyuh1209" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm">
                <CircleGitIcon className="w-3.5 h-3.5" /> imyuh1209
              </a>
            </div>
            
            {/* Mobile simplified version */}
            <div className="flex sm:hidden items-center gap-2">
              <a href="https://github.com/lengthanhdat" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <CircleGitIcon className="w-4 h-4" />
              </a>
              <a href="https://github.com/imyuh1209" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <CircleGitIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function CircleGitIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}
