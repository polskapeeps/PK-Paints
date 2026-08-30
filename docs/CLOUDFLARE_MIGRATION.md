# Cloudflare migration checklist

Verified August 30, 2026. Repository: `polskapeeps/PK-Paints`.
Migration branch: `chore/cloudflare-migration`. Leave `main` and Vercel in place until the new host is approved.

The public apex returned HTTP 402 from Vercel during this audit; `www` redirected to the apex. The exact account/billing cause is unverified. Keeping Vercel is a rollback option only after its serving/billing issue is resolved; do not assume the currently paused endpoint is a working backup.

## Recommendation and costs

Use **Cloudflare Workers with Static Assets on the Free plan**. Cloudflare now recommends Workers for new projects, including static websites. Pages remains usable, but starting a new Pages project adds no benefit here. [Cloudflare's current guidance](https://developers.cloudflare.com/pages/)

| Part | Expected cost and limits |
| --- | --- |
| Website pages, CSS, JavaScript, photos | $0; static requests are free and unlimited, with no separate asset storage charge. |
| Estimate endpoint | Workers Free: 100,000 requests per day per account; 10 ms CPU per invocation. |
| Automatic Cloudflare builds, if connected later | Free: 3,000 build minutes/month. Local CLI deployments do not require hosted builds. |
| Estimate emails | Resend Free currently allows 100 emails/day and 3,000/month. The actual Resend account/plan and sending domain must be verified separately. |
| Domain registration | Existing renewal charges continue. Changing hosting does not transfer the registrar or make the domain free. |

Sources: [static assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [build limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/), [Resend quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits).

No paid hosting subscription is needed for this design. This is not an uptime guarantee: outages, account restrictions, expired domains, and future policy changes remain possible. Form requests can fail if the Worker or email quota is exhausted; existing pages and photos are served directly as static assets and do not spend the Worker request allowance. Large photo submissions must be checked against the real Free-plan CPU budget before cutover. Do not enable Workers Paid or other paid services without approval; Workers Paid starts at $5/month plus usage. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)

## What changed

- This is a Vite 6 multi-page site with Tailwind and build-time Sharp image processing, not Next.js or an SSR app. `npm run build` still produces `dist/`; there is no database to migrate.
- `worker.mjs` handles `/api/estimate`; its shared handler receives Cloudflare environment bindings. The original Vercel `POST` export and `vercel.json` remain usable for rollback.
- Photo encoding uses the supported Node buffer API with `nodejs_compat`. The 2.8 MB photo limit stays; a 3.2 MB streamed request cap replaces reliance on Vercel's upstream body limit.
- `public/_headers` and `_redirects` preserve security headers and redirects. Clean URLs stay enabled; unknown pages remain 404s. Temporary `workers.dev` addresses are marked noindex.
- The privacy notice identifies Cloudflare, Resend, and Vercel's transition role. No analytics or additional customer-data collection was added.
- Node 24 is selected for hosted builds/CI; Node 22+ is required by the pinned Wrangler release. Build checks enforce Cloudflare's 20,000-file and 25 MiB-per-file Free limits.
- Default Worker: `pk-paints-renovations`. Separate preview Worker: `pk-paints-renovations-preview`. Neither has a custom domain or route configured.

## 1. Validate without publishing

From PowerShell:

```powershell
Set-Location 'C:\Users\Habad\Documents\Code\Repos\PK-Paints-main'
git switch chore/cloudflare-migration
.\scripts\migrate-cloudflare.ps1
```

The script refuses to run on `main`/`master`, installs locked dependencies, runs lint, unit tests, the production build, Cloudflare runtime integration tests, an audit, and a deployment dry run. It does not push, merge, publish, change DNS, or touch Vercel. Browser-only preview: `npm run preview:cloudflare`, then open `http://localhost:8787`.

## 2. Publish only the isolated preview

Sign into the correct Cloudflare account. For a fresh CLI authorization, limit scopes to account/user read access and Worker script management; no DNS or zone-edit scope is needed:

```powershell
npx wrangler login --scopes account:read user:read workers_scripts:write --use-keyring
.\scripts\migrate-cloudflare.ps1 -DeployPreview
```

Use the exact preview URL printed by Wrangler:

```powershell
npm run check:cloudflare -- https://YOUR-PREVIEW-ADDRESS.workers.dev
```

This smoke check makes only GET requests and sends no email. Missing email credentials do not block the website preview. A valid form submission without credentials returns a clear 503 and asks the visitor to call or email instead of falsely claiming success.

## 3. Configure and verify email before moving the domain

Keep the current Resend account/integration alive while migrating. Confirm who owns it, verify the sending domain in Resend, and use a sending-only key where available. Do not assume Vercel integration credentials will copy to Cloudflare automatically or survive disconnecting that integration.

Add **encrypted runtime secrets** to `pk-paints-renovations-preview` (Cloudflare Settings > Variables and Secrets), or enter them at Wrangler's hidden prompts:

```powershell
npx wrangler secret put RESEND_API_KEY --env preview
npx wrangler secret put ESTIMATE_FROM_EMAIL --env preview
npx wrangler secret put ESTIMATE_TO_EMAIL --env preview
```

- `ESTIMATE_FROM_EMAIL`: a verified sender, for example `PK Paints Website <forms@send.pkpaintsrenovations.com>` **only if that domain is verified**.
- `ESTIMATE_TO_EMAIL`: `pkpaintsreno@gmail.com` (the existing business recipient).
- Local-only credentials belong in ignored `.dev.vars`, copied from `.dev.vars.example`. Never commit them or use a `VITE_` prefix. Integration tests override credentials so they cannot send real email.
- With the owner's permission, send a clearly labeled test with and without a project photo; confirm arrival, Reply-To, retry/idempotency behavior, and Worker CPU usage. Unit tests mock Resend; they do not prove real delivery. No real email test is sent automatically.
- Sending-domain verification may itself require DNS records: obtain explicit approval before adding or changing them.

## 4. Cutover only after explicit DNS approval

1. Approve the preview, form delivery, and migration PR. `main` stays unchanged until a separate merge is authorized.
2. Deploy the approved migration branch to `pk-paints-renovations` using `npm run deploy:cloudflare`. Configure its own three secrets (omit `--env preview`) and verify its `workers.dev` URL. Preview secrets do not automatically transfer.
3. Export the **complete** current DNS zone and save Vercel deployment/domain settings. Public DNS checks on August 30 showed `ns1.vercel-dns.com` and `ns2.vercel-dns.com`; a public snapshot cannot reveal every subdomain or verify the registrar/Resend configuration.
4. Prepare a Cloudflare Free DNS zone with all existing A/AAAA/CNAME, MX, TXT, SPF, DKIM, DMARC, CAA, and verification records. Review DNSSEC/registrar DS records and email dependencies before any nameserver switch. Keep registration renewal enabled at the current registrar.
5. Obtain explicit approval for the exact DNS/nameserver changes. Workers custom domains require an active Cloudflare zone. First switch authoritative DNS while preserving the Vercel web targets; verify DNS and email before changing the web host.
6. Once approved, record the apex and `www` custom domains in the **top-level** `wrangler.jsonc` routes using `custom_domain: true`, then deploy. Keep `env.preview.routes` empty. Do not add production domains only in the dashboard while leaving the checked-in routes empty: a later deployment may undo that configuration. [Custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
7. Preserve the existing `www`-to-apex redirect with a Cloudflare zone Single Redirect (hostname equals `www.pkpaintsrenovations.com`, target `https://pkpaintsrenovations.com` plus the original path, preserve query string). This requires a separate approved zone change: `_redirects` does not support domain-level redirects. Keep this redirect outside Worker code so ordinary page visits still bypass compute.
8. Verify HTTPS, canonical redirects, every page, gallery filters/lightbox, mobile menu, phone/email links, privacy text, robots/sitemap, and one approved estimate delivery. Confirm the custom domain is indexable and the preview is not.
9. Only after a successful observation period, decide whether to merge and disconnect/cancel Vercel. Do not delete the old project or its email integration during initial cutover.

## Rollback and future deployment

- Before DNS cutover, rollback is simply leaving the domain on Vercel. No reset, force-push, or deletion is needed; `main` remains the known-good commit `65d690ee10d9bc7279e7e58a40c773b2a5a2228c` until an owner-approved merge.
- After cutover, use Cloudflare's previous successful Worker deployment for a code rollback. To return to Vercel hosting, obtain approval to remove the conflicting Worker custom domains and restore the saved Vercel web DNS targets. Do not blindly undo the whole zone: preserve mail records and coordinate DNSSEC if nameservers must be restored.
- Optional automatic deployment: connect this repository to **Workers Builds**, root `/`, Node `24`, build `npm run build`, deploy `npx wrangler deploy --env preview`, branch `chore/cloudflare-migration`. Keep it targeting the preview Worker. Change the production branch/deploy command only after approval; connecting GitHub may require the owner's permission grant.
- Do not enable both Workers Builds and a separate GitHub deploy workflow for the same Worker. The included GitHub workflow only validates; it never deploys or changes DNS.
