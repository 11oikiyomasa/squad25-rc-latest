import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const required = process.env.REQUIRE_SUPABASE_TESTS === '1';

if (!url || !key) {
  test('Supabase integration contract configuration', { skip: !required }, () => {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required for Supabase integration tests.');
  });
} else {
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

  test('anonymous client can read public content tables', async () => {
    for (const table of ['squad_settings', 'members', 'montages', 'achievements', 'gallery_items']) {
      const { error } = await supabase.from(table).select('*').limit(1);
      assert.equal(error, null, `${table} should be publicly readable`);
    }
  });

  test('anonymous client cannot read admin allowlist rows', async () => {
    const { data, error } = await supabase.from('admin_users').select('user_id').limit(10);
    assert.equal(error, null);
    assert.deepEqual(data ?? [], []);
  });

  test('anonymous client cannot execute privileged publish RPC', async () => {
    const { error } = await supabase.rpc('publish_squad_content', { payload: {} });
    assert.ok(error, 'privileged publish RPC must reject anonymous calls');
    assert.match(error.message, /admin|required|permission|42501/i);
  });
}
