import { AppShell, Card } from '@/components/ui';

export default function MatchesLoading() {
  return (
    <AppShell
      className="grid place-items-center px-[var(--page-gutter)] py-8 sm:py-12"
      aria-label="Loading SQUAD.25 matches"
    >
      <Card className="w-full max-w-sm p-6">
        <div className="ui-eyebrow text-[var(--acid)]">SQUAD.25 / Match center</div>
        <div className="mt-3 text-xs font-black uppercase tracking-[.22em] text-white/35">
          Public match archive
        </div>
        <div className="mt-3 font-display text-4xl uppercase">Loading matches.</div>
        <div className="mt-6 h-px overflow-hidden bg-[var(--line)]" aria-hidden="true">
          <div className="loading-sweep h-full w-1/3 bg-[var(--acid)]" />
        </div>
      </Card>
    </AppShell>
  );
}
