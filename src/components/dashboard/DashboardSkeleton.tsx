'use client';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="h-8 w-64 bg-[var(--bg2)] rounded-lg animate-pulse" />
          <div className="h-4 w-80 bg-[var(--bg3)] rounded-md animate-pulse mt-2" />
        </div>
        <div className="h-8 w-32 bg-[var(--bg3)] rounded-full animate-pulse" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[var(--bg2)] border border-[var(--bd)] rounded-xl p-4 md:p-6">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-3.5 h-3.5 bg-[var(--bg3)] rounded animate-pulse" />
              <div className="h-3 w-20 bg-[var(--bg3)] rounded animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-[var(--bg3)] rounded-lg animate-pulse" />
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-44 bg-[var(--acbg)] border border-[var(--acbd)] rounded-xl animate-pulse" />
        <div className="h-10 w-40 bg-[var(--bg2)] border border-[var(--bd)] rounded-xl animate-pulse" />
      </div>

      {/* Sessions List Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="h-6 w-40 bg-[var(--bg2)] rounded-lg animate-pulse" />
          <div className="h-10 w-64 bg-[var(--bg2)] border border-[var(--bd)] rounded-xl animate-pulse" />
        </div>

        {/* Filter tabs skeleton */}
        <div className="flex gap-2 pb-1">
          {['All', 'Completed', 'In Progress', 'Pending'].map((label) => (
            <div key={label} className="h-8 px-4 bg-[var(--bg3)] rounded-full animate-pulse" style={{ width: `${label.length * 10 + 30}px` }} />
          ))}
        </div>

        {/* Session cards skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[var(--bg2)] border border-[var(--bd)] rounded-xl py-4 px-4 md:px-6">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 bg-[var(--bg3)] rounded animate-pulse" style={{ width: `${120 + i * 40}px` }} />
                    <div className="h-5 w-20 bg-[var(--bg3)] rounded-full animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-16 bg-[var(--bg3)] rounded animate-pulse" />
                    <div className="h-3 w-24 bg-[var(--bg3)] rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-16 bg-[var(--bg3)] rounded-lg animate-pulse" />
                  <div className="h-8 w-14 bg-[var(--bg3)] rounded-lg animate-pulse" />
                  <div className="h-8 w-8 bg-[var(--bg3)] rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
