# How pkpaintsrenovations.com runs

Status as of October 18, 2026: **live on Cloudflare.** [CLOUDFLARE_MIGRATION.md](CLOUDFLARE_MIGRATION.md)
has the background on the move from Vercel.

## Where everything lives

| Piece | Where | Notes |
| --- | --- | --- |
| Code | GitHub `polskapeeps/PK-Paints`, branch `main` | Every push to `main` redeploys the site. |
| Hosting | Cloudflare Workers, Worker `pk-paints-renovations` (Free plan) | Pages and photos are static files. Only `/api/estimate` runs code. |
| DNS | Cloudflare zone `pkpaintsrenovations.com` (Free plan) | Nameservers `amir.ns.cloudflare.com` and `aryanna.ns.cloudflare.com`. |
| Domain registration | Vercel (team "polskapeeps' projects") | Paid through **September 14, 2027**. Auto-renew is **off**. |
| Estimate emails | Resend, workspace `pkpaintsreno` | Free plan: 100 emails a day, 3,000 a month. |

Vercel no longer serves the site. Its team is paused, so every Vercel project returns
"402 DEPLOYMENT_DISABLED", but domain renewals and nameserver changes still work there.
Vercel's GitHub app also adds a failing "Vercel: Account is blocked" check to each commit.
That check changes nothing; see [To do](#to-do).

## How updates go live

1. Push or merge to `main` on GitHub.
2. Cloudflare Workers Builds runs `npm run build`, then `npx wrangler deploy`. This takes
   about 1–2 minutes.
3. Follow it under **Workers & Pages → pk-paints-renovations → Deployments**. If a build fails,
   the previous version stays live.

Other branches and pull requests get their own preview copy (`npx wrangler preview`) on a
temporary `workers.dev` address. The Worker also keeps its own
`pk-paints-renovations.<account>.workers.dev` address. Google is told not to index any
`workers.dev` address. Previews don't get the email secrets, so their estimate form tells
visitors to call or email instead.

**To undo a bad release:** in Deployments, open the menu on the last good version and roll
back to it. Then fix the code and push again.

Build settings, for reference if the repo ever needs reconnecting (**Settings → Builds**):

- Production branch `main`, root directory `/`
- Build command `npm run build`, deploy command `npx wrangler deploy`,
  preview command `npx wrangler preview`
- No build variables or secrets

## Domain, www, and HTTPS

- **Main domain:** connected through `routes` in [`wrangler.jsonc`](../wrangler.jsonc) with
  `custom_domain: true`. Cloudflare creates and manages its DNS record. Keep the domain in that
  file: a domain added only in the dashboard can be removed by the next deploy.
- **www:** a proxied placeholder record (`A`, name `www`, address `192.0.2.1`) plus a redirect
  under **Rules → Redirect Rules**:
  - Wildcard pattern. Request URL `https://www.pkpaintsrenovations.com*`
  - Target URL `https://pkpaintsrenovations.com${1}`, status `301`, **Preserve query string** on
  - Never choose "All incoming requests" here. It also catches the main domain and redirects
    it to itself forever.
- **HTTPS:** **SSL/TLS → Edge Certificates → Always Use HTTPS** is on. The site has no separate
  origin server, so this can't cause a redirect loop.
- The domain has no email (MX) records and doesn't receive email. Leads go to Gmail.

## Estimate form email

The form posts to `/api/estimate`, which emails the request through Resend with any photo
attached and Reply-To set to the customer's email address.

The Worker reads three **runtime** secrets. They live under **Workers & Pages →
pk-paints-renovations → Settings → Runtime variables and secrets** (Production), each with
the **Secret** switch on:

| Name | Value |
| --- | --- |
| `RESEND_API_KEY` | An API key from Resend with Sending access |
| `ESTIMATE_FROM_EMAIL` | `PK Paints Website <onboarding@resend.dev>` |
| `ESTIMATE_TO_EMAIL` | `pkpaintsreno@gmail.com` |

- Don't put these under **Builds → Variables and secrets**. Only the build can see those, and
  the form then says "Online delivery is not configured yet."
- `onboarding@resend.dev` only delivers to the email address that owns the Resend account.
  To send leads anywhere else, or to send from your own address (for example
  `forms@send.pkpaintsrenovations.com`), verify the domain in Resend first. With DNS on
  Cloudflare, Resend can add its records for you.
- **To replace the API key:** create a new one in Resend, update `RESEND_API_KEY` in
  Cloudflare, send a test request, then delete the old key in Resend.
- Resend → **Emails** shows each request as Delivered, Opened, or Bounced.

## If the site looks down

1. Try a phone on mobile data. A VPN or router can hold on to an old DNS answer for about
   30 minutes.
2. Run the read-only check. It sends no email.

   ```bash
   npm run check:cloudflare -- https://pkpaintsrenovations.com
   ```

3. In Cloudflare → Deployments, check that the latest build says **Ready**.
4. Check the domain hasn't expired. It's paid through **September 14, 2027**, and auto-renew
   is off.
5. If the form says "We could not confirm delivery", Resend → Emails or Logs shows the reason.

## To do

- **Move the domain registration to Cloudflare, but only after October 29, 2026.** The domain
  was renewed during its post-expiry grace period. A transfer before that period ends cancels
  the year that was just paid for. After it, a transfer costs about $10.50, adds a year (to
  September 2028), and takes the domain out of the paused Vercel account.
  1. In Vercel: **Domains → pkpaintsrenovations.com → ⋯ → Transfer Out** to get the
     authorization code.
  2. In Cloudflare: **Domains → Transfers**, enter the domain and the code, and pay.
  3. Until the transfer is done, keep a reminder, since auto-renew is off at Vercel.
- Remove Vercel's GitHub access (GitHub → **Settings → Applications → Vercel**) so the failing
  check stops appearing.
- Delete the old test Worker `pk-paints-renovations-preview` in Cloudflare.
