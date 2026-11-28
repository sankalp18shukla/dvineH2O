# Legal review before launch

> **Draft for review by DVINE H2O's legal team before launch.**

The policy pages are drafts written for the build. They have not been reviewed by DVINE H2O's legal team.
The "draft" banner has been taken off the pages so the site looks finished, so **this file is the only
reminder**. Do not launch until every page below is signed off.

## Pages to send for review

The text lives in `POLICIES` in `src/lib/content.ts`. Each page is served at `/policies/<slug>`.

| Page | URL | Points to confirm |
|---|---|---|
| Privacy policy | `/policies/privacy` | What is collected, payment data handling, sharing with delivery/payment/communication partners, contact for data requests (`reachout@dvineh2o.com`), compliance with India's DPDP Act |
| Terms of use and sale | `/policies/terms` | When an order is confirmed, GST wording, Titan sold on quotation, product-use and liability wording |
| Shipping and installation | `/policies/shipping-and-installation` | Delivery promise and timelines, installation scheduling, what the customer must have ready |
| Returns, refunds and replacement | `/policies/returns` | **DVINE's own text, updated 27 Nov 2026.** Crystal: returnable within 30 days of delivery (client's update; their return PDF still says 48 hours, so it is no longer linked: ask for a new PDF and the 30-day conditions). Hyper: cancel within 24 hours, now enforced in the account. Titan: terms being finalised, quotation applies |
| Warranty | `/policies/warranty` | **DVINE's own text, updated 27 Nov 2026** (new warranty PDF): Crystal 1 year on the machine, 5 years on the chamber, up to 1,000 litres; Hyper 1 year (warranty card); Titan being finalised, quotation applies. The A5 Crystal warranty card still prints "4 years": it needs reprinting |

## Also check with them

- **Grievance Officer (required).** The Consumer Protection (E-Commerce) Rules, 2020 ask an online seller to show
  the name, designation and contact details of its Grievance Officer, and the IT Rules ask the same for privacy
  complaints. The site has none yet: ask DVINE who it is, then add a "Grievance Officer" section to the privacy policy
  and terms (and the footer's Help column).
- **Cookies section** (added 28 Nov 2026 to the privacy policy): cart and sign-in cookies only; a second sentence on
  Google Analytics / Meta appears by itself once `NEXT_PUBLIC_GA_ID` or `NEXT_PUBLIC_META_PIXEL_ID` is set.

- **Certificates (added 28 Nov 2026, `HOME.certs` in `src/lib/content.ts`, shown on the homepage and /about).** Shown with
  number and a link to the certificate: ISO 14001 (QRO), GMP, RoHS and HACCP (Global Certification Services). All four
  are "valid subject to surveillance audit"; the first audit was due June 2026, so ask DVINE for the continuation letters.
  **Not shown, on purpose:** the "FDA" certificate from Mon Consulting (the US FDA does not certify products or companies,
  and the FDA logo may not be used to suggest approval); ISO 13485 (a medical-device standard, which reads as a
  medical claim); ISO 9001 (EI-2410045, our copy says it expired 29-11-2025: needs the renewal); EEPC membership
  (expired 31-03-2026). CE and BIS are still shown from the catalogue, but DVINE has not sent those certificates.
- Footer and checkout links point to these pages; the consent checkbox on every form ("I agree to the terms and privacy policy…") relies on them.
- Marketing opt-in wording on forms ("Send me occasional updates from DVINE H2O").
- The blog's starter articles (`/blog`, written in `src/lib/blog-seed.ts`, editable in Admin › Blog): the two "Benefits" posts summarise research on hydrogen and alkaline water, and every post ends with a not-medical-advice note.
- Any health or wellness wording about ionised, alkaline or hydrogen water across the product pages.

## When it's done

1. Paste the approved text into `POLICIES` in `src/lib/content.ts`.
2. Tick off item 6 in the README's "Before go-live" list.
3. Delete this file.
