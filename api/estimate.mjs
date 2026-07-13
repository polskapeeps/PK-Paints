const MAX_PHOTO_BYTES = 2_800_000;
const MAX_SCOPE_LENGTH = 3_000;
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });

const clean = (value, maxLength = 200) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const escapeHtml = (value) =>
  value.replace(/[&<>'"]/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });

const digitsOnly = (value) => value.replace(/\D/g, '');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value) => {
  const digits = digitsOnly(value);
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
};

const getPhoto = (formData) => {
  const value = formData.get('photo');
  return value && typeof value === 'object' && typeof value.arrayBuffer === 'function'
    ? value
    : null;
};

export function validateEstimate(formData, now = Date.now()) {
  const fields = {
    name: clean(formData.get('name')),
    phone: clean(formData.get('phone')),
    email: clean(formData.get('email')),
    zip: clean(formData.get('zip'), 10),
    scope: clean(formData.get('scope'), MAX_SCOPE_LENGTH),
    landingPath: clean(formData.get('landing_path'), 200),
    referrerHost: clean(formData.get('referrer_host'), 200),
    submissionId: clean(formData.get('submission_id'), 80),
    utmSource: clean(formData.get('utm_source'), 100),
    utmMedium: clean(formData.get('utm_medium'), 100),
    utmCampaign: clean(formData.get('utm_campaign'), 100),
    utmTerm: clean(formData.get('utm_term'), 100),
    utmContent: clean(formData.get('utm_content'), 100),
  };
  const errors = {};

  if (!fields.name) errors.name = 'Enter your name.';
  if (!/^\d{5}(?:-\d{4})?$/.test(fields.zip)) errors.zip = 'Enter a valid project ZIP code.';
  if (fields.scope.length < 10) errors.scope = 'Tell us a little more about the project.';
  if (fields.email && !isValidEmail(fields.email)) errors.email = 'Enter a valid email address.';
  if (fields.phone && !isValidPhone(fields.phone)) errors.phone = 'Enter a valid US phone number.';
  if (!fields.phone && !fields.email) errors.contact = 'Enter a phone number, an email address, or both.';
  if (formData.get('privacy_consent') !== 'yes') {
    errors.privacy_consent = 'Confirm that we may use these details to respond.';
  }

  const startedAt = Number(formData.get('started_at'));
  if (!Number.isFinite(startedAt) || now - startedAt < 2_000) {
    errors.form = 'Please review the form and try again.';
  }

  const photo = getPhoto(formData);
  if (photo && photo.size > 0) {
    if (!ALLOWED_PHOTO_TYPES.has(photo.type)) errors.photo = 'Use a JPG, PNG, or WebP image.';
    if (photo.size > MAX_PHOTO_BYTES) errors.photo = 'The processed photo must be under 2.8 MB.';
  }

  return { fields, photo, errors };
}

const formatLeadText = (fields) => {
  const campaign = [
    fields.utmSource && `Source: ${fields.utmSource}`,
    fields.utmMedium && `Medium: ${fields.utmMedium}`,
    fields.utmCampaign && `Campaign: ${fields.utmCampaign}`,
    fields.utmTerm && `Term: ${fields.utmTerm}`,
    fields.utmContent && `Content: ${fields.utmContent}`,
  ].filter(Boolean);

  return [
    'New estimate request',
    '',
    `Name: ${fields.name}`,
    `Phone: ${fields.phone || 'Not provided'}`,
    `Email: ${fields.email || 'Not provided'}`,
    `Project ZIP: ${fields.zip}`,
    '',
    'Project details:',
    fields.scope,
    '',
    `Landing page: ${fields.landingPath || 'Not captured'}`,
    `Referrer: ${fields.referrerHost || 'Direct or unavailable'}`,
    ...campaign,
  ].join('\n');
};

const formatLeadHtml = (fields) => {
  const safe = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, escapeHtml(value || 'Not provided')]),
  );
  return `
    <h1>New estimate request</h1>
    <table cellpadding="7" cellspacing="0" border="0">
      <tr><th align="left">Name</th><td>${safe.name}</td></tr>
      <tr><th align="left">Phone</th><td>${safe.phone}</td></tr>
      <tr><th align="left">Email</th><td>${safe.email}</td></tr>
      <tr><th align="left">Project ZIP</th><td>${safe.zip}</td></tr>
    </table>
    <h2>Project details</h2>
    <p style="white-space:pre-wrap">${safe.scope}</p>
    <hr>
    <p><strong>Landing page:</strong> ${safe.landingPath}<br>
    <strong>Referrer:</strong> ${safe.referrerHost}<br>
    <strong>Campaign:</strong> ${safe.utmSource} / ${safe.utmMedium} / ${safe.utmCampaign}</p>
  `;
};

export async function POST(request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin && origin !== requestUrl.origin) {
    return json({ ok: false, message: 'This request could not be accepted.' }, 403);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, message: 'The form data could not be read.' }, 400);
  }

  if (clean(formData.get('website'))) {
    return json({ ok: true, message: 'Your request was sent to PK Paints & Renovations.' });
  }

  const { fields, photo, errors } = validateEstimate(formData);
  if (Object.keys(errors).length > 0) {
    return json({ ok: false, message: 'Please correct the highlighted fields.', errors }, 422);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ESTIMATE_FROM_EMAIL;
  const to = process.env.ESTIMATE_TO_EMAIL || 'pkpaintsreno@gmail.com';
  if (!apiKey || !from) {
    return json(
      {
        ok: false,
        message: 'Online delivery is not configured yet. Please call or email PK Paints & Renovations.',
      },
      503,
    );
  }

  const attachments = [];
  if (photo && photo.size > 0) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    attachments.push({
      filename: clean(photo.name, 100) || 'project-photo.jpg',
      content: buffer.toString('base64'),
    });
  }

  const emailPayload = {
    from,
    to: [to],
    subject: `Estimate request — ${fields.zip}`,
    text: formatLeadText(fields),
    html: formatLeadHtml(fields),
    attachments,
    tags: [
      { name: 'form', value: 'estimate-request' },
    ],
  };
  if (fields.email) emailPayload.reply_to = fields.email;

  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': fields.submissionId || crypto.randomUUID(),
      },
      body: JSON.stringify(emailPayload),
    });
  } catch {
    return json(
      { ok: false, message: 'We could not confirm delivery. Please try again, call, or email us.' },
      502,
    );
  }

  if (!response.ok) {
    return json(
      { ok: false, message: 'We could not confirm delivery. Please try again, call, or email us.' },
      502,
    );
  }

  return json({
    ok: true,
    message: 'Your request was sent to PK Paints & Renovations. Peter will follow up to discuss the next step.',
  });
}
