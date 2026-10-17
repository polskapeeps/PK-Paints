import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../worker.mjs';

const origin = 'https://pk-paints-renovations-preview.example.workers.dev';
const configured = {
  RESEND_API_KEY: 'test-key',
  ESTIMATE_FROM_EMAIL: 'Website <forms@example.com>',
  ESTIMATE_TO_EMAIL: 'owner@example.com',
};
const validForm = () => {
  const data = new FormData();
  data.set('name', 'Test Homeowner');
  data.set('email', 'homeowner@example.com');
  data.set('zip', '19103');
  data.set('scope', 'Paint the living room and ceiling.');
  data.set('privacy_consent', 'yes');
  data.set('started_at', String(Date.now() - 5_000));
  data.set('submission_id', 'migration-test-123');
  return data;
};
const submit = (body = validForm(), env = {}, headers = {}) => worker.fetch(
  new Request(`${origin}/api/estimate`, {
    method: 'POST', headers: { Origin: origin, ...headers }, body,
  }),
  env,
);

test('Cloudflare rejects unsupported API methods with uncached JSON', async () => {
  for (const method of ['GET', 'PUT', 'OPTIONS']) {
    const response = await worker.fetch(new Request(`${origin}/api/estimate`, { method }), {});
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('Allow'), 'POST');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal((await response.json()).ok, false);
  }
});

test('unknown API routes never fall through to website HTML', async () => {
  for (const path of ['/api', '/api/missing', '/api/estimate/']) {
    const response = await worker.fetch(new Request(`${origin}${path}`), {});
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
});

test('non-API fallbacks use the asset binding without changing the URL', async () => {
  const request = new Request(`${origin}/gallery?category=trim`);
  const response = await worker.fetch(request, {
    ASSETS: { fetch: async (actual) => {
      assert.equal(actual, request);
      return new Response('asset response', { status: 404 });
    } },
  });
  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'asset response');
});

test('Cloudflare bindings deliver photos, reply-to, and idempotency without process.env', async (t) => {
  let outbound;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    outbound = { url, options };
    return Response.json({ id: 'mock-email' });
  });
  const body = validForm();
  body.set('name', '<Test & Homeowner>');
  const photo = Buffer.from('89504e470d0a1a0a', 'hex');
  body.set('photo', new Blob([photo], { type: 'image/png' }), 'project.png');
  const response = await submit(body, configured);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(response.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.equal(outbound.url, 'https://api.resend.com/emails');
  assert.equal(outbound.options.headers.Authorization, 'Bearer test-key');
  assert.equal(outbound.options.headers['Idempotency-Key'], 'migration-test-123');
  const email = JSON.parse(outbound.options.body);
  assert.equal(email.from, configured.ESTIMATE_FROM_EMAIL);
  assert.deepEqual(email.to, ['owner@example.com']);
  assert.equal(email.reply_to, 'homeowner@example.com');
  assert.deepEqual(email.attachments, [{ filename: 'project.png', content: photo.toString('base64') }]);
  assert.match(email.html, /&lt;Test &amp; Homeowner&gt;/);
  assert.doesNotMatch(email.html, /<Test & Homeowner>/);
});

test('a phone-only lead uses the existing recipient default and no reply-to', async (t) => {
  let email;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    email = JSON.parse(options.body);
    assert.match(options.headers['Idempotency-Key'], /^[a-f\d-]{36}$/);
    return Response.json({ id: 'mock-email' });
  });
  const body = validForm();
  body.delete('email');
  body.delete('submission_id');
  body.set('phone', '2155550123');
  const { RESEND_API_KEY, ESTIMATE_FROM_EMAIL } = configured;
  assert.equal((await submit(body, { RESEND_API_KEY, ESTIMATE_FROM_EMAIL })).status, 200);
  assert.deepEqual(email.to, ['pkpaintsreno@gmail.com']);
  assert.equal(email.reply_to, undefined);
  assert.deepEqual(email.attachments, []);
});

test('honeypot and invalid requests do not contact the email provider', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected email send'); });
  const bot = validForm();
  bot.set('website', 'spam.example');
  assert.equal((await submit(bot, configured)).status, 200);
  const invalid = validForm();
  invalid.delete('privacy_consent');
  assert.equal((await submit(invalid, configured)).status, 422);
  assert.equal((await submit(validForm(), configured, { Origin: 'https://untrusted.example' })).status, 403);
  assert.equal((await submit()).status, 503);
  assert.equal(mock.mock.callCount(), 0);
});

test('malformed or absent bodies are rejected safely', async () => {
  assert.equal((await submit('not multipart', {}, { 'Content-Type': 'multipart/form-data; boundary=missing' })).status, 400);
  assert.equal((await submit(null)).status, 400);
});

test('the request size cap covers both declared and streamed bodies', async () => {
  assert.equal((await submit(validForm(), {}, { 'Content-Length': '3200001' })).status, 413);
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(1_600_000));
      controller.enqueue(new Uint8Array(1_600_001));
      controller.close();
    },
  });
  const response = await worker.fetch(new Request(`${origin}/api/estimate`, {
    method: 'POST', body, duplex: 'half',
    headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' },
  }), {});
  assert.equal(response.status, 413);
});

test('disallowed or oversized photos are rejected before email delivery', async () => {
  const body = validForm();
  body.set('photo', new Blob(['not an image'], { type: 'application/pdf' }), 'document.pdf');
  let response = await submit(body);
  assert.equal(response.status, 422);
  assert.match((await response.json()).errors.photo, /JPG, PNG, or WebP/);
  body.set('photo', new Blob([new Uint8Array(2_800_001)], { type: 'image/png' }), 'large.png');
  response = await submit(body);
  assert.equal(response.status, 422);
  assert.match((await response.json()).errors.photo, /2.8 MB/);
});

test('email provider errors never report success or disclose credentials', async (t) => {
  for (const send of [
    async () => { throw new Error('provider connection failed: test-key'); },
    async () => new Response('private provider error', { status: 429 }),
  ]) {
    const mocked = t.mock.method(globalThis, 'fetch', send);
    const response = await submit(validForm(), configured);
    assert.equal(response.status, 502);
    const text = await response.text();
    assert.match(text, /could not confirm delivery/);
    assert.doesNotMatch(text, /test-key|private provider error/);
    mocked.mock.restore();
  }
});
