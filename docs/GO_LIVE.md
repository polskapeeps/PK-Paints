# Getting pkpaintsrenovations.com back online

Status as of October 2, 2026. Start here; [CLOUDFLARE_MIGRATION.md](CLOUDFLARE_MIGRATION.md)
has the longer technical background.

## Where things stand

- **The domain expired on September 14, 2026.** It was registered through Vercel with
  auto-renew turned off. Its nameservers now point at the registrar's
  "renew your name" parking servers, so the site and any domain email are offline.
- **The code is ready for Cloudflare.** This branch builds, passes every test, and
  deploys to Cloudflare Workers on the Free plan ($0 for this site's traffic).
- **The estimate form** needs one free Resend account to deliver email (step 3).

## 1. Renew the domain now (urgent, about $10–20)

A `.com` gets a grace period of up to about 45 days after expiry where it renews
at the normal price. For this domain that window closes around **October 29, 2026**,
possibly sooner. After that it enters a 30-day redemption period with a large restore
fee (often $80–$200+) and can't be transferred. If that also lapses, anyone can buy it.

1. Sign in at vercel.com (account `polskapeeps`, team "polskapeeps' projects").
   If you can't sign in, use "Forgot password", or sign in with GitHub if that's how the
   account was created.
2. Go to **Domains → pkpaintsrenovations.com → Renew**. Pay for 1 year (or more).
3. Turn **auto-renew on** so this doesn't happen again.

You only need Vercel to keep the domain registered. You don't need any paid Vercel plan.

## 2. Put the site on Cloudflare (free)

1. Create a free account at dash.cloudflare.com.
2. **Workers & Pages → Create → Import a repository**, connect GitHub, and pick
   `polskapeeps/PK-Paints`.
3. Settings:
   - Project name: `pk-paints-renovations` (must match `wrangler.jsonc`)
   - Production branch: `main` once this branch is merged (until then, `chore/cloudflare-migration`)
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
4. Save and deploy. You'll get a working address like
   `pk-paints-renovations.<your-name>.workers.dev`. That address is hidden from Google on
   purpose (`noindex`) because it's temporary.

From then on, every push to the production branch redeploys automatically.

Prefer the command line? `npx wrangler login`, then `npm run deploy:cloudflare`.

## 3. Make the estimate form deliver email

The form sends email through Resend. You don't need a working domain for this:

1. Sign up at resend.com **using `pkpaintsreno@gmail.com`** and create an API key.
2. In Cloudflare: **Workers → pk-paints-renovations → Settings → Variables and Secrets**.
   Add each of these as type **Secret**, so later deploys don't wipe them:
   - `RESEND_API_KEY`: the key from Resend
   - `ESTIMATE_FROM_EMAIL`: `PK Paints Website <onboarding@resend.dev>`
   - `ESTIMATE_TO_EMAIL`: `pkpaintsreno@gmail.com`
3. Send yourself a test request from the live form, once with a photo and once without.

Resend's shared `onboarding@resend.dev` sender can only deliver to the email that owns
the Resend account. That's exactly where estimate requests should go anyway. Later, you can
verify the domain in Resend and switch to a branded sender like
`forms@send.pkpaintsrenovations.com`.

Without these secrets the site still works, and the form tells visitors to call or email.

## 4. Point the domain at Cloudflare (after step 1)

1. In Cloudflare: **Add a domain → pkpaintsrenovations.com → Free plan**. Cloudflare shows
   two nameservers, e.g. `xxx.ns.cloudflare.com`.
2. In Vercel: **Domains → pkpaintsrenovations.com → Nameservers**, replace the current
   ones with Cloudflare's two. Before switching, glance at Vercel's DNS records for
   anything you still use (e.g. Resend verification records) and re-create them in Cloudflare.
3. When Cloudflare says the domain is **Active** (minutes to a few hours), add the
   custom domain to the top-level `routes` in `wrangler.jsonc` and push:

   ```jsonc
   "routes": [{ "pattern": "pkpaintsrenovations.com", "custom_domain": true }],
   ```

   Keep `env.preview.routes` empty.
4. Redirect `www` to the main address: add a DNS record `www` → CNAME →
   `pkpaintsrenovations.com` (Proxied). Then use **Rules → Redirect Rules → template
   "Redirect from WWW to root"**.
5. Check the site at `https://pkpaintsrenovations.com`, then run
   `npm run check:cloudflare -- https://pkpaintsrenovations.com` (read-only, sends no email).

## Optional later: move the registration to Cloudflare

Cloudflare Registrar charges the wholesale price with no markup (about $10.50/year for a
`.com`, with free privacy). It also keeps the domain, DNS, and hosting in one account.
Once the domain is renewed and active, start a transfer from **Cloudflare → Domain
Registration → Transfer Domains**, using the auth code from Vercel. A transfer adds one
year. This step is optional: keeping the registration at Vercel with auto-renew on also works.
