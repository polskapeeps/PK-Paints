const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const MAX_ORIGINAL_PHOTO_BYTES = 12_000_000;
const MAX_PROCESSED_PHOTO_BYTES = 2_800_000;

const getStorage = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const setStatus = (element, message, state = '') => {
  element.textContent = message;
  element.hidden = !message;
  if (state) element.dataset.state = state;
  else delete element.dataset.state;
};

const setFieldError = (field, message = '') => {
  const error = document.getElementById(`${field.name}-error`);
  field.setAttribute('aria-invalid', String(Boolean(message)));
  if (error) error.textContent = message;
};

const setContactMethodError = (form, message = '') => {
  form.querySelectorAll('input[name="contact_method"]').forEach((field) => {
    field.setAttribute('aria-invalid', String(Boolean(message)));
  });
  const error = document.getElementById('contact_method-error');
  if (error) error.textContent = message;
};

const captureLeadSource = (form) => {
  const params = new URLSearchParams(window.location.search);
  const storage = getStorage();

  UTM_KEYS.forEach((key) => {
    const incoming = (params.get(key) || '').slice(0, 100);
    if (incoming && storage) storage.setItem(`pk_${key}`, incoming);
    const value = incoming || storage?.getItem(`pk_${key}`) || '';
    const input = form.elements.namedItem(key);
    if (input) input.value = value;
  });

  form.elements.namedItem('landing_path').value = `${window.location.pathname}${window.location.search}`.slice(0, 200);
  try {
    form.elements.namedItem('referrer_host').value = document.referrer
      ? new URL(document.referrer).hostname.slice(0, 200)
      : '';
  } catch {
    form.elements.namedItem('referrer_host').value = '';
  }
};

const canvasToBlob = (canvas, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

const preparePhoto = async (file) => {
  if (!file || file.size === 0) return null;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Use a JPG, PNG, or WebP image.');
  }
  if (file.size > MAX_ORIGINAL_PHOTO_BYTES) {
    throw new Error('Choose a photo smaller than 12 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const maxDimension = 1800;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await canvasToBlob(canvas, 0.82);
  if (blob && blob.size > MAX_PROCESSED_PHOTO_BYTES) blob = await canvasToBlob(canvas, 0.68);
  if (!blob || blob.size > MAX_PROCESSED_PHOTO_BYTES) {
    throw new Error('This photo could not be reduced enough. Try a smaller image.');
  }

  const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').slice(0, 60);
  return new File([blob], `${baseName || 'project-photo'}.jpg`, { type: 'image/jpeg' });
};

const validateContactMethod = (form) => {
  const method = form.querySelector('input[name="contact_method"]:checked')?.value || '';
  const phone = form.elements.namedItem('phone');
  const email = form.elements.namedItem('email');
  phone.required = method === 'Phone call' || method === 'Text message';
  email.required = method === 'Email';
};

const validateForm = (form) => {
  validateContactMethod(form);
  let firstInvalid = null;
  form.querySelectorAll('input, select, textarea').forEach((field) => {
    if (!field.name || field.type === 'hidden' || field.name === 'website') return;
    let message = '';
    if (!field.checkValidity()) message = field.validationMessage;
    if (field.name === 'zip' && field.value && !/^\d{5}(?:-\d{4})?$/.test(field.value)) {
      message = 'Enter a valid project ZIP code.';
    }
    if (field.name === 'scope' && field.value.trim().length < 10) {
      message = 'Tell us a little more about the project.';
    }
    setFieldError(field, message);
    if (message && !firstInvalid) firstInvalid = field;
  });

  const methodGroup = form.querySelector('input[name="contact_method"]');
  if (!form.querySelector('input[name="contact_method"]:checked')) {
    setContactMethodError(form, 'Choose a preferred contact method.');
    firstInvalid ||= methodGroup;
  } else {
    setContactMethodError(form);
  }

  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
};

const initializeForm = () => {
  const form = document.getElementById('estimate-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  captureLeadSource(form);
  form.elements.namedItem('started_at').value = String(Date.now());
  form.elements.namedItem('submission_id').value = crypto.randomUUID();
  form.querySelectorAll('input[name="contact_method"]').forEach((input) => {
    input.addEventListener('change', () => {
      validateContactMethod(form);
      setContactMethodError(form);
    });
  });

  form.addEventListener('input', (event) => {
    if (event.target.name === 'contact_method') setContactMethodError(form);
    else if (event.target.name) setFieldError(event.target);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus(status, '');
    if (!validateForm(form)) return;

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    submitButton.textContent = 'Sending…';

    try {
      const formData = new FormData(form);
      const photoInput = form.elements.namedItem('photo');
      const photo = await preparePhoto(photoInput.files?.[0]);
      formData.delete('photo');
      if (photo) formData.append('photo', photo);

      const response = await fetch('/api/estimate', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (payload.errors && typeof payload.errors === 'object') {
          Object.entries(payload.errors).forEach(([name, message]) => {
            const field = form.elements.namedItem(name);
            if (name === 'contact_method') setContactMethodError(form, message);
            else if (field instanceof HTMLElement) setFieldError(field, message);
          });
        }
        throw new Error(payload.message || 'We could not confirm delivery. Please try again, call, or email us.');
      }

      setStatus(status, payload.message, 'success');
      form.reset();
      captureLeadSource(form);
      form.elements.namedItem('started_at').value = String(Date.now());
      form.elements.namedItem('submission_id').value = crypto.randomUUID();
      status.focus();
    } catch (error) {
      setStatus(status, error.message || 'We could not confirm delivery. Please try again, call, or email us.', 'error');
      status.focus();
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      submitButton.textContent = 'Send Estimate Request';
    }
  });
};

document.addEventListener('DOMContentLoaded', initializeForm);
