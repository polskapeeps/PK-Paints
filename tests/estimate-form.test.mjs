import assert from 'node:assert/strict';
import test from 'node:test';
import { POST, validateEstimate } from '../api/estimate.mjs';

const createValidFormData = () => {
  const data = new FormData();
  data.set('name', 'Jane Homeowner');
  data.set('phone', '(215) 555-0123');
  data.set('email', 'jane@example.com');
  data.set('zip', '19103');
  data.set('service', 'Interior painting');
  data.set('scope', 'Paint the living room walls, ceiling, and trim.');
  data.set('timeframe', 'Within 1–3 months');
  data.set('contact_method', 'Email');
  data.set('privacy_consent', 'yes');
  data.set('started_at', String(Date.now() - 5_000));
  data.set('submission_id', 'test-submission-123');
  data.set('utm_source', 'google');
  return data;
};

test('valid estimate data passes server validation', () => {
  const { errors, fields } = validateEstimate(createValidFormData());
  assert.deepEqual(errors, {});
  assert.equal(fields.zip, '19103');
  assert.equal(fields.utmSource, 'google');
});

test('contact preference requires its matching contact field', () => {
  const data = createValidFormData();
  data.set('contact_method', 'Text message');
  data.set('phone', '');
  const { errors } = validateEstimate(data);
  assert.equal(errors.phone, 'Phone is required for call or text follow-up.');
});

test('invalid service, ZIP, scope, consent, and rushed submissions are rejected', () => {
  const data = createValidFormData();
  data.set('service', 'Anything');
  data.set('zip', 'abc');
  data.set('scope', 'short');
  data.delete('privacy_consent');
  data.set('started_at', String(Date.now()));
  const { errors } = validateEstimate(data);
  assert.ok(errors.service);
  assert.ok(errors.zip);
  assert.ok(errors.scope);
  assert.ok(errors.privacy_consent);
  assert.ok(errors.form);
});

test('cross-origin submissions are rejected', async () => {
  const request = new Request('https://pkpaintsrenovations.com/api/estimate', {
    method: 'POST',
    headers: { Origin: 'https://example.com' },
    body: createValidFormData(),
  });
  const response = await POST(request);
  assert.equal(response.status, 403);
});

test('missing email configuration produces a safe service-unavailable response', async () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.ESTIMATE_FROM_EMAIL;
  delete process.env.RESEND_API_KEY;
  delete process.env.ESTIMATE_FROM_EMAIL;
  try {
    const request = new Request('https://pkpaintsrenovations.com/api/estimate', {
      method: 'POST',
      headers: { Origin: 'https://pkpaintsrenovations.com' },
      body: createValidFormData(),
    });
    const response = await POST(request);
    assert.equal(response.status, 503);
    const payload = await response.json();
    assert.match(payload.message, /not configured/i);
  } finally {
    if (previousKey) process.env.RESEND_API_KEY = previousKey;
    if (previousFrom) process.env.ESTIMATE_FROM_EMAIL = previousFrom;
  }
});

test('configured submissions send a validated Resend request', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.ESTIMATE_FROM_EMAIL;
  const previousTo = process.env.ESTIMATE_TO_EMAIL;
  let outbound;

  process.env.RESEND_API_KEY = 'test-key';
  process.env.ESTIMATE_FROM_EMAIL = 'PK Paints Website <forms@example.com>';
  process.env.ESTIMATE_TO_EMAIL = 'owner@example.com';
  globalThis.fetch = async (url, options) => {
    outbound = { url, options };
    return Response.json({ id: 'email_123' });
  };

  try {
    const request = new Request('https://pkpaintsrenovations.com/api/estimate', {
      method: 'POST',
      headers: { Origin: 'https://pkpaintsrenovations.com' },
      body: createValidFormData(),
    });
    const response = await POST(request);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(outbound.url, 'https://api.resend.com/emails');
    const email = JSON.parse(outbound.options.body);
    assert.deepEqual(email.to, ['owner@example.com']);
    assert.equal(email.reply_to, 'jane@example.com');
    assert.match(email.subject, /Interior painting/);
    assert.match(email.text, /19103/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey) process.env.RESEND_API_KEY = previousKey;
    else delete process.env.RESEND_API_KEY;
    if (previousFrom) process.env.ESTIMATE_FROM_EMAIL = previousFrom;
    else delete process.env.ESTIMATE_FROM_EMAIL;
    if (previousTo) process.env.ESTIMATE_TO_EMAIL = previousTo;
    else delete process.env.ESTIMATE_TO_EMAIL;
  }
});
