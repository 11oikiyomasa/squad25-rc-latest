import { AppShell, Card } from '@/components/ui';

export default function Loading() {
  return (
    <AppShell className="grid place-items-center px-[var(--page-gutter)] py-8 sm:py-12" aria-label="Loading SQUAD.25">
      <Card className="w-full max-w-sm p-6">
        <div className="ui-eyebrow text-[var(--acid)]">Syncing</div>
        <div className="mt-3 font-display text-4xl uppercase">Loading archive.</div>
        <div className="mt-6 h-px overflow-hidden bg-[var(--line)]" aria-hidden="true"><div className="loading-sweep h-full w-1/3 bg-[var(--acid)]" /></div>
      </Card>
    </AppShell>
  );
}
