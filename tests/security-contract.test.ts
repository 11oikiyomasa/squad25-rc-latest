import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('security contracts', () => {
  it('centralizes admin API authorization in the shared helper', () => {
    for (const route of ['content', 'scrims', 'recruitment']) {
      const source = read(`app/api/admin/${route}/route.ts`);
      expect(source).toContain("import { ensureAdmin } from '@/lib/admin-auth';");
      expect(source).not.toMatch(/async function ensureAdmin\s*\(/);
    }

    const auth = read('lib/admin-auth.ts');
    expect(auth).toContain('supabase.auth.getClaims()');
    expect(auth).toContain(".from('admin_users')");
  });

  it('keeps the database admin boundary enforced through private.is_admin', () => {
    const schema = read('SUPABASE_SCHEMA.sql');
    expect(schema).toContain('create or replace function private.is_admin()');
    expect(schema).toContain('create policy "Admins manage members" on public.members for all using (private.is_admin())');
    expect(schema).toContain('create policy "Admins manage montages" on public.montages for all using (private.is_admin())');
    expect(schema).toContain('raise exception \'Admin access required.\' using errcode = \'42501\';');
    expect(schema).toContain('revoke all on function public.publish_squad_content(jsonb) from public;');
  });

  it('keeps recruitment rate limits private and atomic', () => {
    const rateLimit = read('supabase/migrations/20260830084031_harden_recruitment_rate_limit.sql');
    const security = read('supabase/migrations/20260830085041_harden_recruitment_submission_security.sql');

    expect(rateLimit).toContain('create table if not exists private.recruitment_rate_limits');
    expect(rateLimit).toContain("interval '15 minutes'");
    expect(rateLimit).toContain('request_count >= 5');
    expect(rateLimit).toContain('revoke insert on table public.recruitment_applications from anon, authenticated;');
    expect(security).toContain('create trigger enforce_recruitment_submission_limits');
    expect(security).toContain("message = 'RECRUITMENT_RATE_LIMIT'");
    expect(security).toContain("message = 'RECRUITMENT_CONTACT_COOLDOWN'");
    expect(security).toContain('security invoker');
  });
});
