import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { squadProfile, normalizeYoutubeId } from '@/data/squad';
import { getSquadContent } from '@/lib/content';
import { MemberTape } from '@/components/member-tape';
import PublicNav from '@/components/public-nav';
import ShareMember from '@/components/share-member';
import { Button, Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { members, profile } = await getSquadContent();
  const member = members.find((item) => item.id === id);
  if (!member) return { title: `Player not found — ${squadProfile.name}` };
  return { title: `${member.nickname} / ${member.role} — ${profile.name}`, description: `${member.name} — ${member.role} player profile and montage archive for ${profile.name}.`, alternates: { canonical: `/member/${member.id}` }, openGraph: { title: `${member.nickname} / ${member.role} — ${profile.name}`, description: member.bio, type: 'website', images: member.photo ? [{ url: member.photo, alt: `${member.nickname} profile` }] : [] }, twitter: { card: 'summary_large_image' } };
}

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { members, profile, achievements } = await getSquadContent();
  const member = members.find((item) => item.id === id);
  if (!member) return notFound();
  const publishedCuts = member.montages.filter((montage) => Boolean(normalizeYoutubeId(montage.youtubeId)));
  const currentIndex = members.findIndex((item) => item.id === member.id);
  const previous = members[(currentIndex - 1 + members.length) % members.length];
  const next = members[(currentIndex + 1) % members.length];
  const photo = member.photo || '/images/members/ryuu.svg';

  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--paper)] text-[var(--ink)]">
      <PublicNav active="member" />
      <section className="ui-container py-8 sm:py-10 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
          <div className="relative min-h-[520px] overflow-hidden border border-white/10 bg-[var(--panel-raised)] lg:min-h-[720px]">
            <Image src={photo} alt={`${member.nickname} profile`} fill sizes="(max-width: 1023px) 100vw, 42vw" className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8"><div className="mb-3 font-mono text-[10px] uppercase tracking-[.24em] text-white/45">Player / {member.number}</div><h1 className="font-display text-7xl uppercase leading-[.8] sm:text-9xl" style={{ color: member.accent }}>{member.nickname}</h1><div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[.18em] text-white/55"><span>{member.role}</span><span>•</span><span>{member.hero || 'Role specialist'}</span><span>•</span><span>{member.status}</span></div></div>
          </div>

          <Card className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-white/8 pb-6"><div><div className="font-mono text-[10px] uppercase tracking-[.22em] text-white/35">{member.name}</div><h2 className="mt-2 text-3xl font-semibold">The player file</h2></div><ShareMember nickname={member.nickname} /></div>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-white/60">{member.bio}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3"><Stat label="Role" value={member.role}/><Stat label="Signature" value={member.hero || 'Not published'}/><Stat label="Status" value={member.status}/></div>

            <section className="mt-10 border-t border-white/8 pt-8" aria-labelledby="achievements-title"><div className="ui-eyebrow">Achievements</div><h3 id="achievements-title" className="mt-1 text-lg font-semibold">Squad record</h3><p className="mt-2 text-xs leading-5 text-white/35">Published squad achievements are shown here; member-specific awards are not fabricated when the content model does not provide them.</p><div className="mt-5 space-y-3">{achievements.length ? achievements.map((achievement) => <div key={`${achievement.year}-${achievement.title}`} className="grid gap-2 border border-white/8 bg-black/10 p-4 sm:grid-cols-[70px_1fr]"><div className="font-display text-2xl text-white/35">{achievement.year}</div><div><div className="text-sm font-semibold">{achievement.title}</div><div className="mt-1 text-xs text-white/35">{achievement.note}</div></div></div>) : <div className="ui-empty"><div><div className="ui-eyebrow">No public data</div><p className="ui-empty-description mt-2">No achievements have been published yet.</p></div></div>}</div></section>

            <section className="mt-10 border-t border-white/8 pt-8" aria-labelledby="stats-title"><div className="ui-eyebrow">Stats</div><h3 id="stats-title" className="mt-1 text-lg font-semibold">No fabricated numbers.</h3><p className="mt-2 text-sm leading-6 text-white/40">Player performance statistics are not available in the current public content model, so this page intentionally leaves them unpublished.</p></section>

            <section className="mt-10 border-t border-white/8 pt-8" aria-labelledby="montage-title"><div className="mb-4 flex items-end justify-between gap-4"><div><div className="ui-eyebrow">Montage archive</div><h3 id="montage-title" className="mt-1 text-lg font-semibold">Selected cuts</h3></div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{publishedCuts.length ? `${publishedCuts.length} public cuts` : 'no public cuts yet'}</div></div><MemberTape montages={publishedCuts} /></section>

            <div className="mt-10 border border-[color-mix(in_srgb,var(--acid)_20%,transparent)] bg-[color-mix(in_srgb,var(--acid)_4%,transparent)] p-5 sm:p-6"><div className="ui-eyebrow text-[var(--acid)]">Open trial path</div><h3 className="mt-2 font-display text-4xl uppercase sm:text-5xl">Think you can add to this?</h3><p className="mt-3 max-w-xl text-sm leading-6 text-white/45">We review players through their role, experience, availability, and ability to communicate in a team.</p><Button href="/recruitment" className="mt-5">Apply for a trial ↗</Button></div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2"><Link href={`/member/${previous.id}`} className="border border-white/8 p-4 transition-colors hover:border-white/18"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">← Previous player</div><div className="mt-2 font-display text-2xl uppercase" style={{color:previous.accent}}>{previous.nickname}</div></Link><Link href={`/member/${next.id}`} className="border border-white/8 p-4 text-right transition-colors hover:border-white/18"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">Next player →</div><div className="mt-2 font-display text-2xl uppercase" style={{color:next.accent}}>{next.nickname}</div></Link></div>
          </Card>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="border border-white/8 bg-black/15 p-4"><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">{label}</div><div className="mt-2 text-sm font-semibold">{value}</div></div>; }
