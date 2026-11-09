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
| Returns and cancellations | `/policies/returns` | Cancellation window (until packed), return window, refund method and the 5–7 working day timeline |
| Warranty | `/policies/warranty` | Five-year DVINE Assured Care for Crystal/Titan, Hyper's warranty term (seeded as 12 months, not yet confirmed), what is not covered |

## Also check with them

- Footer and checkout links point to these pages; the consent checkbox on every form ("I agree to the terms and privacy policy…") relies on them.
- Marketing opt-in wording on forms ("Send me occasional updates from DVINE H2O").
- Any health or wellness wording about ionised, alkaline or hydrogen water across the product pages.

## When it's done

1. Paste the approved text into `POLICIES` in `src/lib/content.ts`.
2. Tick off item 6 in the README's "Before go-live" list.
3. Delete this file.
