export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-800 rounded" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-800/60 rounded-xl border border-gray-800" />
        ))}
      </div>
      <div className="h-96 bg-gray-800/40 rounded-xl border border-gray-800" />
    </div>
  )
}
