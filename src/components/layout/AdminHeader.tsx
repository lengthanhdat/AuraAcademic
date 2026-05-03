import Image from "next/image";

export function AdminHeader() {
  return (
    <header className="flex justify-between items-center w-full px-8 h-16 bg-[#f7f9fb] dark:bg-slate-950 sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-64 group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input 
            className="w-full bg-surface-container-highest/50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/60 outline-none transition-all" 
            placeholder="Tìm kiếm tài nguyên..." 
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-slate-500">
          <button className="hover:bg-[#f2f4f6] p-2 rounded-lg transition-colors">
            <span className="material-symbols-outlined">sensors</span>
          </button>
          <button className="hover:bg-[#f2f4f6] p-2 rounded-lg transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <button className="hover:bg-[#f2f4f6] p-2 rounded-lg transition-colors">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
        <div className="h-8 w-px bg-outline-variant/30"></div>
        <div className="flex items-center gap-3">
          <img 
            className="w-8 h-8 rounded-full object-cover" 
            alt="proctor admin" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_uXpJm9-FHpPBhB8q1MyelVgXOWeM8AHFBvE1SKzBn3Gdvrn-9QFzbOI7kPRDy2Np1XQuPCLi8rtlCEiQvnlfuOOg6Vxssmeq87A3DTqjZo8ENTN2THg7A9tbbfOv_8Br1bZTYXS4DuygXtAMt7P90d53rfFDU6BVJNW8N0ZiVuqYqk-sC0P14bBMt4sKE-_IcgmnblNLQyxrtkDF4Oje2hYJPgId1FJU6GHPom8tyRSLFe9Bkq20x1SpM0Vbd2W4wEZfKKph4y0"
          />
          <span className="font-headline font-semibold text-sm tracking-tight text-[#00355f]">Digital Proctor</span>
        </div>
      </div>
    </header>
  );
}
