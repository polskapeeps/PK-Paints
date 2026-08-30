import assert from 'node:assert/strict';

// Read-only smoke check: never submits an estimate or sends an email.
const base = new URL(process.argv[2] || 'http://127.0.0.1:8787');
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
  throw new Error('Use an HTTP(S) site URL without embedded credentials.');
}
const get = (path) => fetch(new URL(path, base), {
  redirect: 'manual', signal: AbortSignal.timeout(15_000),
});

for (const path of ['/', '/interior-painting', '/carpentry', '/gallery', '/request-estimate', '/privacy']) {
  const response = await get(path);
  assert.equal(response.status, 200, `${path} status`);
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff', `${path} headers`);
  assert.match(await response.text(), /pkpaintsrenovations\.com/, `${path} content`);
  console.log(`OK ${path}`);
}
for (const path of ['/index.html', '/exterior-painting', '/exterior-painting.html', '/gallery.html', '/gallery/']) {
  const response = await get(path);
  assert.ok([301, 307, 308].includes(response.status), `${path} redirect`);
  const expected = path === '/index.html' ? '/' : path.startsWith('/gallery') ? '/gallery' : '/interior-painting#exterior';
  const location = new URL(response.headers.get('Location'), base);
  assert.equal(`${location.pathname}${location.hash}`, expected, path);
  console.log(`OK ${path} redirects`);
}
for (const path of ['/robots.txt', '/sitemap.xml', '/og.png']) {
  assert.equal((await get(path)).status, 200, path);
}
for (const path of ['/missing-page', '/worker.mjs', '/.dev.vars', '/wrangler.jsonc', '/_headers', '/_redirects']) {
  assert.equal((await get(path)).status, 404, path);
}
const api = await get('/api/estimate');
assert.equal(api.status, 405, 'API must be deployed, not an HTML fallback');
assert.equal(api.headers.get('Allow'), 'POST');
assert.equal(api.headers.get('Cache-Control'), 'no-store');
assert.equal((await api.json()).ok, false);
const home = await get('/');
if (base.hostname.endsWith('.workers.dev')) {
  assert.equal(home.headers.get('X-Robots-Tag'), 'noindex, nofollow', 'preview indexing');
} else if (base.hostname === 'pkpaintsrenovations.com') {
  assert.equal(home.headers.get('X-Robots-Tag'), null, 'production must remain indexable');
}
console.log(`Cloudflare smoke check passed for ${base.origin}. No email was sent.`);
