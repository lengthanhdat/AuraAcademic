import Link from "next/link";

export function AdminSidebar() {
  return (
    <aside className="hidden md:flex flex-col h-full w-72 bg-[#f2f4f6] dark:bg-slate-900 p-6 space-y-4 flex-shrink-0">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00355f] to-[#0f4c81] flex items-center justify-center text-white">
          <span className="material-symbols-outlined">shield</span>
        </div>
        <div>
          <h1 className="font-headline font-bold text-lg text-[#00355f] dark:text-blue-200 leading-none">Proctor Admin</h1>
          <p className="font-body text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-1">Institutional Control</p>
        </div>
      </div>
      <nav className="flex-1 space-y-2">
        {/* System Dashboard (Active) */}
        <Link className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 text-[#0F4C81] dark:text-blue-300 font-bold rounded-lg shadow-sm font-body text-[13px]" href="/admin/dashboard">
          <span className="material-symbols-outlined">dashboard</span>
          <span>System Dashboard</span>
        </Link>
        {/* User Management (Inactive) */}
        <Link className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-[#e0e3e5] dark:hover:bg-slate-800 rounded-lg transition-all font-body text-[13px]" href="/admin/users">
          <span className="material-symbols-outlined">group</span>
          <span>User Management</span>
        </Link>
        {/* System Settings (Inactive) */}
        <Link className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-[#e0e3e5] dark:hover:bg-slate-800 rounded-lg transition-all font-body text-[13px]" href="/admin/settings">
          <span className="material-symbols-outlined">settings_suggest</span>
          <span>System Settings</span>
        </Link>
      </nav>
      <div className="mt-auto pt-6">
        <button className="w-full py-3 bg-gradient-to-br from-[#00355f] to-[#0f4c81] text-white rounded-xl font-bold text-sm transition-all active:scale-98 active:opacity-80">
          Generate Reports
        </button>
      </div>
    </aside>
  );
}
