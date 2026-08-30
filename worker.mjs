import { handleEstimate } from './api/estimate.mjs';

const apiResponse = (message, status, extraHeaders = {}) => Response.json(
  { ok: false, message },
  {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      ...extraHeaders,
    },
  },
);

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/estimate') {
      if (request.method !== 'POST') return apiResponse('Use POST for estimate requests.', 405, { Allow: 'POST' });
      return handleEstimate(request, env);
    }
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return apiResponse('Not found.', 404);
    }
    return env.ASSETS.fetch(request);
  },
};
