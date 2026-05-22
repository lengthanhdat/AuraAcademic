import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-200/80 dark:bg-cyan-950/40",
        className
      )}
    />
  );
}

/** Skeleton row for dashboard tables — mimics a real exam row */
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-100 dark:border-cyan-950/30">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </td>
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <td key={i} className="px-6 py-5">
          <Skeleton className="h-4 w-20" />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton for stat cards on dashboards */
export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#0A1F3E] p-7 rounded-2xl shadow-sm border border-slate-200/50 space-y-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-16" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}
