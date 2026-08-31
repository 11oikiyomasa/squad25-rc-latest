import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = process.cwd();

const verifiers = [
  ['core IA/canonical routes', 'scripts/verify.mjs'],
  ['recruitment security and funnel', 'scripts/verify-recruitment.mjs'],
  ['match lifecycle', 'scripts/verify-scrims.mjs'],
  ['media/archive health', 'scripts/verify-media.mjs'],
  ['agent contract', 'scripts/verify-agent-contract.mjs'],
] as const;

for (const [name, script] of verifiers) {
  test(`regression: ${name} contract stays green`, () => {
    assert.doesNotThrow(() => {
      execFileSync(process.execPath, [script], {
        cwd: root,
        env: process.env,
        stdio: 'pipe',
      });
    });
  });
}
