'use client';

import { AppShell, Button, Card } from '@/components/ui';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AppShell className="grid place-items-center px-[var(--page-gutter)] py-8 sm:py-12">
      <Card className="w-full max-w-md p-7">
        <div className="ui-eyebrow">500 / Archive error</div>
        <h1 className="mt-3 font-display text-5xl uppercase leading-none">Something broke.</h1>
        <p className="mt-4 text-sm leading-6 text-white/45">The page could not load its current data. Try again before leaving the archive.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" onClick={reset}>Try again</Button>
          <Button href="/" variant="secondary">Home</Button>
        </div>
      </Card>
    </AppShell>
  );
}
