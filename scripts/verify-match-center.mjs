import fs from 'node:fs';

const source = fs.readFileSync('components/match-center.tsx', 'utf8');
for (const marker of [
  "timeZone: 'Asia/Jakarta'",
  "scrim.status === 'LIVE' || scrim.status === 'SCHEDULED'",
  "result_for !== null && scrim.result_against !== null",
  'No next match',
  'W / L',
]) {
  if (!source.includes(marker)) throw new Error(`Match Center guard missing: ${marker}`);
}
console.log('Match Center verification passed.');
