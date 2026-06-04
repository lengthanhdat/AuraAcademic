import Link from "next/link";
import { Facebook, Github, Instagram, Mail, MapPin, Phone, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-[#020b18] pt-16 pb-8 border-t border-slate-200/80 dark:border-cyan-950/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Col */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-90 transition-opacity">
              <img src="/logoweb.png" alt="AuraAcademic Logo" className="h-9 object-contain dark:hidden" />
              <img src="/logoweb-dark.png" alt="AuraAcademic Logo" className="h-9 object-contain hidden dark:block" />
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
              Nền tảng thi trắc nghiệm trực tuyến thông minh, tích hợp AI giám sát hành vi và tối ưu hóa trải nghiệm giáo dục số.
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
            <h4 className="text-slate-900 dark:text-white font-extrabold text-base mb-6 tracking-wide">Giải pháp</h4>
            <ul className="space-y-4">
              {['Ngân hàng đề thi', 'Giám sát AI (Proctoring)', 'Thống kê & Phổ điểm', 'Phân quyền tổ chức'].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-[#00C6FF] dark:hover:text-[#00C6FF] transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#00C6FF] transition-colors" />
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-extrabold text-base mb-6 tracking-wide">Khám phá</h4>
            <ul className="space-y-4">
              {[
                { label: 'Về chúng tôi', href: '/about' },
                { label: 'Tài liệu hướng dẫn', href: '/guide' },
                { label: 'Điều khoản sử dụng', href: '/terms' },
                { label: 'Chính sách bảo mật', href: '/privacy' }
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
            <h4 className="text-slate-900 dark:text-white font-extrabold text-base mb-6 tracking-wide">Liên hệ</h4>
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
              <Heart className="w-3.5 h-3.5" /> Built with care
            </div>
            
            <div className="flex items-center gap-2 px-1.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hidden sm:flex">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold pl-2 pr-1">Developers</span>
              <a href="https://github.com/lengthanhdat" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm">
                <Github className="w-3.5 h-3.5" /> lengthanhdat
              </a>
              <a href="https://github.com/imyuh1209" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm">
                <Github className="w-3.5 h-3.5" /> imyuh1209
              </a>
            </div>
            
            {/* Mobile simplified version */}
            <div className="flex sm:hidden items-center gap-2">
              <a href="https://github.com/lengthanhdat" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://github.com/imyuh1209" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
