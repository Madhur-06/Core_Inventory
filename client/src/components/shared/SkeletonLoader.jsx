function Shimmer({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700/60 ${className}`}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-8 w-32" />
        </div>
        <Shimmer className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Shimmer key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 p-4 border-b border-gray-50 dark:border-gray-800/50 last:border-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Shimmer key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4, className = '' }) {
  return <SkeletonTable rows={rows} cols={cols} className={className} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Chart area */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <Shimmer className="h-5 w-40 mb-6" />
        <Shimmer className="h-64 w-full rounded-xl" />
      </div>
      {/* Table */}
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Shimmer className="h-10 w-10 rounded-2xl" />
        <div className="space-y-2 flex-1">
          <Shimmer className="h-6 w-48" />
          <Shimmer className="h-4 w-32" />
        </div>
        <Shimmer className="h-10 w-28 rounded-xl" />
      </div>
      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Detail section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
        <Shimmer className="h-5 w-36" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Shimmer className="h-4 w-20" />
              <Shimmer className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
      {/* Table */}
      <SkeletonTable rows={3} cols={4} />
    </div>
  );
}

export default {
  SkeletonCard,
  SkeletonText,
  SkeletonTable,
  TableSkeleton,
  DashboardSkeleton,
  ProductDetailSkeleton,
};
