import type { Metadata } from 'next';
import { getSquadContent } from '@/lib/content';
import { normalizeYoutubeId } from '@/data/squad';
import { checkYoutubeVideos } from '@/lib/youtube';
import MediaCenter, { type MediaVideo } from '@/components/media-center';
import PublicNav from '@/components/public-nav';
import { AppShell, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Media — SQUAD.25',
  description: 'Public video tape and visual archive for SQUAD.25.',
  alternates: { canonical: '/media' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Media — SQUAD.25',
    description: 'Public video tape and visual archive for SQUAD.25.',
    type: 'website',
    url: '/media',
  },
};

export default async function MediaPage() {
  const { profile, members, gallery } = await getSquadContent();
  const sourceVideos: MediaVideo[] = members.flatMap((member) => member.montages
    .map((montage, index) => ({
      id: `${member.id}:${index}`,
      memberId: member.id,
      memberNickname: member.nickname,
      memberRole: member.role,
      title: montage.title,
      hero: montage.hero,
      duration: montage.duration,
      description: montage.description,
      publishedAt: montage.publishedAt,
      youtubeId: normalizeYoutubeId(montage.youtubeId),
      status: 'UNKNOWN' as const,
      thumbnail: '',
    }))
    .filter((video) => video.youtubeId));

  const checks = await checkYoutubeVideos(sourceVideos.map((video) => video.youtubeId));
  const videos = sourceVideos.map((video) => {
    const check = checks.get(video.youtubeId);
    return {
      ...video,
      status: check?.status ?? 'UNKNOWN',
      thumbnail: check?.thumbnail ?? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`,
    } satisfies MediaVideo;
  });

  return (
    <AppShell>
      <PublicNav active="media" />
      <PageHeader
        eyebrow="05 — Media / Tape / Archive"
        title="THE"
        accent="ARCHIVE."
        description={`${profile.name} public media. Verified video tape first, player-by-player cuts next, photography last. Unpublished or unavailable videos never become fake playable cards.`}
        aside={<><div className="ui-eyebrow">Media health</div><div className="mt-3">{videos.filter((video) => video.status === 'AVAILABLE').length} playable · {videos.filter((video) => video.status !== 'AVAILABLE').length} unavailable/unverified</div></>}
      />
      <MediaCenter videos={videos} gallery={gallery} />
      <footer className="border-t border-white/8">
        <div className="ui-container flex flex-col gap-4 py-8 text-[10px] uppercase tracking-[.18em] text-white/25 sm:flex-row sm:items-center sm:justify-between">
          <span>{profile.name} / MEDIA</span><span>{profile.season}</span>
        </div>
      </footer>
    </AppShell>
  );
}
