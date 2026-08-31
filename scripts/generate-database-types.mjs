import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const outputPath = path.join(root, 'types', 'database.ts');
const cliVersion = '2.116.0';
const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
const mode = process.argv[2] === '--check' ? 'check' : 'write';

if (!projectRef) {
  console.error('SUPABASE_PROJECT_REF is required.');
  process.exit(1);
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npx,
  [
    '--yes',
    `supabase@${cliVersion}`,
    'gen',
    'types',
    'typescript',
    '--project-id',
    projectRef,
    '--schema',
    'public',
  ],
  {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

if (result.error) {
  console.error(`Failed to run Supabase CLI: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const generated = result.stdout.endsWith('\n') ? result.stdout : `${result.stdout}\n`;

if (mode === 'write') {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, generated, 'utf8');
  console.log(`Generated ${path.relative(root, outputPath)}`);
  process.exit(0);
}

if (!fs.existsSync(outputPath)) {
  console.error(`Missing canonical generated types file: ${path.relative(root, outputPath)}`);
  process.exit(1);
}

const committed = fs.readFileSync(outputPath, 'utf8');
if (committed !== generated) {
  console.error(`Database types drift detected: ${path.relative(root, outputPath)} is not generated from the current public schema.`);
  process.exit(1);
}

console.log(`Database types are in sync: ${path.relative(root, outputPath)}`);
