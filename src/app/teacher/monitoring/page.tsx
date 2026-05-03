export default function MonitoringPage() {
  return (
    <div className="flex-1 p-8 max-w-[1200px] mx-auto w-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-primary">videocam</span>
            Giám Sát Trực Tiếp
          </h1>
          <p className="text-on-surface-variant mt-2">Tính năng này đang trong quá trình nâng cấp hệ thống camera AI đa luồng.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-12 text-center shadow-sm">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-5xl text-primary animate-pulse">developer_board</span>
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-3">Sắp Ra Mắt!</h2>
        <p className="text-on-surface-variant max-w-lg mx-auto leading-relaxed">
          Chúng tôi đang phát triển tính năng <strong>Trung Tâm Giám Sát Đa Luồng</strong>. Tính năng này sẽ cho phép giáo viên theo dõi cùng lúc nhiều phòng thi khác nhau trên một màn hình duy nhất thay vì phải vào từng phòng.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <div className="bg-surface-container px-6 py-3 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-green-600">verified</span>
            <span className="text-sm font-bold text-on-surface">Giám sát 50+ camera cùng lúc</span>
          </div>
          <div className="bg-surface-container px-6 py-3 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-600">bolt</span>
            <span className="text-sm font-bold text-on-surface">Công nghệ WebRTC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
