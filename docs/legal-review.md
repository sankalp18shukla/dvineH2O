# Legal review before launch

> **Draft for review by DVINE H2O's legal team before launch.**

The policy pages are drafts written for the build. They have not been reviewed by DVINE H2O's legal team.
The "draft" banner has been taken off the pages so the site looks finished, so **this file is the only
reminder**. Do not launch until every page below is signed off.

## Pages to send for review

The text lives in `POLICIES` in `src/lib/content.ts`. Each page is served at `/policies/<slug>`.

| Page | URL | Points to confirm |
|---|---|---|
| Privacy policy | `/policies/privacy` | What is collected, payment data handling, sharing with delivery/payment/communication partners, contact for data requests (`care@dvineh2o.com`), compliance with India's DPDP Act |
| Terms of use and sale | `/policies/terms` | When an order is confirmed, GST wording, Titan sold on quotation, product-use and liability wording |
| Shipping and installation | `/policies/shipping-and-installation` | Delivery promise and timelines, installation scheduling, what the customer must have ready |
| Returns, refunds and replacement | `/policies/returns` | **Now DVINE's own text** (public/docs/policies/*.pdf, per product). Confirm: Crystal cancel-before-dispatch and Hyper 24-hour cancel vs. the account's "cancel until packed" button; Crystal's 48-hour return window vs. the store-wide 7-day setting |
| Warranty | `/policies/warranty` | **Now DVINE's own text** for Crystal (1 year comprehensive; chamber 4 years or 1,000 litres; service across Odisha). Still to confirm: Hyper's warranty term (seeded 12 months), Titan's terms, and whether "1,000 litres" is intended |

## Also check with them

- Footer and checkout links point to these pages; the consent checkbox on every form ("I agree to the terms and privacy policy…") relies on them.
- Marketing opt-in wording on forms ("Send me occasional updates from DVINE H2O").
- The blog's starter articles (`/blog`, written in `src/lib/blog-seed.ts`, editable in Admin › Blog): the two "Benefits" posts summarise research on hydrogen and alkaline water, and every post ends with a not-medical-advice note.
- Any health or wellness wording about ionised, alkaline or hydrogen water across the product pages.

## When it's done

1. Paste the approved text into `POLICIES` in `src/lib/content.ts`.
2. Tick off item 6 in the README's "Before go-live" list.
3. Delete this file.
