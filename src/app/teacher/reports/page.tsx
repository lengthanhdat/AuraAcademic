export default function ReportsPage() {
  return (
    <div className="flex-1 p-8 max-w-[1200px] mx-auto w-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-primary">assessment</span>
            Báo Cáo Phân Tích
          </h1>
          <p className="text-on-surface-variant mt-2">Hệ thống tổng hợp và phân tích dữ liệu thi cử bằng Trí tuệ nhân tạo.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8 opacity-60 pointer-events-none">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4">Tỉ lệ vi phạm trung bình</h3>
          <div className="h-40 bg-surface-container rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">bar_chart</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4">Phổ điểm học sinh</h3>
          <div className="h-40 bg-surface-container rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">stacked_line_chart</span>
          </div>
        </div>
      </div>

      <div className="relative -mt-32 backdrop-blur-md bg-white/50 dark:bg-slate-900/50 rounded-3xl p-12 text-center border border-white/20 shadow-xl">
        <div className="w-20 h-20 bg-gradient-to-br from-[#00355f] to-[#0f4c81] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/20">
          <span className="material-symbols-outlined text-4xl text-white">insights</span>
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-3">Module Đang Được Nâng Cấp</h2>
        <p className="text-on-surface-variant max-w-lg mx-auto leading-relaxed">
          Chúng tôi đang tích hợp LLM (Mô hình ngôn ngữ lớn) để tự động sinh ra các báo cáo đánh giá chi tiết về điểm mạnh, điểm yếu của từng học sinh sau mỗi kỳ thi. Tính năng sẽ sớm được ra mắt!
        </p>
      </div>
    </div>
  );
}
