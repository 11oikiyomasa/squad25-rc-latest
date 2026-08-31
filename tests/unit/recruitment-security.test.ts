import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPdf, clientIp, hasPdfMagicBytes, isValidEmail, isValidHttpUrl, text } from '../../lib/recruitment-security';

test('validation accepts a normal email and rejects oversized/invalid email', () => {
  assert.equal(isValidEmail('player@example.com'), true);
  assert.equal(isValidEmail('player@example'), false);
  assert.equal(isValidEmail(`${'a'.repeat(245)}@example.com`), false);
});

test('validation only accepts http(s) URLs with the configured max length', () => {
  assert.equal(isValidHttpUrl('https://example.com/player'), true);
  assert.equal(isValidHttpUrl('http://example.com/player'), true);
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false);
  assert.equal(isValidHttpUrl('ftp://example.com/player'), false);
  assert.equal(isValidHttpUrl(`https://${'a'.repeat(500)}`), false);
});

test('text utility normalizes unicode, trims, and clamps input', () => {
  assert.equal(text('  e\u0301  ', 20), 'é');
  assert.equal(text('abcdef', 3), 'abc');
  assert.equal(text(42, 10), '');
});

test('clientIp prefers the first forwarded address and falls back safely', () => {
  assert.equal(clientIp(new Request('https://example.test', { headers: { 'x-forwarded-for': '203.0.113.5, 198.51.100.2' } })), '203.0.113.5');
  assert.equal(clientIp(new Request('https://example.test', { headers: { 'x-real-ip': '198.51.100.8' } })), '198.51.100.8');
  assert.equal(clientIp(new Request('https://example.test')), '0.0.0.0');
});

test('PDF validation requires the expected extension, MIME type, and size', async () => {
  const valid = new File([Buffer.from('%PDF-1.7\n')], 'resume.pdf', { type: 'application/pdf' });
  const wrongName = new File([Buffer.from('%PDF-1.7\n')], 'resume.txt', { type: 'application/pdf' });
  const wrongType = new File([Buffer.from('%PDF-1.7\n')], 'resume.pdf', { type: 'text/plain' });
  assert.equal(assertPdf(valid), true);
  assert.equal(assertPdf(wrongName), false);
  assert.equal(assertPdf(wrongType), false);
  assert.equal(await hasPdfMagicBytes(valid), true);
});

test('PDF magic-byte validation rejects a renamed non-PDF file', async () => {
  const disguised = new File([Buffer.from('<html>not a pdf</html>')], 'resume.pdf', { type: 'application/pdf' });
  assert.equal(assertPdf(disguised), true);
  assert.equal(await hasPdfMagicBytes(disguised), false);
});
