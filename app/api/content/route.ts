import { NextResponse } from 'next/server';
import { getSquadContent } from '@/lib/content';

export const dynamic = 'force-dynamic';

export async function GET() {
  const content = await getSquadContent();
  return NextResponse.json(content, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
