# DVINE H2O — website, store and operations dashboard

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4, with a Drizzle ORM / SQLite (libSQL) database.
One codebase covers the public website, the e-commerce flow, the customer account and the admin dashboard
described in the *Website brief* and the *E-Commerce Database & Dashboard Requirements*.

```
npm install
cp .env.example .env.local      # then set AUTH_SECRET at minimum
npm run db:setup                # create tables + seed the 3 SKUs, test options, pincodes, first admin
npm run dev                     # http://localhost:3000   ·   admin: http://localhost:3000/admin
```

Seeded admin: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env.local` (defaults `admin@dvineh2o.com` / `ChangeMe!2026` — change it).
With Razorpay keys blank and `ALLOW_TEST_PAYMENTS=true`, checkout uses a built-in test gateway (simulate success / failure).

---

## What's in it

### Website (public)
| Page | Route | Notes |
|---|---|---|
| Home | `/` | 3D hero slideshow (Hyper → Crystal → Titan, real GLB models, autoplay + swipe), then the 7 content sections |
| Crystal | `/home-water-systems` | Buy box (price, stock, pincode + installation check), features, mode explorer, demo, specs, delivery, kitchen enquiry, reviews, FAQ |
| Hyper | `/hydrogen-bottles` | Buy box, everyday use, how it works, technology, specs, care, reviews, FAQ |
| Titan 111 / For Business | `/for-business` | Enquiry-led (no cart): consultation/quote form, bulk & gifting, dealer/distributor form |
| Water testing | `/water-testing` | Pincode availability, test options with parameters/price/turnaround, booking (paid or free), report upload (private), FAQ |
| Support | `/support`, `/support/[product]` | Search, product guides, order help, manuals/warranty, contact form (service topics become service tickets), FAQ |
| Book a demo, Search, Track order, Policies, 404 | `/book-demo`, `/search`, `/track`, `/policies/*` | Policies are drafts for legal review |
| Chat | every page | Rule-based assistant over the site content → "Talk to a person" hands over to a live agent in Admin › Enquiries (transcript stored in the CRM); optional WhatsApp hand-off |

Copy comes from the content document and lives in `src/lib/content.ts`. Prices, stock, specs, images and brochure/manual/video links are edited in Admin › Products.

### Commerce
- Cart (cookie), coupons, **referral codes**, quantity limits, live stock check.
- Guest or signed-in checkout, shipping + billing address, optional GSTIN, consent capture.
- Stock is **reserved** when the order is created and released automatically if payment isn't completed in time (maintenance job).
- **Razorpay**: server-created orders, signature-verified callback, webhook (`payment.captured`, `payment.failed`, `refund.*`), every attempt stored with method / error / stage. No card/UPI data touches the server. All Razorpay methods (UPI, cards, net banking, wallets, EMI, pay-later) are available in their checkout.
- Order lifecycle: Pending payment → Confirmed → Processing → Packed → Shipped → Delivered / Cancelled / Returned, with full event history.
- **GST invoices** auto-issued on payment (FY series `DVH/2026-27/0001`, CGST+SGST vs IGST by place of supply), **credit notes** for refunds, printable / save-as-PDF, bulk CSV export.
- **Shiprocket**: push order, assign AWB, tracking refresh, tracking webhook (auto-moves orders to Shipped/Delivered, logs RTO/exceptions). Manual shipments when not configured.
- Cancellations (customer until packed — configurable), returns, refunds (full/partial, via the gateway that took the payment), delivery exceptions.
- Warranties created per unit on payment; serial numbers assigned in the order screen; installation jobs for Crystal/Titan with scheduling.
- Verified-purchase reviews with photo upload → moderation queue → product pages.
- Pincode serviceability (delivery days, installation, water testing) managed in Admin.

### Customer account `/account`
Orders (cancel, return, review, installation slot), invoices & credit notes, warranties, service requests (with rating), water tests & enquiries, referral code + rewards, profile & addresses. Registering with the same email/phone claims earlier guest orders and enquiries (one customer record).

### Admin dashboard `/admin`
Role-based (Admin / Operations / Support — see Settings › Staff for the matrix). Every change is written to the audit log.

| Screen | What it does |
|---|---|
| Overview | Date-filtered sales snapshot (orders, units, gross, discounts, GST, refunds, net, AOV), daily chart, order pipeline, all 12 KPIs from the requirements doc, product snapshot per SKU, cart/checkout/payment funnel + failure reasons, customers, water testing & enquiries, post-purchase, "needs attention" |
| Orders | Filter/search, status moves, shipments (Shiprocket or manual), serials, installation, refunds, returns, exceptions, internal notes, invoice |
| Products | Price/MRP/GST/HSN, sale mode (cart vs enquiry), status, warranty, installation/serial flags, content, specs, images, brochure/manual/video |
| Inventory | On-hand / reserved / available per SKU, inward / adjustment / damage with reason, serial intake, movement history |
| Customers | Single profile: orders, spend, enquiries, tests, warranties, tickets, consent, notes |
| Enquiries & CRM | All forms + chats, stage (new → contacted → qualified → converted/lost/closed), owner, notes, quote value/status, outcome, uploaded reports, live chat reply |
| Water tests | Bookings, status, payment, lab-report upload (notifies customer), recommendation, conversion to order; edit test options |
| Payments & refunds | Every attempt with gateway refs and failure reasons; refunds |
| Warranty & service | Tickets (assign, priority, resolution, parts, rating), installations, warranties |
| Reviews · Coupons & referrals | Moderation; coupon CRUD; referral programme settings and log |
| Reports & export | 11 date-filtered CSV exports (orders, items, payments, refunds, invoices, customers, enquiries, water tests, stock, service, warranties) |
| Notifications · Audit log · Settings | Message log; audit trail; company/GST details, store rules, integrations, pincodes, staff |

---

## Project layout
```
src/app/(store)/…        public pages + account          src/app/admin/…        dashboard
src/app/actions/*.ts     server actions (forms)            src/app/api/…          webhooks, cron, chat, exports, private files
src/lib/db/schema.ts     the whole data model             src/lib/orders.ts      order/payment/refund/fulfilment logic
src/lib/content.ts       all page copy                    src/lib/metrics.ts     dashboard KPIs
src/components/store/…   storefront UI (hero in hero/)    src/components/admin/… dashboard UI
public/models/*.glb      3D models (meshopt-compressed)   public/images/*.webp   imagery from the catalog & brand book
tests/e2e.mjs            end-to-end smoke test (57 checks)
```

### Brand system (from *DViNE H2O brand book*)
- **Colours** — tokens in `src/app/globals.css` `@theme`. Deep Current is the brand **blue** (`#046FED`) and Ultra Ion the violet (`#5B00FF`), matching the swatches; the book's printed hex labels for these two are swapped, so confirm with the brand team.
- **Lockup headlines** — wrap the phrase to set in Garamond italic in `*asterisks*` in `src/lib/content.ts` (e.g. `'Find the *right fit.*'`); `rich()` in `src/components/ui/Brand.tsx` renders it.
- **Brand elements** (`src/components/ui/Brand.tsx` + `globals.css`): `LabelBox` (pinned highlight label), `Sticker` ("water as intended"), `Squiggle`, `.pin-frame` (photo corner markers), `.surface-blue` / `.surface-glacier` grounds and `.wave-lines` — all using the real brand pattern in `public/brand/pattern-*.svg`.
- **Type** — Garamond is the primary website face (body, lede, lockups); the sans (DX Figgle stand-in) carries headline weight, UI and instructions.

### Working on the design, section by section
- Brand tokens (colours, fonts, radii) are in `src/app/globals.css` under `@theme`; shared classes (`.btn-*`, `.card`, `.h-section`, `.stage`…) are just below.
- Each page is one file in `src/app/(store)/…`; sections are plain JSX blocks marked with comments, so they can be redesigned one at a time without touching logic.
- The home hero is `src/components/store/hero/` (`HeroShowcase.tsx` markup, `Hero.module.css` layout, `stage.ts` three.js scene and product placement in `PLACEMENT`).
- Fonts: EB Garamond and Bricolage Grotesque are self-hosted stand-ins in `src/fonts`. Drop the licensed Apple Garamond / DX Figgle files there and update `src/app/layout.tsx`.

---

## Environment
See `.env.example`. Key variables:

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Signs login sessions. Required in production (long random string). |
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | `file:./data/dvine.db` locally; `libsql://…` for Turso in production |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Live payments + webhook verification |
| `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_LOCATION`, `SHIPROCKET_WEBHOOK_TOKEN` | Shipping |
| `SMTP_*`, `MAIL_FROM` | Transactional email (otherwise messages are only logged) |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp Cloud API notifications + chat hand-off link |
| `CRON_SECRET` | Protects `/api/cron/maintenance` |
| `ALLOW_TEST_PAYMENTS` | Built-in test gateway when Razorpay keys are blank. **Keep `false` in production.** |

## Deploying
**Option A — Vercel + Turso (managed):** create a Turso database, set `DATABASE_URL`/`DATABASE_AUTH_TOKEN`, run `npm run db:setup` once against it, deploy. Move uploads (`src/lib/uploads.ts`) to S3/R2/Vercel Blob, since serverless disks aren't persistent. Add a Vercel Cron hitting `POST /api/cron/maintenance` every 10 minutes with `Authorization: Bearer $CRON_SECRET`.

**Option B — single VPS (matches the brief's 10 GB hosting):** `npm ci && npm run build && npm run db:setup && npm start` behind Nginx + Let's Encrypt, with `data/` on persistent disk and a nightly backup of `data/` (database + private uploads). Crontab: `*/10 * * * * cd /srv/dvine && npm run cron`.

Then configure:
- Razorpay Dashboard › Webhooks → `https://<domain>/api/webhooks/razorpay` (events: payment.captured, payment.failed, order.paid, refund.processed, refund.failed) with `RAZORPAY_WEBHOOK_SECRET`.
- Shiprocket › Settings › Webhooks → `https://<domain>/api/webhooks/shiprocket?token=<SHIPROCKET_WEBHOOK_TOKEN>`.
- A staging copy is the same app with its own database and Razorpay test keys.

