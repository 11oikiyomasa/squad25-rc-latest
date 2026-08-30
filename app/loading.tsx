export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0c0d0f] px-6 text-[#f4f0e7]" aria-label="Loading SQUAD.25" role="status">
      <div className="w-full max-w-sm border border-white/10 bg-[#101216] p-6">
        <div className="font-mono text-[9px] uppercase tracking-[.2em] text-[#d7ff43]">Syncing</div>
        <div className="mt-3 font-display text-4xl uppercase">Loading archive.</div>
        <div className="mt-6 h-px overflow-hidden bg-white/10"><div className="loading-sweep h-full w-1/3 bg-[#d7ff43]" /></div>
      </div>
    </main>
  );
}
