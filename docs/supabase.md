# Supabase: setup and security

Everything the website stores lives in one Supabase project:

| What | Where in Supabase |
|---|---|
| Orders, customers, products, payments, enquiries, settings, homepage promotions… | Postgres, private schema **`dvine`** (36 tables) |
| Customer and team sign-in, email confirmation, password reset, two-step sign-in | **Auth** |
| Promotion photos/videos, review photos, water & lab reports | **Storage** buckets `media`, `review-photos`, `private` |

The SQL that creates all of it is in [`supabase/migrations/`](../supabase/migrations). It is the source of truth; `src/lib/db/schema.ts` mirrors it for typed queries.

---

## 1. Create the project

1. [supabase.com/dashboard](https://supabase.com/dashboard) › **New project**. Region **South Asia (Mumbai)**. Use a long generated database password and keep it in a password manager.
2. **Project Settings › API Keys**: copy the *publishable* key and create a *secret* key.
3. **Connect** (top bar): copy the **Session pooler** string (for setup, port 5432) and the **Transaction pooler** host (for the site, port 6543).

## 2. Environment

Copy `.env.example` to `.env.local` and fill in:

```
APP_SECRET=                 # openssl rand -base64 48
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
SUPABASE_SECRET_KEY=sb_secret_…
DATABASE_APP_PASSWORD=      # openssl rand -base64 32 | tr -d '/+='
DATABASE_ADMIN_URL=postgresql://postgres.<ref>:<db-password>@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
DATABASE_URL=postgresql://dvine_app.<ref>:<DATABASE_APP_PASSWORD>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
SEED_ADMIN_EMAIL=you@dvineh2o.com
SEED_ADMIN_PASSWORD=        # 12+ characters; remove after seeding
CRON_SECRET=                # openssl rand -base64 32
```

None of these may start with `NEXT_PUBLIC_`. The browser never gets a Supabase key.

## 3. Create the database

```
npm run db:setup      # = db:migrate (tables, security, storage buckets) + db:seed
npm run db:import     # optional: copy promotions, products & settings from the old data/dvine.db
npm run db:check      # verifies the security set-up against the live project — every line should be ✓
```

`db:seed` loads the homepage promotions that are on the site today (`supabase/seed/site-content.json`: the Diwali hero slide with its toran, lanterns, rangoli and diyas; the four ribbon messages; the "Gift Hyper this Diwali" card), the three products, water-test options, sample pincodes, the `WELCOME5` coupon and the first admin.

It also loads the blog's starter posts (`src/lib/blog-seed.ts`): five articles written for the site (what the price of Crystal, Hyper and Titan covers; what the research says about hydrogen water; what ionisation changes) and links to the team's ten articles on other sites. Edit or replace them in **Admin › Blog**.

It also loads the blog's starter posts (`src/lib/blog-seed.ts`): five articles written for the site (what each price covers, and what the research says about hydrogen and ionised water) and links to the team's ten articles on other sites. All of them can be edited, unpublished or deleted in **Admin › Blog**.

`db:import -- --all` also moves customers, orders, enquiries, staff and uploaded files from the old SQLite database (only into an empty database). Passwords move with the accounts.

## 4. Auth settings (dashboard)

**Authentication › URL Configuration**
- Site URL: `https://dvineh2o.com` (your live domain)
- Redirect URLs: `https://dvineh2o.com/**`, plus `http://localhost:3000/**` for development

**Authentication › Sign In / Providers**
- Email: **on**. *Confirm email*: **on**. *Secure email change*: **on**.
- Phone, anonymous sign-ins and all social providers: **off** (the site doesn't use them).
- Minimum password length **10**, require letters and digits. *Leaked password protection* (HaveIBeenPwned): **on** (Pro plan).

**Authentication › Multi-Factor**
- TOTP (authenticator app): **enabled**. Every team account must use it; customers don't see it.

**Authentication › Sessions** (Pro plan)
- *Detect and revoke compromised refresh tokens*: on. Inactivity timeout e.g. 7 days. (Team sessions are capped at `STAFF_SESSION_HOURS`, default 12, by the app.)

**Authentication › Emails › SMTP Settings**
- Use your own sender (e.g. Amazon SES, Postmark, or the same SMTP as `SMTP_*`). Supabase's built-in sender is limited to a few emails an hour and is for testing only.

**Authentication › Emails › Templates.** The site confirms links on the server (`/auth/confirm`), so change the link in these templates:

| Template | Link |
|---|---|
| Confirm signup | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` |
| Reset password | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery` |
| Change email address | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change` |

Example body for *Confirm signup*:

```html
<h2>Confirm your email</h2>
<p>Welcome to DVINE H2O. Confirm your email to finish creating your account — any earlier orders placed with this address will appear in it.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm my email</a></p>
<p>If you didn't sign up, ignore this email.</p>
```

**Authentication › Rate Limits**: keep the defaults or lower them. The site also rate-limits sign-in, sign-up, password reset and every public form itself.

## 5. API and database settings (dashboard)

- **Project Settings › Data API**: the site doesn't use it. Turn the Data API **off**, or at least make sure `dvine` is **not** in *Exposed schemas*. (`db:check` tests this.)
- **Database › Settings › SSL**: *Enforce SSL on incoming connections* **on**.
- **Database › Backups**: daily backups are included on Pro; consider Point-in-Time Recovery once orders are flowing.
- Optional (Pro): **Network restrictions** to your own IPs for direct connections; the site uses the pooler.

## 6. Hosting (Vercel)

Set on Vercel (Production + Preview): `NEXT_PUBLIC_SITE_URL`, `APP_SECRET`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `CRON_SECRET`, gateway / Shiprocket / SMTP / WhatsApp keys, `ALLOW_TEST_PAYMENTS=false`.
Do **not** set `DATABASE_ADMIN_URL`, `DATABASE_APP_PASSWORD` or `SEED_*` on Vercel.

Use a separate Supabase project (and test gateway keys) for staging.

## 7. Scheduled maintenance

`/api/cron/maintenance` releases stock held by unpaid orders, settles PhonePe payments whose customers never came back, marks abandoned carts and clears old rate-limit entries. Call it every 5–10 minutes, either with a Vercel Cron (Pro plan for sub-daily) or from Supabase itself:

```sql
-- Database › Extensions: enable pg_cron and pg_net. Then, once, in the SQL editor:
select vault.create_secret('<your CRON_SECRET>', 'dvine_cron_secret');
select cron.schedule('dvine-maintenance', '*/10 * * * *', $$
  select net.http_post(
    url := 'https://dvineh2o.com/api/cron/maintenance',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'dvine_cron_secret'))
  );
$$);
```

---

## How it is secured

**The browser can't reach the data.** All tables are in the `dvine` schema, which isn't exposed through Supabase's Data API, and the `anon`, `authenticated` and `service_role` roles have no privileges on it. Pages and actions read and write through the server only. There is no Supabase client in the browser, so no Supabase key is in the page source.

**The website's database login can do little.** The site connects as `dvine_app`: no superuser, no bypass of Row Level Security, no DDL, no `TRUNCATE`, no access to `auth` or `storage`. It may delete only cart lines, saved addresses, content drafts and rate-limit entries. RLS is on for every table.

**Money and records are protected in the database itself**, so not even a bug or a misused admin account can change them:
- Invoices, credit notes, the audit log, order history and stock history can't be edited or deleted, not even by the database owner.
- Orders, order lines, payments and refunds can't be deleted.
- Once an order is paid, its amounts, customer and number are fixed. Order lines can only gain serial numbers.
- A payment can't be re-priced or re-pointed, and a successful payment can't be turned back into a failed one.
- Refunds can never exceed what was paid.
- The last active admin can't be demoted or deactivated.

**Sign-in**
- Supabase Auth: bcrypt passwords, email confirmation, one-time reset links, refresh-token rotation. Sessions live in **HttpOnly, Secure, SameSite=Lax** cookies that page scripts can't read.
- Customers can claim earlier guest orders only through an email address they have **confirmed**. A phone number (unverified) never links or reveals anything.
- Team accounts need an **authenticator app (TOTP)** on every sign-in, are re-checked with Supabase Auth on every request, expire after 12 hours, and are separate from customer accounts. Roles live only in `dvine.staff`, never in user-editable metadata. Deactivating someone also bans their Supabase user. A lost phone is handled with *Reset two-step* in Settings › Staff.
- Sign-in, sign-up, password reset, two-step codes, every public form, order tracking, coupon codes, pincode checks, chat and payment starts are **rate-limited in Postgres**, so limits hold across all servers. Error messages don't reveal whether an account exists.

**Files**
- Every upload is checked by its real bytes (magic numbers), not its name or claimed type. PDFs carrying scripts or embedded files are refused.
- Water and lab reports are in a **private** bucket and served only to staff, the customer who owns them, or the holder of the booking's secret link. Anything else gets a 404.
- Admin media goes straight to Storage on a one-time signed URL issued only to signed-in content staff. The server then re-reads the bytes and deletes anything that isn't a real image or video. Visitors can't list, upload or delete anything.

**Blog**
- Posts are stored as plain text in a small Markdown subset and turned into page elements on the server. Raw HTML is never accepted, so nothing typed in the editor can run as script. Links are limited to this site, `https://`, `mailto:` and `tel:`; images to this site or an `https://` host.
- Only signed-in staff with the content permission can write, publish or delete, and every change is in the audit log.

**Blog**
- Posts are written in a small Markdown subset and rendered as React elements. Raw HTML is never accepted, links may only be `https://`, site paths, `mailto:` or `tel:`, and the database itself refuses any other external link.
- Only staff with the content permission can write, publish or delete posts; every change is in the audit log.

**Web**
- Content-Security-Policy, HSTS (production), `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP; `X-Powered-By` removed.
- Account, admin, checkout, order and invoice pages are `no-store` and `noindex`.
- Server Actions are protected against cross-site requests by Next.js; state-changing API routes check the request's origin.
- Guest links (`/order/…?t=`, water-test bookings) use 144-bit random tokens compared in constant time. Webhook and cron secrets are compared in constant time too.
- Payment results are confirmed with the gateway (signature or status API), never trusted from the browser.
- The audit log records every staff action with a keyed hash of the IP address (no raw IPs stored).

Run `npm run db:check` after any change to the project's settings.