## Before go-live (placeholders to replace)
1. **Prices** for Hyper and Crystal are placeholders (₹14,999 / ₹1,49,000). Confirm them in Admin › Products and tick "Price confirmed".
2. **Company details** (legal name, address, state, GSTIN, PAN) in Admin › Settings. Invoices show a placeholder banner until confirmed.
3. **Opening stock**, reorder levels and **water-test options/prices** are placeholders.
4. **Pincode list** is a sample of metro pincodes. Paste the real serviceability list in Admin › Settings › Pincodes.
5. **Warranty for Hyper** is seeded as 12 months (Crystal/Titan 5 years per the catalog). Confirm.
6. **Policies** (`/policies/*`) are drafts for legal review. HSN codes are suggestions. Confirm with your CA.
7. Upload brochures, manuals and demo videos (Admin › Products) and replace the stand-in fonts.
8. Change the seeded admin password, set `AUTH_SECRET`, and set `ALLOW_TEST_PAYMENTS=false`.

## Testing
```
npm run build && npm start &        # or npm run dev
set -a; source .env.local; set +a    # the test signs in with SEED_ADMIN_* from your env
BASE=http://localhost:3000 node tests/e2e.mjs
```
The suite creates real orders and enquiries — run it against a throwaway copy of the database, not one you care about.
Covers guest checkout with a failed-then-successful payment, coupons, invoice, tracking, Crystal with GST number and installation, Titan consultation, paid water test, report upload, service ticket, demo, chat bot + live agent reply, search, registration claiming guest orders, all account pages, admin shipping → delivery, partial refund + credit note, review moderation, inventory, all admin screens, CSV exports, and access control.

## Not built yet (by design, per the requirements doc §13)
Variant engine, marketplace sellers, recommendation engine, advanced segmentation, loyalty/rewards beyond referrals, forecasting. The chat assistant is rule-based over site content (no LLM); live agent replies are polled every 5 s.
