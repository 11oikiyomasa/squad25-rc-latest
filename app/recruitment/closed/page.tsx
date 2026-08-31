import Link from 'next/link';
import PublicNav from '@/components/public-nav';
import { AppShell, Card, Section } from '@/components/ui';

export default function RecruitmentClosedPage() {
  return (
    <AppShell>
      <PublicNav active="recruit" />
      <Section className="ui-container grid min-h-[70vh] place-items-center py-16">
        <Card className="w-full max-w-2xl p-7 sm:p-10">
          <div className="ui-eyebrow text-[var(--acid)]">Recruitment closed</div>
          <h1 className="mt-3 font-display text-6xl uppercase leading-none sm:text-8xl">No open trial.</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/45">
            Recruitment is currently closed for this opening. No other opening is selected automatically.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/recruitment" className="ui-button ui-button-primary">
              View recruitment status
            </Link>
            <Link href="/roster" className="ui-button ui-button-secondary">
              Review the roster
            </Link>
          </div>
        </Card>
      </Section>
    </AppShell>
  );
}
