'use client';

import type { ContentSnapshot } from '@/lib/content';
import type { Scrim } from '@/lib/scrims';
import EditorialHome from '@/components/editorial-home';

export default function HomeUX({ content, scrims }: { content: ContentSnapshot; scrims: Scrim[] }) {
  return <EditorialHome content={content} scrims={scrims} />;
}
