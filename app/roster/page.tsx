import type { Metadata } from 'next';
import { getSquadContent } from '@/lib/content';
import RosterContent from '@/components/roster-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Full Roster',
  description: 'The complete No Flaws MLBB player roster, with roles, profiles, and public cuts.',
};

export default async function RosterPage() {
  const content = await getSquadContent();
  return <RosterContent content={content} />;
}
