# PK Paints & Renovations website

Marketing site and estimate form for [pkpaintsrenovations.com](https://pkpaintsrenovations.com/):
a Vite multi-page site with Tailwind, hosted on Cloudflare Workers (static assets plus one
`/api/estimate` endpoint that emails requests through Resend).

**Site offline? Start with [docs/GO_LIVE.md](docs/GO_LIVE.md).**

```bash
npm ci
npm run dev                  # local site at http://localhost:5173
npm test                     # lint + unit tests
npm run build                # production build into dist/ (plus link/asset checks)
npm run preview:cloudflare   # run the built site in the Cloudflare runtime locally
```

Gallery photos live in `src/assets/gallery/<Category>/`. Add or remove files there and the
build regenerates thumbnails, lightbox images, and the category list. Originals never ship.
