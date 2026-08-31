import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function notReady() {
  return NextResponse.json(
    { error: 'Recruitment submission pipeline is not enabled yet.' },
    { status: 501, headers: { 'Cache-Control': 'no-store' } },
  );
}

// Step 4 only installs the network/security perimeter in root proxy.ts.
// Zod validation, file probing, anti-abuse, storage, and DB persistence belong
// exclusively to Step 5 and are intentionally absent here.
export async function POST() {
  return notReady();
}
