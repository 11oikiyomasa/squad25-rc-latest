'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0c0d0f] px-6 text-[#f4f0e7]">
      <div className="w-full max-w-md border border-white/10 bg-[#101216] p-7">
        <div className="font-mono text-[9px] uppercase tracking-[.2em] text-[#ff6b38]">500 / Archive error</div>
        <h1 className="mt-3 font-display text-5xl uppercase leading-none">Something broke.</h1>
        <p className="mt-4 text-sm leading-6 text-white/45">The page could not load its current data. Try again before leaving the archive.</p>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={() => reset()} className="bg-[#d7ff43] px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] text-black">Try again</button>
          <a href="/" className="border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] text-white/60">Home</a>
        </div>
      </div>
    </main>
  );
}
