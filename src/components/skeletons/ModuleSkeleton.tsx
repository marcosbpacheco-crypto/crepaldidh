'use client'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="h-3 bg-slate-200 rounded w-24 mb-3" />
            <div className="h-8 bg-slate-200 rounded w-20 mb-2" />
            <div className="h-2 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 p-6">
          <div className="h-4 bg-slate-200 rounded w-32 mb-6" />
          <div className="flex items-end gap-2 h-40">
            {[1,2,3,4,5,6].map(i => <div key={i} className="flex-1 bg-slate-100 rounded-t-lg" style={{ height: `${30 + i * 10}%` }} />)}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
          <div className="h-4 bg-slate-200 rounded w-40 mb-6" />
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-start gap-4 pb-5">
              <div className="w-9 h-9 rounded-xl bg-slate-200" />
              <div className="flex-1">
                <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-2 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}