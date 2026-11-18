/** Shown the moment an admin link is clicked, while the page's data loads (keeps navigation feeling instant). */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-6 h-8 w-56 rounded-lg bg-[#E4E8F0]" />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-[84px] rounded-xl border border-line bg-white" />)}
      </div>
      <div className="rounded-xl border border-line bg-white">
        <div className="h-12 border-b border-line" />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-0">
            <div className="h-3 w-24 rounded bg-[#EEF1F6]" /><div className="h-3 flex-1 rounded bg-[#EEF1F6]" /><div className="h-3 w-16 rounded bg-[#EEF1F6]" />
          </div>
        ))}
      </div>
    </div>
  );
}
