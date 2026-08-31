import { redirect } from 'next/navigation';

export default async function LegacyMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/roster/${encodeURIComponent(id)}`);
}
