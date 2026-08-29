'use client';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0c0d0f] px-6 text-white">
      <div className="max-w-md border border-white/10 bg-[#121418] p-8 text-center">
        <div className="text-[10px] uppercase tracking-[.25em] text-[#ff6b38]">System / Unavailable</div>
        <h1 className="mt-3 font-display text-6xl uppercase leading-none">Bad round.</h1>
        <p className="mt-4 text-sm leading-6 text-white/45">Something failed while rendering this page.</p>
        <button type="button" onClick={() => reset()} className="mt-7 border border-white/12 px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] hover:border-white/25">Try again</button>
      </div>
    </main>
  );
}
