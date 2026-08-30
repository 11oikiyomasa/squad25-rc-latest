import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'app/media/page.tsx',
  'components/media-center.tsx',
  'components/gallery-grid.tsx',
  'lib/content.ts',
  'lib/youtube.ts',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing media artifact: ${file}`);
}

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const page = read('app/media/page.tsx');
const center = read('components/media-center.tsx');
const gallery = read('components/gallery-grid.tsx');
const content = read('lib/content.ts');
const youtube = read('lib/youtube.ts');

for (const [label, source, markers] of [
  ['media page', page, ['MediaCenter', 'checkYoutubeVideos', "canonical: '/media'"]],
  ['media center', center, ['01 — Latest', '02 — Featured', '03 — Player tape', '04 — Archive', 'EmptyState', 'Open on YouTube', 'youtube-nocookie.com/embed', 'loading="lazy"']],
  ['gallery', gallery, ['GalleryGrid', 'loading', 'role="dialog"']],
  ['content mapping', content, ['published_at', 'publishedAt']],
  ['YouTube checker', youtube, ['AVAILABLE', 'REMOVED', 'UNKNOWN', 'oembed', 'AbortSignal.timeout(3000)', 'concurrency = 5']],
]) {
  for (const marker of markers) {
    if (!source.includes(marker)) throw new Error(`${label} is missing expected marker: ${marker}`);
  }
}

const emptySource = read('data/squad.ts');
if (!emptySource.includes('youtubeId: \'\'')) throw new Error('Seed data no longer declares empty YouTube placeholders safely.');

console.log(`Media verification passed (${requiredFiles.length} required artifacts).`);
