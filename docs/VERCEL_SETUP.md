# Vercel deployment setup

The live site is a Vite project deployed by Vercel from this repository. Vercel should use:

- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Vite

`vercel.json` keeps clean URLs, permanent redirects, and basic security headers in source control.

## Enable estimate delivery

The estimate page posts to the repository's `/api/estimate` Vercel Function. The function validates the request and sends it through Resend without exposing an API key to the browser.

1. Add the Resend integration to the Vercel project.
2. Verify a sending domain or subdomain in Resend. A dedicated sending subdomain such as `send.pkpaintsrenovations.com` keeps this separate from any future mailbox configuration.
3. Add these environment variables to both Preview and Production:
   - `RESEND_API_KEY` (created by the integration)
   - `ESTIMATE_FROM_EMAIL` (for example `PK Paints Website <forms@send.pkpaintsrenovations.com>` after that domain is verified)
   - `ESTIMATE_TO_EMAIL=pkpaintsreno@gmail.com`
4. Redeploy the branch preview.
5. Send one clearly labeled test request. Confirm delivery, Reply-To behavior, optional photo delivery, and campaign fields, then delete the test message and attachment.

The form intentionally does not promise a response time. It uses a honeypot, minimum completion time, same-origin enforcement, allowlisted values, input limits, and server-side file validation. Vercel's 4.5 MB request limit is handled by resizing one optional image in the browser before transmission.

## Before production merge

- Confirm that `(215) 603-8009` can receive SMS messages before retaining the mobile Text action.
- Review the privacy notice and select an internal retention practice for estimate emails and attachments.
- Keep analytics disabled unless the owner chooses a measurement option and approves the corresponding privacy update.
