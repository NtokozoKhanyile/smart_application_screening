// ── Spinner ───────────────────────────────────────────────────────
const LoadingSpinner = ({ size = 'md', message = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} border-4 border-gray-200 border-t-navy-700 rounded-full animate-spin`}
      />
      {message && (
        <p className="text-sm text-gray-500">{message}</p>
      )}
    </div>
  )
}

export const FullPageLoader = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="lg" message={message} />
  </div>
)

// ── Base Skeleton Block ───────────────────────────────────────────
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
)

// ── Stat Card Skeleton ────────────────────────────────────────────
export const StatCardSkeleton = () => (
  <div className="card p-5 flex items-center gap-4">
    <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  </div>
)

// ── Table Row Skeleton ────────────────────────────────────────────
export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className={`h-4 ${i === 0 ? 'w-32' : i === cols - 1 ? 'w-12' : 'w-20'}`} />
      </td>
    ))}
  </tr>
)

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <tbody className="divide-y divide-gray-100">
    {Array.from({ length: rows }).map((_, i) => (
      <TableRowSkeleton key={i} cols={cols} />
    ))}
  </tbody>
)

// ── Card Detail Skeleton (for ApplicationDetail / ScreeningReview) ─
export const SectionCardSkeleton = ({ rows = 3 }) => (
  <div className="card p-5 mb-4">
    <Skeleton className="h-4 w-36 mb-4" />
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  </div>
)

// ── Dashboard Skeleton (stats + table) ───────────────────────────
export const DashboardSkeleton = ({ statCount = 4, tableRows = 5, tableCols = 5 }) => (
  <div>
    <div className={`grid grid-cols-2 lg:grid-cols-${statCount} gap-4 mb-6`}>
      {Array.from({ length: statCount }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <Skeleton className="h-4 w-40" />
      </div>
      <table className="w-full">
        <TableSkeleton rows={tableRows} cols={tableCols} />
      </table>
    </div>
  </div>
)

// ── Queue Item Skeleton (for ScreeningReview left panel) ──────────
export const QueueItemSkeleton = () => (
  <div className="px-4 py-3 border-b border-gray-100">
    <div className="flex items-center justify-between mb-2">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-3 w-8" />
    </div>
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  </div>
)

export default LoadingSpinner