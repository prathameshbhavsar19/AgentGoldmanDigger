export function CanvasSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-label="Loading strategy canvas">
      {/* Goal summary skeleton */}
      <div className="rounded-lg border border-[var(--border)] bg-bg-elev p-6 shadow-card animate-fade-in">
        <div className="skeleton h-4 w-1/3 rounded mb-3" />
        <div className="skeleton h-8 w-2/3 rounded mb-2" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
      {/* Readiness skeleton */}
      <div className="rounded-lg border border-[var(--border)] bg-bg-elev p-6 shadow-card">
        <div className="skeleton h-4 w-1/4 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="skeleton h-12 rounded" />)}
        </div>
      </div>
      {/* Strategy cards skeleton */}
      <div className="rounded-lg border border-[var(--border)] bg-bg-elev p-6 shadow-card">
        <div className="skeleton h-4 w-1/4 rounded mb-4" />
        <div className="flex flex-col gap-3">
          {[0,1,2].map(i => <div key={i} className="skeleton h-28 rounded-lg" />)}
        </div>
      </div>
    </div>
  )
}
export default CanvasSkeleton
