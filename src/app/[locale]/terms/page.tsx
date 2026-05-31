"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-[#00C6FF]/30 text-slate-800">
      <div className="absolute top-8 right-8 z-50">
        <LanguageSwitcher />
      </div>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0C2E5E] via-[#0E3E7A] to-[#051630] pb-32 pt-20 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]"></div>
        <div className="absolute right-0 top-1/4 w-96 h-96 bg-[#00C6FF]/10 rounded-full blur-[100px]" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <Link href="/" className="inline-block mb-8 hover:opacity-80 transition-all hover:scale-105">
             <img src="/logoweb-dark.png" alt="Aura Academic" className="h-12 mx-auto brightness-200" />
          </Link>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
            Điều khoản & Điều kiện
          </h1>
          <p className="text-blue-100/80 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Vui lòng đọc kỹ các điều khoản dịch vụ trước khi sử dụng nền tảng giáo dục số của chúng tôi.
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 relative z-20 pb-24">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-8 md:p-12 lg:p-16 border border-white">
          
          <div className="flex items-center gap-2 mb-10 text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-6">
            <span className="material-symbols-outlined text-[#00C6FF]">update</span>
            Cập nhật lần cuối: 27 Tháng 5, 2026
          </div>

          <div className="space-y-12">
            
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-[#0C2E5E] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00C6FF]/10 text-[#00C6FF] text-sm">1</span>
                Chấp nhận Điều khoản
              </h2>
              <div className="pl-11 text-slate-600 leading-relaxed font-medium space-y-4">
                <p>
                  Bằng việc truy cập, đăng ký tài khoản hoặc sử dụng hệ thống thi trực tuyến và giám sát AI <strong className="text-slate-800">Digital Proctor (Aura Academic)</strong> (&quot;Dịch vụ&quot;), bạn đồng ý tuân thủ một cách hợp pháp các Điều khoản và Điều kiện (&quot;Điều khoản&quot;) này. Nếu bạn không đồng ý với bất kỳ phần nào của Điều khoản, vui lòng không sử dụng Dịch vụ.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-[#0C2E5E] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00C6FF]/10 text-[#00C6FF] text-sm">2</span>
                Mô tả Dịch vụ
              </h2>
              <div className="pl-11 text-slate-600 leading-relaxed font-medium space-y-4">
                <p>
                  Aura Academic cung cấp nền tảng quản lý kỳ thi, thiết kế câu hỏi với sự hỗ trợ của AI, giám sát thi trực tuyến đa chiều và phân tích kết quả học tập. 
                </p>
                <p>
                  Chúng tôi có quyền sửa đổi, tạm ngưng hoặc ngừng cung cấp một phần hoặc toàn bộ Dịch vụ vào bất kỳ lúc nào mà không cần báo trước, nhằm mục đích bảo trì hệ thống, cập nhật công nghệ hoặc vì các lý do bất khả kháng theo quy định của pháp luật.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-[#0C2E5E] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00C6FF]/10 text-[#00C6FF] text-sm">3</span>
                Tài khoản và Bảo mật
              </h2>
              <div className="pl-11 text-slate-600 leading-relaxed font-medium space-y-4">
                <ul className="space-y-3 list-disc list-outside ml-4 marker:text-[#00C6FF]">
                  <li><strong className="text-slate-800">Tính chính xác của thông tin:</strong> Bạn cam kết cung cấp thông tin cá nhân (họ tên, email, vai trò) chính xác, đầy đủ khi đăng ký tài khoản.</li>
                  <li><strong className="text-slate-800">Trách nhiệm bảo mật:</strong> Bạn chịu trách nhiệm hoàn toàn về việc bảo mật mật khẩu, mã xác thực 2FA (nếu có) và mọi hoạt động diễn ra dưới tài khoản của mình. Không được chia sẻ, chuyển nhượng tài khoản cho bên thứ ba.</li>
                  <li><strong className="text-slate-800">Thông báo vi phạm:</strong> Nếu phát hiện bất kỳ sự truy cập trái phép nào vào tài khoản, bạn có trách nhiệm thông báo ngay lập tức cho bộ phận hỗ trợ kỹ thuật của chúng tôi.</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-[#0C2E5E] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00C6FF]/10 text-[#00C6FF] text-sm">4</span>
                Giám sát AI & Quyền riêng tư
              </h2>
              <div className="pl-11 text-slate-600 leading-relaxed font-medium space-y-4">
                <p>
                  Việc thu thập và xử lý dữ liệu của bạn được tuân thủ nghiêm ngặt theo các tiêu chuẩn bảo mật quốc tế. 
                </p>
                <ul className="space-y-3 list-disc list-outside ml-4 marker:text-[#00C6FF]">
                  <li><strong className="text-slate-800">Dữ liệu Giám sát AI (Proctoring):</strong> Khi tham gia các kỳ thi có kích hoạt tính năng giám sát, hệ thống sẽ yêu cầu quyền truy cập Camera và Microphone để phục vụ cho việc phát hiện gian lận (nhận diện khuôn mặt, phát hiện thiết bị di động, phát hiện hành vi bất thường). Dữ liệu này chỉ được sử dụng cho mục đích phân tích tính trung thực của bài thi bởi Hội đồng thi.</li>
                  <li><strong className="text-slate-800">Mã hóa dữ liệu:</strong> Toàn bộ dữ liệu cá nhân, đề thi và bài làm của thí sinh đều được bảo vệ bằng công nghệ mã hóa đầu cuối (End-to-end encryption) để đảm bảo an toàn tuyệt đối.</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-[#0C2E5E] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00C6FF]/10 text-[#00C6FF] text-sm">5</span>
                Hành vi bị nghiêm cấm
              </h2>
              <div className="pl-11 text-slate-600 leading-relaxed font-medium space-y-4">
                <p>Khi sử dụng Dịch vụ, bạn tuyệt đối không được thực hiện các hành vi sau:</p>
                <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100/50 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-500 shrink-0">cancel</span>
                    <span>Thực hiện các hành vi gian lận trong thi cử dưới mọi hình thức (nhờ người thi hộ, sử dụng tài liệu cấm, dùng thiết bị khác để tra cứu).</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-500 shrink-0">cancel</span>
                    <span>Cố tình qua mặt, vô hiệu hóa, can thiệp hoặc 리verse engineering hệ thống Giám sát AI (AI Proctoring).</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-500 shrink-0">cancel</span>
                    <span>Thực hiện các cuộc tấn công mạng, khai thác lỗ hổng (hack, ddos), hoặc phát tán phần mềm độc hại vào nền tảng.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-500 shrink-0">cancel</span>
                    <span>Đăng tải các nội dung vi phạm pháp luật, thuần phong mỹ tục, chứa ngôn từ kích động thù địch hoặc vi phạm bản quyền (đối với giáo viên tạo đề).</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-[#0C2E5E] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00C6FF]/10 text-[#00C6FF] text-sm">6</span>
                Giới hạn Trách nhiệm
              </h2>
              <div className="pl-11 text-slate-600 leading-relaxed font-medium space-y-4">
                <p>
                  Aura Academic nỗ lực tối đa để đảm bảo hệ thống hoạt động ổn định và chính xác (bao gồm cả các thuật toán AI). Tuy nhiên, chúng tôi không đảm bảo Dịch vụ sẽ luôn không có lỗi (bug-free) hoặc không bị gián đoạn. 
                </p>
                <p>
                  Chúng tôi từ chối mọi trách nhiệm đối với các tổn thất gián tiếp, vô ý hoặc thiệt hại dữ liệu phát sinh từ việc sử dụng hệ thống. Kết luận vi phạm từ AI mang tính chất hỗ trợ và luôn cần sự xem xét, kiểm duyệt cuối cùng từ Hội đồng thi hoặc Giáo viên quản lý.
                </p>
              </div>
            </section>

          </div>
          
          {/* Footer Action */}
          <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-6 items-center justify-between bg-slate-50/50 -mx-8 md:-mx-12 lg:-mx-16 -mb-8 md:-mb-12 lg:-mb-16 p-8 md:p-12 lg:p-16 rounded-b-[2.5rem]">
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-1">Bạn đã sẵn sàng tham gia?</h3>
              <p className="text-slate-500 font-medium text-sm">
                Nếu bạn đã hiểu và đồng ý với các điều khoản trên, hãy hoàn tất đăng ký.
              </p>
            </div>
            <Link 
              href="/register" 
              className="px-8 py-4 bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF] text-white font-extrabold rounded-2xl shadow-[0_10px_30px_rgba(0,198,255,0.25)] hover:shadow-[0_15px_40px_rgba(0,198,255,0.35)] hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto text-center shrink-0"
            >
              Quay lại Đăng ký
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}
