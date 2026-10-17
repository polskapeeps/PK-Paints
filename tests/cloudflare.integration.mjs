import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestHarness } from 'wrangler';

const server = createTestHarness({
  workers: [{
    configPath: './wrangler.jsonc',
    env: 'preview',
    // Always override local credentials: integration checks must never send real email.
    secrets: { RESEND_API_KEY: '', ESTIMATE_FROM_EMAIL: '', ESTIMATE_TO_EMAIL: '' },
  }],
});
before(async () => { await server.listen(); }, { timeout: 60_000 });
after(async () => { await server.close(); });

test('Cloudflare serves every canonical page with security headers', async () => {
  for (const path of ['/', '/gallery', '/carpentry', '/interior-painting', '/request-estimate', '/privacy']) {
    const response = await server.fetch(path, { redirect: 'manual' });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('Content-Type'), /text\/html/, path);
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff', path);
    assert.equal(response.headers.get('Permissions-Policy'), 'camera=(), microphone=(), geolocation=()', path);
    assert.match(await response.text(), /pkpaintsrenovations\.com/, path);
  }
});

test('legacy URLs, clean URLs, and trailing slashes retain their destinations', async () => {
  const paths = new Map([
    ['/index.html', '/'],
    ['/exterior-painting', '/interior-painting#exterior'],
    ['/exterior-painting.html', '/interior-painting#exterior'],
    ['/exterior-painting/', '/interior-painting#exterior'],
    ['/gallery.html', '/gallery'],
    ['/gallery/', '/gallery'],
  ]);
  for (const [path, expected] of paths) {
    const response = await server.fetch(path, { redirect: 'manual' });
    assert.ok([301, 307, 308].includes(response.status), `${path}: ${response.status}`);
    const target = new URL(response.headers.get('Location'), 'https://example.com');
    assert.equal(`${target.pathname}${target.hash}`, expected, path);
  }
});

test('Cloudflare previews are noindex without blocking the real domain', async () => {
  const preview = await server.fetch('https://pk-paints-renovations-preview.example.workers.dev/');
  assert.equal(preview.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  const production = await server.fetch('https://pkpaintsrenovations.com/');
  assert.equal(production.headers.get('X-Robots-Tag'), null);
});

test('campaign query parameters survive canonical URL redirects', async () => {
  for (const path of ['/gallery.html', '/exterior-painting']) {
    const response = await server.fetch(`${path}?utm_source=migration-test`, { redirect: 'manual' });
    const target = new URL(response.headers.get('Location'), 'https://example.com');
    assert.equal(target.searchParams.get('utm_source'), 'migration-test', path);
  }
});

test('unknown pages and server/config files are not exposed as site content', async () => {
  for (const path of ['/missing-page', '/worker.mjs', '/api/estimate.mjs', '/.dev.vars', '/wrangler.jsonc', '/_headers', '/_redirects']) {
    const response = await server.fetch(path);
    assert.equal(response.status, 404, path);
  }
  for (const path of ['/robots.txt', '/sitemap.xml', '/og.png']) {
    assert.equal((await server.fetch(path)).status, 200, path);
  }
});

test('the estimate API runs in workerd and safely reports missing email configuration', async () => {
  assert.equal((await server.fetch('/api/estimate')).status, 405);
  const body = new FormData();
  body.set('name', 'Local integration check');
  body.set('phone', '2155550123');
  body.set('zip', '19103');
  body.set('scope', 'This test must not send any email.');
  body.set('started_at', String(Date.now() - 5_000));
  body.set('privacy_consent', 'yes');
  const request = new Request('https://pk-paints-renovations-preview.example.workers.dev/api/estimate', {
    method: 'POST', headers: { Origin: 'https://pk-paints-renovations-preview.example.workers.dev' }, body,
  });
  // Serialize with the browser-standard encoder before crossing the test harness's fetch implementation.
  const response = await server.fetch(request.url, {
    method: request.method,
    headers: Object.fromEntries(request.headers),
    body: new Uint8Array(await request.arrayBuffer()),
  });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match((await response.json()).message, /not configured/);
});
