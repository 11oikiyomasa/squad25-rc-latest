import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { squadProfile, normalizeYoutubeId } from '@/data/squad';
import { getSquadContent } from '@/lib/content';
import { MemberTape } from '@/components/member-tape';
import PublicNav from '@/components/public-nav';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { members, profile } = await getSquadContent();
  const member = members.find((item) => item.id === id);
  if (!member) return { title: `Player not found — ${squadProfile.name}` };
  return {
    title: `${member.nickname} / ${member.role} — ${profile.name}`,
    description: `${member.name} — ${member.role} player profile and montage archive for ${profile.name}.`,
    alternates: { canonical: `/member/${member.id}` },
    openGraph: {
      title: `${member.nickname} / ${member.role} — ${profile.name}`,
      description: `${member.name} — ${member.role} player profile and montage archive for ${profile.name}.`,
      type: 'website',
      images: member.photo ? [{ url: member.photo, alt: `${member.nickname} profile` }] : [],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { members, profile } = await getSquadContent();
  const member = members.find((item) => item.id === id);
  if (!member) return notFound();
  const publishedCuts = member.montages.filter((montage) => Boolean(normalizeYoutubeId(montage.youtubeId)));

  return (
    <main className="min-h-screen bg-[#0c0d0f] text-[#f4f0e7]">
      <PublicNav active="member" />

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
          <div className="relative min-h-[520px] overflow-hidden border border-white/10 bg-[#14171b] lg:min-h-[720px]">
            <Image src={member.photo} alt={`${member.nickname} profile`} fill sizes="(max-width: 1023px) 100vw, 42vw" className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="mb-3 text-[10px] uppercase tracking-[.24em] text-white/45">Player / {member.number}</div>
              <h1 className="font-display text-7xl uppercase leading-[.8] sm:text-9xl" style={{ color: member.accent }}>{member.nickname}</h1>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[.18em] text-white/55">
                <span>{member.role}</span><span>•</span><span>{member.hero}</span><span>•</span><span>{member.status}</span>
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-[#101216] p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-white/8 pb-6">
              <div>
                <div className="text-[10px] uppercase tracking-[.22em] text-white/35">{member.name}</div>
                <h2 className="mt-2 text-3xl font-semibold">The player file</h2>
              </div>
              <div className="text-right">
                <div className="font-display text-4xl" style={{ color: member.accent }}>{publishedCuts.length}</div>
                <div className="text-[9px] uppercase tracking-[.18em] text-white/30">cuts public</div>
              </div>
            </div>

            <p className="mt-7 max-w-2xl text-sm leading-7 text-white/60">{member.bio}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Stat label="Role" value={member.role} />
              <Stat label="Signature" value={member.hero} />
              <Stat label="Status" value={member.status} />
            </div>

            <div className="mt-10">
              <div className="mb-4 flex items-end justify-between gap-4 border-b border-white/8 pb-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[.22em] text-[#ff6b38]">Montage archive</div>
                  <h3 className="mt-1 text-lg font-semibold">Selected cuts</h3>
                </div>
                <div className="text-[9px] uppercase tracking-[.18em] text-white/25">{publishedCuts.length ? 'tap a cut to play' : 'no public cuts yet'}</div>
              </div>

              <MemberTape montages={publishedCuts} />

              <div className="mt-10 border border-[#d7ff43]/20 bg-[#d7ff43]/[.04] p-5 sm:p-6">
                <div className="text-[10px] uppercase tracking-[.22em] text-[#d7ff43]">Open trial path</div>
                <h3 className="mt-2 font-display text-4xl uppercase sm:text-5xl">Think you can add to this?</h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">We review players through their role, experience, availability, and ability to communicate in a team.</p>
                <a href="/recruitment" className="mt-5 inline-flex bg-[#d7ff43] px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] text-black hover:bg-[#e7ff83]">Apply for a trial ↗</a>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {(() => {
                  const currentIndex = members.findIndex((item) => item.id === member.id);
                  const previous = members[(currentIndex - 1 + members.length) % members.length];
                  const next = members[(currentIndex + 1) % members.length];
                  return (
                    <>
                      <a href={`/member/${previous.id}`} className="group border border-white/8 p-4 hover:border-white/18">
                        <div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">← Previous player</div>
                        <div className="mt-2 font-display text-2xl uppercase" style={{ color: previous.accent }}>{previous.nickname}</div>
                      </a>
                      <a href={`/member/${next.id}`} className="group border border-white/8 p-4 text-right hover:border-white/18">
                        <div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/25">Next player →</div>
                        <div className="mt-2 font-display text-2xl uppercase" style={{ color: next.accent }}>{next.nickname}</div>
                      </a>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/8 bg-black/15 p-4">
      <div className="text-[9px] uppercase tracking-[.18em] text-white/25">{label}</div>
      <div className="mt-2 text-sm font-semibold">{value}</div>
    </div>
  );
}
