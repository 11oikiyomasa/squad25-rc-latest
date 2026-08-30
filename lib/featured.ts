import { normalizeYoutubeId, type Member } from '@/data/squad';

/**
 * Select the homepage's featured player from real published content.
 * Prefer the first player with a public montage, then the captain, then roster order.
 */
export function selectFeaturedMember(members: Member[]): Member | null {
  return members.find((member) => member.montages.some((montage) => Boolean(normalizeYoutubeId(montage.youtubeId))))
    ?? members.find((member) => member.status === 'CAPTAIN')
    ?? members[0]
    ?? null;
}

/**
 * Keep the public roster order intact while placing the selected featured player
 * in the legacy homepage feature slot used by the existing layout.
 */
export function orderMembersForHomepage(members: Member[]): Member[] {
  const featured = selectFeaturedMember(members);
  if (!featured) return members;
  const rest = members.filter((member) => member.id !== featured.id);
  const insertionIndex = Math.min(3, rest.length);
  return [...rest.slice(0, insertionIndex), featured, ...rest.slice(insertionIndex)];
}
