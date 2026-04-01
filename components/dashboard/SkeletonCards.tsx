export function SkeletonStatCard() {
  return (
    <div className="glass-card rounded-xl p-5 border border-gray-800 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-32 bg-gray-700/60 rounded"></div>
        <div className="w-8 h-8 rounded-lg bg-gray-700/60"></div>
      </div>
      <div className="h-8 w-36 bg-gray-700/60 rounded mb-2"></div>
      <div className="h-3 w-24 bg-gray-700/40 rounded"></div>
    </div>
  );
}

export function SkeletonChartCard() {
  return (
    <div className="glass-card rounded-xl p-5 border border-gray-800 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 w-40 bg-gray-700/60 rounded"></div>
        <div className="h-4 w-20 bg-gray-700/40 rounded"></div>
      </div>
      <div className="h-64 w-full bg-gray-700/20 rounded-lg flex items-end gap-2 px-4 pb-4">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-700/40 rounded-t"
            style={{ height: `${20 + Math.random() * 60}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCampaignRow() {
  return (
    <div className="glass-card rounded-xl p-4 border border-gray-800 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-2 h-10 rounded-full bg-gray-700/60"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 bg-gray-700/60 rounded"></div>
          <div className="h-3 w-24 bg-gray-700/40 rounded"></div>
        </div>
        <div className="h-4 w-16 bg-gray-700/40 rounded hidden sm:block"></div>
        <div className="h-4 w-12 bg-gray-700/40 rounded hidden md:block"></div>
        <div className="h-6 w-24 bg-gray-700/30 rounded-full hidden lg:block"></div>
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-800/50 animate-pulse">
      <div className="h-4 w-40 bg-gray-700/60 rounded flex-1"></div>
      <div className="h-4 w-16 bg-gray-700/50 rounded"></div>
      <div className="h-4 w-16 bg-gray-700/40 rounded hidden sm:block"></div>
      <div className="h-4 w-16 bg-gray-700/40 rounded hidden md:block"></div>
      <div className="h-4 w-16 bg-gray-700/40 rounded hidden lg:block"></div>
      <div className="h-6 w-20 bg-gray-700/30 rounded-full"></div>
    </div>
  );
}

export function SkeletonFeedItem() {
  return (
    <div className="p-3 rounded-lg bg-white/3 border border-gray-800/50 animate-pulse">
      <div className="flex items-start gap-2 mb-2">
        <div className="w-4 h-4 rounded bg-gray-700/60 mt-0.5 flex-shrink-0"></div>
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-20 bg-gray-700/50 rounded font-mono"></div>
          <div className="h-4 w-full bg-gray-700/60 rounded"></div>
          <div className="h-3 w-4/5 bg-gray-700/40 rounded"></div>
        </div>
      </div>
    </div>
  );
}
