export type YoutubeCheck = {
  id: string;
  status: 'AVAILABLE' | 'REMOVED' | 'UNKNOWN';
  title: string;
  author: string;
  thumbnail: string;
};

function fallbackThumbnail(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export async function checkYoutubeVideo(id: string): Promise<YoutubeCheck> {
  const thumbnail = fallbackThumbnail(id);
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(id)}&format=json`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
      headers: { accept: 'application/json' },
    });

    if (response.status === 404) return { id, status: 'REMOVED', title: '', author: '', thumbnail };
    if (!response.ok) return { id, status: 'UNKNOWN', title: '', author: '', thumbnail };

    const payload = await response.json() as { title?: unknown; author_name?: unknown; thumbnail_url?: unknown };
    return {
      id,
      status: 'AVAILABLE',
      title: typeof payload.title === 'string' ? payload.title : '',
      author: typeof payload.author_name === 'string' ? payload.author_name : '',
      thumbnail: typeof payload.thumbnail_url === 'string' ? payload.thumbnail_url : thumbnail,
    };
  } catch {
    return { id, status: 'UNKNOWN', title: '', author: '', thumbnail };
  }
}

export async function checkYoutubeVideos(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const results: YoutubeCheck[] = [];
  const concurrency = 5;

  for (let index = 0; index < unique.length; index += concurrency) {
    const batch = unique.slice(index, index + concurrency);
    results.push(...await Promise.all(batch.map(checkYoutubeVideo)));
  }

  return new Map(results.map((check) => [check.id, check]));
}
