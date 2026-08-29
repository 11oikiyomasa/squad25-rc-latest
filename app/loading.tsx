export default function Loading() {
  return (
    <main
      className="grid min-h-screen place-items-center bg-[#0c0d0f] px-6 text-[#f4f0e7]"
      aria-label="Loading SQUAD.25"
      role="status"
    >
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-[#d7ff43] text-sm font-black text-black">S/</span>
            <div>
              <div className="text-sm font-black tracking-[.22em]">SQUAD.25</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[.2em] text-white/25">Public squad archive</div>
            </div>
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[.2em] text-white/25">Loading</div>
        </div>

        <div className="grid-bg mt-5 border border-white/10 bg-[#101216] p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="font-display text-4xl uppercase leading-none">Locking<br /><span className="text-[#ff6b38]">the frame.</span></div>
              <p className="mt-3 max-w-xs text-xs leading-5 text-white/35">Pulling the latest squad state. One second.</p>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[.18em] text-[#d7ff43]">SYNC</div>
          </div>

          <div className="mt-7 h-px overflow-hidden bg-white/10" aria-hidden="true">
            <div className="loading-sweep h-full w-1/3 bg-[#d7ff43]" />
          </div>

          <div className="mt-4 flex items-center justify-between font-mono text-[8px] uppercase tracking-[.18em] text-white/20">
            <span>Roster / Archive / Scrims</span>
            <span>01</span>
          </div>
        </div>
      </div>
    </main>
  );
}
