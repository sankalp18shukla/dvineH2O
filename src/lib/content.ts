/**
 * Website copy, taken from "DVINE H2O Website — Page-wise content in wireframe format" (21 Sep 2026)
 * and product facts from the DVINE H2O master catalog. Prices, stock and specs that the team edits
 * live in the database (Admin › Products); this file holds the page copy.
 */

import { GLOSSARY } from './glossary';

/** An FAQ row. `list` adds bullet points under the answer, `links` buttons after it; `id` lets a link open it (#id). */
export type Faq = { q: string; a: string; list?: string[]; links?: { href: string; label: string }[]; id?: string };
/** FAQs in named groups (product pages): shown as one accordion per group and marked up as FAQPage. */
export type FaqGroup = { title: string; items: Faq[] };

export const SITE = {
  name: 'DVINE H2O',
  tagline: 'The future of hydration',
  phone: '1800 202 4504',
  email: 'reachout@dvineh2o.com',
  /** customer care inbox (orders, returns, warranty, service) */
  careEmail: 'customercare@dvineh2o.com',
  legalName: 'DVINE United Private Limited',
  gstin: '21AAKCD6664L1ZC',
  whatsapp: '918984163478',
  whatsappUrl: 'https://wa.me/918984163478',
  address: ['Office No. 5, 1st Floor, Block 1, Bhawani Mall,', 'Saheed Nagar, Bhubaneswar, Odisha 751007'],
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bhawani+Mall+Saheed+Nagar+Bhubaneswar+751007',
  /** where delivery, installation and service are offered (client, Nov 2026) */
  serviceArea: 'Odisha',
  description: 'DVINE H2O makes functional hydration systems: Crystal for the home, Hyper hydrogen water bottle for the day, and TitanForce 111 for shared spaces.',
};

export const NAV = {
  main: [
    { href: '/home-water-systems', label: 'Home Water Systems' },
    { href: '/for-business', label: 'Office Water Systems' },
    { href: '/hydrogen-bottles', label: 'Hydrogen Bottles' },
    { href: '/water-testing', label: 'Water Testing' },
    // `wide`: in the bar only from 1440px; between 1280 and 1439 these two live in the menu, so the bar stays uncrowded
    { href: '/blog', label: 'Blog', wide: true },
    { href: '/become-a-partner', label: 'Become a Partner', wide: true },
    { href: '/about', label: 'About Us' },
  ],
  utility: [
    { href: '/for-business', label: 'For Business' },
    { href: '/support', label: 'Support' },
    { href: '/support#contact', label: 'Contact Us' },
  ],
};

export const FOOTER = [
  { title: 'Shop', links: [{ href: '/home-water-systems', label: 'Crystal' }, { href: '/hydrogen-bottles', label: 'Hyper' }, { href: '/for-business', label: 'TitanForce 111' }, { href: '/for-business#bulk', label: 'Bulk and gifting' }] },
  { title: 'Learn', links: [{ href: '/about', label: 'About us' }, { href: '/blog', label: 'Blog' }, { href: '/hydrogen-bottles#how-it-works', label: 'How Hyper works' }, { href: '/water-testing#book', label: 'Book a water test' }, { href: '/water-testing#upload', label: 'Upload a report' }] },
  { title: 'Help', links: [{ href: '/track', label: 'Track my order' }, { href: '/warranty', label: 'Check my warranty' }, { href: '/support#manuals', label: 'Manuals and warranty' }, { href: '/support#contact', label: 'Service request' }, { href: '/book-demo', label: 'Book a demo' }] },
  { title: 'Contact', links: [{ href: 'tel:18002024504', label: '1800 202 4504' }, { href: 'mailto:reachout@dvineh2o.com', label: 'reachout@dvineh2o.com' }, { href: 'mailto:customercare@dvineh2o.com', label: 'customercare@dvineh2o.com' }, { href: 'https://wa.me/918984163478', label: 'WhatsApp us' }, { href: '/support#contact', label: 'Send an enquiry' }, { href: '/for-business#enquiry', label: 'Request a quote' }] },
];

export const SOCIAL = [
  { key: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/dvineh2o/' },
  { key: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/dvineh2o/' },
  { key: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/918984163478' },
] as const;

export const POLICY_LINKS = [
  { href: '/policies/privacy', label: 'Privacy' },
  { href: '/policies/terms', label: 'Terms' },
  { href: '/policies/shipping-and-installation', label: 'Shipping and Installation' },
  { href: '/policies/returns', label: 'Returns' },
  { href: '/policies/warranty', label: 'Warranty' },
];

/** DVINE's technical papers. Until a file is in public/, the phrase that cites it shows unlinked (src/lib/research.ts). */
export const RESEARCH = {
  purecore: { href: '/docs/research/purecore-filtration.pdf', label: 'PureCore Filtration™ (PDF)' },
  hydrocore: { href: '/docs/research/hydrocore-ionisation-engine.pdf', label: 'HydroCore Ionisation Engine™ (PDF)' },
};

/** In-house test note under every numeric claim (website update brief); dates and reference from the performance report. */
export const TEST_NOTE = 'In-house tests by DVINE R&D, October 2026 (report LAB-WQR-2026-012). Results apply to the samples and settings tested and vary with source water and filter age.';

/** Customer video stories (client's "Customer Review" footage, Nov 2026): three Hyper owners talking about their
 *  bottle. Re-encoded small for the web (public/videos/reviews) and loaded only when someone presses play. */
export const STORIES = {
  title: '*Hear it from* the people who carry one.',
  items: [
    { src: '/videos/reviews/hyper-story-1.mp4', poster: '/videos/reviews/hyper-story-1.webp', w: 540, h: 960, duration: '3:02', product: 'hyper' as const },
    { src: '/videos/reviews/hyper-story-2.mp4', poster: '/videos/reviews/hyper-story-2.webp', w: 540, h: 960, duration: '4:33', product: 'hyper' as const },
    { src: '/videos/reviews/hyper-story-3.mp4', poster: '/videos/reviews/hyper-story-3.webp', w: 960, h: 540, duration: '2:30', product: 'hyper' as const },
  ],
};

/* ───────────────────────── Hero slides (home) ───────────────────────── */
export const HERO_SLIDES = [
  {
    key: 'hyper', model: '/models/hyper.210b86fc.glb', accent: '#FF2E9C',
    name: 'Hyper', desc: ['Hydrogen', 'Water', 'Bottle'],
    lede: 'Hyper uses PEM electrolysis to generate dissolved molecular hydrogen in suitable drinking water. See the bottle, explore the controls and find out how to use it.',
    ctas: [{ href: '/hydrogen-bottles', label: 'Shop Hyper', primary: true }, { href: '/hydrogen-bottles#how-it-works', label: 'See how it works' }],
    feats: [
      { icon: 'bubbles', title: 'PEM electrolysis', sub: 'Dissolved molecular hydrogen' },
      { icon: 'chamber', title: 'Borosilicate chamber', sub: 'Watch the micro-bubbles rise' },
      { icon: 'battery', title: 'USB-C rechargeable', sub: '2000 mAh battery' },
    ],
  },
  {
    key: 'crystal', model: '/models/crystal-countertop.04c94c60.glb', accent: '#25FFE8',
    name: 'Crystal', desc: ['Home', 'Water', 'System'],
    lede: 'A home water system with five platinum-coated titanium plates, PureCore multi-stage filtration and four water modes.',
    ctas: [{ href: '/home-water-systems', label: 'Shop Crystal', primary: true }, { href: '/book-demo?product=crystal', label: 'Book a Demo' }],
    feats: [
      { icon: 'plates5', title: 'Five-plate ionisation', sub: 'Platinum-coated titanium' },
      { icon: 'modes', title: 'Four water modes', sub: 'Hot, Ambient, Alkaline, High-Alkaline' },
      { icon: 'screen', title: 'Touchscreen controls', sub: 'pH, ORP and filter status' },
    ],
  },
  {
    key: 'titan', model: '/models/titan.f0268d31.glb', accent: '#F0FF00',
    name: 'Titan', desc: ['Semi-commercial', 'Water', 'System'],
    lede: 'TitanForce 111 is a floor-standing system with a SmartFlow multi-mode display, designed for semi-commercial applications with greater water demand.',
    ctas: [{ href: '/for-business#enquiry', label: 'Request a Quote', primary: true }, { href: '/for-business', label: 'Explore Titan' }],
    feats: [
      { icon: 'plates11', title: 'Eleven-plate ionisation', sub: 'Platinum-coated titanium' },
      { icon: 'drop', title: 'Built for volume', sub: 'For offices, hospitality and large homes' },
      { icon: 'display', title: 'SmartFlow display', sub: 'Multi-mode controls at a glance' },
    ],
  },
];

/* ───────────────────────── Home ───────────────────────── */
export const HOME = {
  waterTesting: {
    title: '*What do you know* about your water?',
    body: 'Start with a closer look at the water you use every day. See which tests are available in your area, what they include and how to book. Already have a report? Share it with our team.',
  },
  collection: {
    title: '*Find the* right fit.',
    body: 'One for your kitchen, one to take along and one for larger spaces. Start with where you’ll drink it.',
    // `cutout` is the transparent product PNG; until it is in public/, the section falls back to `image`.
    // Copy and facts here are written from the catalogue's "who it's for" angle (Collection, Living with DVINE,
    // product spreads) so they don't repeat the hero, which covers the hardware.
    cards: [
      { slug: 'crystal', href: '/home-water-systems', title: 'Crystal', where: 'At home', desc: 'Home Water System',
        body: 'Four-stage filtration, then five-plate ionisation, in one counter-top system. Choose hot, ambient or alkaline water at a touch, and let the display tell you when a filter needs changing.',
        feats: [
          { title: 'Drinking water', sub: 'Alkaline, pH 8.5 and 9.5 presets' },
          // the Hydrocore PDF says alkaline water is not recommended for infants, so infant feeds are no longer mentioned
          { title: 'Ambient water', sub: 'For everyday drinking, for taking medication, for children' },
          { title: '1-year comprehensive warranty', sub: 'Installed by DVINE-trained technicians' },
        ],
        cta: 'Shop Crystal', cutout: '/images/crystal/ivory.webp', image: '/images/crystal/duo.webp' },
      { slug: 'hyper', href: '/hydrogen-bottles', title: 'Hyper', where: 'On the go', desc: 'Hydrogen Water Bottle',
        body: 'Hydrogen-rich water wherever your day happens. It fits the routine you already have, in the gym bag or on the desk.',
        feats: [
          { title: 'Live H2 generation', sub: '4 ppm or 8 ppm mode' },
          { title: 'Refill and recharge', sub: 'USB Type-C rechargeable' },
          { title: 'Leak-proof body', sub: 'Built for daily and travel use' },
        ],
        note: 'Dissolved hydrogen: 7.5 ppm (7,500 ppb), measured at generation using the H₂ Blue Method, Dvine H2O Testing Lab, 15 November 2026. Drink fresh: levels fall once the bottle is opened.',
        cta: 'Shop Hyper', cutout: '/images/hyper/rose.webp', image: '/images/hyper/duo.webp' },
      { slug: 'titan', href: '/for-business', title: 'Titan', where: 'For larger spaces', desc: 'Semi-commercial Water System',
        body: 'For when a household becomes a compound and an office becomes a statement. Crystal’s ionisation, grown to institutional scale.',
        feats: [
          { title: '120 litres an hour', sub: 'Continuous output' },
          { title: 'Five water options', sub: 'Hot, cold, ambient, alkaline, high alkaline' },
          { title: 'Service across Odisha', sub: 'Certified DVINE engineers' },
        ],
        cta: 'Explore Titan', cutout: '/images/titan/force-111-cut.webp', image: '/images/titan/front.webp' },
    ],
  },
  technology: {
    title: '*See what happens* inside.',
    body: 'Crystal filters incoming water before the ionisation stage. Five platinum-coated titanium plates carry out electrolysis, while the touchscreen brings the operating information into view.',
    // one step per part of the inside video; `fact`/`note` is the figure set opposite the copy on wide screens.
    // `refs` annotate a phrase of `body` (matched exactly) with a numbered link to the supporting paper (opens in a new tab).
    // A cited phrase links to its PDF only once the file is in public/ (RESEARCH, src/lib/research.ts)
    labels: [
      { title: 'Filtration', body: 'Incoming water passes through the PureCore™ multi-stage filtration first. Four stages work in order (sediment, carbon, nano, UV), so each one protects the next.', fact: 'PureCore', note: 'Filtration™',
        refs: [{ text: 'PureCore™ multi-stage filtration', ...RESEARCH.purecore }] },
      { title: 'Ionisation', body: 'The HydroCore Ionisation Engine™ is the electrolysis core of Crystal. Five platinum-coated titanium plates split purified water into an alkaline stream for your glass and an acidic stream that goes to the drain. You choose the pH.', fact: 'HydroCore', note: 'Ionisation Engine™',
        refs: [{ text: 'HydroCore Ionisation Engine™', ...RESEARCH.hydrocore }] },
      { title: 'Touchscreen', body: 'One tap to choose your water. See live temperature and filter status, get fault alerts, and let Wi-Fi send service signals.', fact: 'Intelligent display', note: 'temperature · filter status · fault alerts' },
    ],
  },
  /** Six benefit cards (website update brief). No card names a disease, a symptom or "detox" (brand book).
   *  `tag` says how we know; `shoot` is the photo direction for DVINE's shoot. The photos are stand-ins from the
   *  existing library until those shots arrive. */
  benefits: {
    title: '*Water that* does more.',
    cards: [
      { title: 'Built into your day', body: 'A glass first thing. A bottle for the desk. Hot water for the evening tea. Hydration works when it is easy, so the next glass is one tap away.',
        tag: 'Brand', image: '/images/settings/hyper-desk.webp', alt: 'Hyper in Gravity Grey on a sunlit work desk beside a laptop and coffee',
        shoot: 'Real life in motion, unposed: mid-commute or mid-workout, product held or carried, never the hero of the frame' },
      { title: 'A clean start', body: 'Sediment, carbon, nano and UV treatment, in that order. In our test, E. coli and total coliform were absent in the treated sample (raw: 18 and 45 CFU/100 mL).',
        tag: 'Measured in-house', image: '/images/drop.webp', alt: 'A drop of water landing on a still blue surface',
        shoot: 'Water in its purest form: a glass catching light, ripples, refraction' },
      { title: 'Taste first', body: 'Activated carbon holds back chlorine and odour. In our challenge test, free chlorine fell from 2.05 mg/L to below 0.02 mg/L.',
        tag: 'Measured in-house', image: '/images/lifestyle-drink.webp', alt: 'A man drinking water outdoors in soft light',
        shoot: 'A glass lifted mid-sip at a kitchen counter, morning light, water meeting lips, no product in frame' },
      { title: 'Your pH, your call', body: 'Alkaline water at about pH 8.5 for everyday drinking or about pH 9.5 for occasional use, chosen at a touch.',
        tag: 'How it works', image: '/images/crystal/kitchen-counter.webp', alt: 'Crystal on a kitchen counter with its display lit',
        shoot: 'A hand on the display in soft focus, a glass in the other hand' },
      { title: 'Works with your minerals', body: 'Crystal does not add minerals or strip them in the ionisation stage. In our test, sodium and potassium were about 89% retained, calcium and magnesium about two-thirds.',
        tag: 'Measured in-house', image: '/images/1_2ndsec.png', alt: 'Cupped hands catching running water',
        shoot: 'Pouring from a jug into a glass at a family table, hands only' },
      { title: 'Hydrogen, fresh', body: 'Hyper makes hydrogen-rich water in your own bottle at 4 ppm or 8 ppm. Hydrogen escapes over hours, so drink it fresh.',
        tag: 'How it works', image: '/images/rising-bubbles.webp', alt: 'Fine bubbles rising through water',
        shoot: 'Micro-bubbles rising in a glass, macro, then Hyper in a gym bag' },
    ],
  },
  /** Certification row (`scale` evens out the marks' visual weight at one row height). The logos are cut from the master catalogue's certification page (public/images/certs).
   *  `file` is a web copy of the certificate itself (public/docs/certificates), opened from the panel. Rows left empty are left out of the panel.
   *  Show a mark only while its certificate is valid. On hold until DVINE sends a current certificate:
   *  - ISO 9001:2015 (EI-2410045, Innovative Systemcert): the copy we have says "Certificate expiry 29-11-2025". To restore it:
   *    { key: 'iso-9001', scale: 1.35, name: 'ISO 9001:2015', short: 'Quality management', logo: '/images/certs/iso-9001.webp', w: 158, ... }
   *  - ISO 13485 (medical-device QMS) and the "FDA registration" certificate are deliberately not shown (see docs/legal-review.md). */
  certs: {
    title: '*Built to be* trusted.',
    body: 'The certificates behind DVINE and its products, and what each one covers. Select a mark for the details.',
    items: [
      { key: 'iso-14001', scale: 1.35, name: 'ISO 14001:2015', short: 'Environmental management', logo: '/images/certs/iso-14001.webp', w: 167, covers: 'Environmental management system: how DVINE supplies its products was independently assessed against ISO 14001.', number: '305025060721E', issuer: 'QRO Certification LLP', valid: '6 June 2028, with yearly surveillance audits', models: 'Water ionisers, purifiers and dispensers, hydrogen bottles and spare parts', file: '/docs/certificates/iso-14001.webp' },
      { key: 'gmp', scale: .88, name: 'GMP', short: 'Manufacturing practice', logo: '/images/certs/gmp.webp', w: 335, covers: 'Good manufacturing practice: the way DVINE sources, handles and supplies its products is controlled and documented to a set standard.', number: 'GCS/GMP/10435', issuer: 'Global Certification Services', valid: '6 June 2028, with yearly surveillance audits', models: 'Water ionisers, purifiers and dispensers, hydrogen bottles and spare parts', file: '/docs/certificates/gmp.webp' },
      { key: 'rohs', scale: .88, name: 'RoHS', short: 'Hazardous substances', logo: '/images/certs/rohs.webp', w: 384, covers: 'Restriction of hazardous substances: limits lead, mercury, cadmium and other substances in the electronics.', number: 'GCS/RoHS/10437', issuer: 'Global Certification Services', valid: '6 June 2028, with yearly surveillance audits', models: 'Water ionisers, purifiers and dispensers, hydrogen bottles and spare parts', file: '/docs/certificates/rohs.webp' },
      { key: 'haccp', scale: 1.5, name: 'HACCP', short: 'Food safety', logo: '/images/certs/haccp.webp', w: 167, covers: 'Hazard analysis and critical control points: a food-safety method that finds the points where drinking water could be contaminated along DVINE’s supply, and sets a control for each.', number: 'GCS/HACCP/10434', issuer: 'Global Certification Services', valid: '6 June 2028, with yearly surveillance audits', models: 'Water ionisers, purifiers and dispensers, hydrogen bottles and spare parts', file: '/docs/certificates/haccp.webp' },
      { key: 'ce', scale: 1, name: 'CE', short: 'European conformity', logo: '/images/certs/ce.webp', w: 224, covers: 'European conformity: the product meets EU safety, health and environmental requirements.', number: '', issuer: '', valid: '', models: 'Crystal (DC-5114)' },
      { key: 'bis', scale: 1.3, name: 'BIS (IS 14724:1999)', short: 'IS 14724, UV purifiers', logo: '/images/certs/bis.webp', w: 166, covers: 'Bureau of Indian Standards certification under IS 14724:1999, the standard for water purifiers with ultraviolet disinfection. It covers the UV purification stage, not alkalinity, hydrogen or any health benefit.', number: '', issuer: 'Bureau of Indian Standards', valid: '', models: 'Crystal (DC-5114)' },
    ],
  },
  reviews: {
    title: '*What owners* say.',
    /** the block stays hidden on the live site until this many approved reviews exist (brief: "about ten genuine ones") */
    minimum: 10,
  },
  blog: {
    title: '*From the* blog.',
  },
  about: {
    title: '*Meet* DVINE.',
    body: 'We make water systems for homes, shared spaces and portable use. Our approach brings filtration, ionisation and hydrogen-generation technology into products people can understand and use in everyday life.',
  },
  assistance: {
    title: '*Questions* before you order?',
    body: 'Ask about your water supply, installation or product care. If you already own a DVINE product, we’ll help you find the right support.',
  },
};

/**
 * About Us (/about). The founder's note is Nandini Lakhotia's own (old site and the master catalogue's "Founder's
 * Note"); the company facts come from DVINE's certificates (incorporation, DPIIT, Legal Metrology). Her photos
 * (supplied 2026-11-28) live in public/images/founder: the 3:4 portrait is cropped from the campaign shot, its handwritten
 * captions cut out and the arrow painted out.
 */
export const ABOUT = {
  title: '*Water should* do more.',
  body: 'DVINE H2O is a Bhubaneswar company making water systems for the home, the office and the day in between. We take water past “purified” and look at what stays in the glass.',
  founder: {
    title: '*The question that* started it.',
    name: 'Nandini Lakhotia',
    role: 'Founder, DVINE H2O',
    portrait: { src: '/images/founder/nandini-portrait-34.webp', alt: 'Nandini Lakhotia smiling, holding a Rose Hyper bottle', width: 540, height: 720 },
    moments: [
      { src: '/images/founder/nandini-expo.webp', alt: 'Nandini Lakhotia showing a Hyper bottle to visitors at the DVINE H2O stall', caption: 'Showing Hyper at the DVINE stall' },
      { src: '/images/founder/nandini-meeting.webp', alt: 'Nandini Lakhotia at a meeting with a Gravity Grey Hyper on the table', caption: 'A Gravity Grey Hyper at the table' },
      { src: '/images/founder/nandini-desk.webp', alt: 'Nandini Lakhotia working on a laptop in a café, a Rose Hyper beside her', caption: 'A Rose Hyper beside the laptop' },
    ],
    lead: 'DVINE H2O didn’t begin with a business plan. It began with a question: is purified water truly enough?',
    note: [
      'Like many, I believed clean water meant safe water. But over time, I noticed how issues like fatigue, low energy and overall wellness are rarely connected back to what we drink every day.',
      'That curiosity led me to explore water beyond purification: understanding minerals, pH balance and hydrogen-rich hydration. I realised that while RO technology removes harmful elements, we rarely ask if the water left behind is actually beneficial for the body.',
    ],
    close: 'DVINE H2O was built on one belief: water should do more than be safe. It should actively support better health and balanced living.',
  },
  beliefs: {
    title: '*The things we* believe.',
    items: [
      { icon: 'shield', title: 'Safe is the starting point', body: 'Purification removes what is harmful. We also look at what is left in the glass: minerals, pH and dissolved hydrogen.' },
      { icon: 'plates5', title: 'Made by electrolysis', body: 'Crystal sets the pH with platinum-coated titanium plates, not mineral additives or chemical buffers. Hyper makes its hydrogen fresh, in the bottle.' },
      { icon: 'chart', title: 'Measured, then said', body: 'We publish what our own water tests found, before and after treatment, so you can check the numbers for yourself.', href: '/home-water-systems/test-results', link: 'See the test results' },
      { icon: 'screen', title: 'Made for the room', body: 'Systems that belong on a kitchen counter or in a reception, with a screen that shows what the water is doing.' },
    ],
  },
  collection: {
    title: '*One philosophy,* three systems.',
    items: [
      { href: '/home-water-systems', title: 'Crystal', body: 'For the home', image: '/images/crystal/card.webp' },
      { href: '/for-business', title: 'TitanForce 111', body: 'For offices and shared spaces', image: '/images/titan/force-111-front.webp' },
      { href: '/hydrogen-bottles', title: 'Hyper', body: 'Hydrogen water, on the go', image: '/images/hyper/card.webp' },
    ],
  },
  care: {
    title: '*We stay after* the sale.',
    body: 'A water system is only as good as the people who fit and look after it. Ours are DVINE’s own.',
    items: [
      { title: 'Installed by our technicians', body: 'Crystal and Titan are fitted by DVINE-trained technicians, who check your water line, power and drainage first.' },
      { title: 'Service across Odisha', body: 'Delivery, installation and service throughout Odisha, from our base in Bhubaneswar.' },
      { title: 'Warranty in writing', body: 'Crystal: 1 year on the machine and 5 years on the chamber, up to 1,000 litres. Hyper: 1 year.' },
      { title: 'One number to call', body: 'Toll-free on 1800 202 4504, or WhatsApp and email if that suits you better.' },
    ],
  },
  registered: {
    title: '*Registered and* recognised.',
    items: [
      { title: 'DVINE United Private Limited', body: 'Incorporated on 23 February 2024 under the Companies Act, 2013. CIN U11043OD2024PTC045113. GSTIN 21AAKCD6664L1ZC.' },
      { title: 'Startup India', body: 'Recognised as a startup by the Department for Promotion of Industry and Internal Trade, Government of India. Certificate DIPP196542.', file: '/docs/certificates/startup-india.webp' },
      { title: 'Legal Metrology', body: 'Registered with the Department of Consumer Affairs as an importer of Crystal and the hydrogen water bottle. Registration GOI/OR/2025/1634.', file: '/docs/certificates/legal-metrology.webp' },
    ],
  },
  close: {
    title: '*Questions before* you order?',
    body: 'Ask about your water supply, installation or product care. Or see Crystal working in your own kitchen first.',
  },
};

/* ───────────────────────── Crystal ───────────────────────── */
export const CRYSTAL = {
  hero: {
    title: 'Crystal. Made for your kitchen.',
    body: 'A home water system with five platinum-coated titanium plates, PureCore multi-stage filtration and four water modes. Explore the controls, check your installation requirements and choose when you’re ready.',
    gallery: ['/images/crystal/ivory-front.webp', '/images/crystal/ivory-angle.webp', '/images/crystal/ivory-side.webp', '/images/crystal/ivory-profile.webp'],
  },
  /** Crystal's colours (BottleFinish.tsx): picking one wipes its own render up over the last on the product stage,
   *  and the gallery shows that colour. The cut-outs share one canvas so the wipe lines up. */
  finishes: [
    { key: 'ivory', name: 'Ivory', swatch: '#e9e6df', cutout: '/images/crystal/ivory.webp',
      photos: ['/images/crystal/ivory-front.webp', '/images/crystal/ivory-angle.webp', '/images/crystal/ivory-side.webp', '/images/crystal/ivory-profile.webp'] },
    { key: 'midnight', name: 'Midnight Black', swatch: '#232326', cutout: '/images/crystal/midnight.webp',
      photos: ['/images/crystal/midnight-front.webp', '/images/crystal/midnight-angle.webp', '/images/crystal/midnight-side.webp', '/images/crystal/midnight-profile.webp'] },
  ],
  /** Homepage benefit cards 1–5 word for word, then one of Crystal's own (hydrogen belongs to Hyper). */
  benefits: {
    title: '*What Crystal* does for you.',
    own: { title: 'Always in the know', body: 'The display shows live temperature, your pH mode and filter life, and flags faults. Wi-Fi sends service signals.',
      tag: 'How it works', image: '/images/crystal/kitchen-pour.webp', alt: 'Crystal on a kitchen counter, its display lit, a glass under the tap',
      shoot: 'A hand on the display in soft focus' },
  },
  /** How Crystal works: four steps in the homepage's order. A step's name links to its PDF once the file is in. */
  features: {
    title: '*How Crystal* works.',
    cards: [
      { icon: 'filter', title: 'PureCore Filtration™', body: 'Four stages, each protecting the next. Sediment catches dust, rust and sand. Activated carbon holds back chlorine and odour. A nano filter takes out fine particles and bacteria. UV treatment adds microbial control with no chemicals and no change in taste.',
        doc: RESEARCH.purecore },
      { icon: 'plates5', title: 'HydroCore Ionisation Engine™', body: 'Five plates of 99.99% pure titanium, each 0.5 mm thick and coated with platinum, split your purified water at 24 V into an alkaline stream for your glass and an acidic stream for the drain. You pick the pH.',
        doc: RESEARCH.hydrocore },
      { icon: 'modes', title: 'Four water modes', body: 'Hot, Ambient, Alkaline, High alkaline.' },
      { icon: 'screen', title: 'SmartFlow Interface', body: 'An intelligent display with live water temperature, your selected pH mode, filter status and fault alerts.' },
    ] as { icon: string; title: string; body: string; doc?: { href: string; label: string } }[],
  },
  modes: {
    title: '*Choose a mode.* Understand its use.',
    items: [
      { key: 'hot', title: 'Hot', body: 'Press the lock key to release the child lock, then draw hot water. The temperature shows on the display. Up to 100 °C.', color: '#FF0401' },
      { key: 'neutral', title: 'Ambient', body: 'Plain water at room temperature, labelled “Ambient” as on the display. For everyday drinking, for taking medicines, for children’s drinks, for any time you want water with no adjustment.', color: '#F0F2F7' },
      { key: 'alkaline', title: 'Alkaline', body: 'About pH 8.5, for everyday drinking. Made from your own water, so the minerals it arrived with stay in the glass.', color: '#25FFE8' },
      { key: 'high', title: 'High alkaline', body: 'About pH 9.5, for occasional use and not for everyday drinking. Read the manual first. If you have a health condition, ask your doctor.', color: '#5B00FF' },
    ],
    note: 'Use only the drinking-water settings specified in the product manual.',
  },
  demo: {
    title: '*Take a closer look* at Crystal.',
    body: 'See how to select a mode, read the display and use the controls. The demonstration walks you through the machine before your first use.',
  },
  fit: {
    title: '*Check the fit. Know what* comes with it.',
    body: 'Before you order, check the dimensions, water connections and available space. You can also share a photo of your kitchen and ask our team about the setup.',
    needs: [
      { icon: 'home', title: 'Counter space', body: 'A level counter beside your sink, with room above for the dispenser.' },
      { icon: 'drop', title: 'Water inlet', body: 'A cold-water connection the technician can tap into.' },
      { icon: 'battery', title: 'Power point', body: 'A grounded socket within reach of the unit.' },
      { icon: 'drain', title: 'Drain line', body: 'A drain or sink outlet for the waste-water line.' },
    ],
    setup: { title: '*Check my* setup.', body: 'Tell us about your kitchen and attach a photo of the counter and water connection. Our team will check the setup with you before you order.' },
  },
  delivery: {
    title: '*Know what to expect* after you order.',
    body: 'Check delivery availability for your postcode, review the installation arrangements and see the maintenance guidance for Crystal. Your warranty details are available here whenever you need them.',
    items: [
      { q: 'Delivery', a: 'Enter your pincode in the purchase panel to see whether we deliver to you and the expected date. We confirm the delivery date when you order and share tracking once it ships.' },
      { q: 'Installation', a: 'After delivery, our team contacts you to schedule installation. A DVINE-trained technician installs Crystal, connects the water line and walks you through the controls. Please keep the water connection and power point ready.' },
      { q: 'Care and maintenance', a: 'A little routine keeps Crystal working as it should.', list: [
        'Filters: the sediment, carbon and nano filters are replaced together every 6 to 8 months, depending on how much water you use.',
        'Reading the display: each filter shows its life in bars. A new filter shows 3 bars, and the count falls as the filter is used.',
        'When to call us: when the display shows an error or “replace filters”, call service on 1800 202 4504 or raise a request from Support.',
        'Every week, wipe the outside with a soft damp cloth. Every month, check the inlet and drain pipes for leaks. Every year, have a certified technician inspect the machine.',
        'Use only genuine DVINE H2O filters.',
      ], links: [{ href: '/support#contact', label: 'Raise a service request' }] },
      { q: 'Warranty', a: 'Crystal has a one-year comprehensive warranty on the machine and a five-year warranty on the electrolysis chamber, for up to 1,000 litres of use. The warranty starts on the purchase date and is listed in your account with your order.', links: [{ href: '/policies/warranty#crystal', label: 'Read the warranty' }] },
    ] as Faq[],
  },
  /** Crystal FAQ (website update brief): four groups, marked up as FAQPage. */
  faq: {
    title: '*Still deciding? Let’s* clear a few things up.',
    groups: [
      { title: 'Alkaline water basics', items: [
        { q: 'What is alkaline water?', a: 'Water with a pH above 7. pH is a 0 to 14 scale where 7 is neutral. Crystal’s drinking presets are pH 8.5 and pH 9.5.' },
        { q: 'How does Crystal make alkaline water?', a: 'Crystal applies 24 V across five platinum-coated titanium plates while purified water flows through. At the negative plates pH rises, and at the positive plates it falls. Valves send the alkaline stream to your glass and the acidic stream to the drain.' },
        { q: 'How is that different from a purifier with an alkaline cartridge?', a: 'Some purifiers raise pH by adding minerals from a cartridge. Crystal changes pH by electrolysis and lets you choose the level.' },
        { q: 'What are the benefits of alkaline water?', a: 'People choose it for taste, for an easy daily hydration habit, and because early studies look at digestive comfort and hydration after exercise. Many of those studies are small and the evidence is still developing. We do not claim that alkaline water treats or prevents any condition.' },
        { q: 'Does alkaline water help with acidity or reflux?', a: 'Some small studies look at it, and they are early. Crystal is not a treatment. If acidity or reflux keeps coming back, see your doctor.' },
        { q: 'What is ORP, and does Crystal change it?', a: 'ORP is a millivolt reading of whether water tends to gain or lose electrons. Freshly ionised water reads negative. In our test, high-alkaline water measured −480 mV as dispensed and was back to positive within 48 hours. ORP is not a measure of health benefit.' },
        { q: 'Is Crystal’s water hydrogen-rich?', a: 'Electrolysis dissolves some hydrogen. In our test, freshly dispensed high-alkaline water held about 0.85 mg/L, and it fell below the detection limit by 48 hours. Hyper makes 4 ppm or 8 ppm hydrogen-rich water on demand.', links: [{ href: '/hydrogen-bottles', label: 'See Hyper' }] },
      ] },
      { title: 'Before you buy', items: [
        { id: 'why-price', q: 'Why is Crystal priced at ₹1,75,000?', a: 'Crystal does two jobs in one machine, and both are built to a specification you can read. PureCore Filtration™ runs four stages: sediment, activated carbon, nano filter and UV. The HydroCore Ionisation Engine™ uses five plates of 99.99% pure titanium with a platinum coating. You choose hot, ambient, alkaline or high-alkaline water at a touch, and the SmartFlow Interface shows temperature, filter life and faults. In our tests free chlorine fell from 2.05 mg/L to below 0.02 mg/L, total iron from 2.40 to 0.05 mg/L, and E. coli from 18 CFU/100 mL to absent. It is made in India and installed by a DVINE-trained technician. MRP is ₹2,25,000. We price Crystal on what it is and does, not on a health promise.', links: [{ href: '/home-water-systems/test-results', label: 'See the test results' }] },
        { q: 'Is my water suitable for Crystal?', a: 'Crystal is designed for municipal tap water at 40 to 100 psi, up to 350 mg/L TDS and 5 to 40 °C. If your supply is borewell, tanker or stored water, book a water test first.', links: [{ href: '/water-testing', label: 'Water testing' }] },
        { q: 'What happens if my TDS is too high?', a: 'Above 350 mg/L you are outside the range Crystal is designed for. Test your water and add suitable pre-filtration before it reaches Crystal. We would rather check your water with you than guess.' },
        { q: 'What if my TDS is very low, for example after an RO purifier?', a: 'Electrolysis needs dissolved minerals to carry current, so very low-TDS water may not ionise well. Tell us your TDS before you order and we will check it with you.' },
        { q: 'What if my water’s pH is low?', a: 'Crystal ionises to the pH you choose. In DVINE’s verified test, source water at pH 5.6 came out at pH 8.5 and pH 9.5. Very acidic supply can also corrode pipes, so test it.' },
        { q: 'Will it work with borewell water that has iron or hardness?', a: 'Crystal is designed for municipal water. In our tests on iron-rich groundwater, total iron fell from 2.40 to 0.05 mg/L. On hard groundwater, total hardness fell from 450 to 210 mg/L, still above the IS 10500 acceptable limit of 200. Each is one sample, and your water will differ.', links: [{ href: '/home-water-systems/test-results#tr-cases', label: 'See the case studies' }] },
        { q: 'Does Crystal add minerals or take them out?', a: 'It does not add minerals, and the ionisation stage does not strip them. The nano stage does reduce some. In our test sodium and potassium were about 89% retained, calcium and magnesium about two-thirds.' },
        { q: 'Will it lower my TDS?', a: 'Crystal is not a desalination system. TDS fell from 310 to 185 mg/L in one test and rose slightly after ionisation in another (103 to 124 mg/L at pH 8.5). Each is one sample, and your water will differ.' },
        { q: 'Is alkaline water safe for children, pregnancy and older adults?', a: 'Alkaline water is not recommended for infants. Children above 10 may drink it if it suits them and they eat a balanced diet. If you are pregnant or breastfeeding, or have a kidney or liver condition, speak to a qualified healthcare professional first. Use ambient water for infants and for taking medicines.' },
        { q: 'Does Crystal need Wi-Fi?', a: 'No. Wi-Fi sends service signals and filter health status, and Crystal works fully without it.' },
        { q: 'What does installation involve?', a: 'A DVINE-trained technician installs Crystal after delivery. You need level counter space, a cold-water inlet, a grounded power point and a drain line. Installation takes about 15 minutes, at no extra charge.' },
        { q: 'How much power does it use?', a: 'The ionisation stage is rated at 200 W.' },
        { q: 'Which certifications does it hold?', a: 'CE, ISO 9001:2015, GMP, RoHS and BIS under IS 14724:1999 (water purifiers with ultraviolet disinfection).', links: [{ href: '/#certifications', label: 'See the certificates' }] },
      ] },
      { title: 'Using Crystal', items: [
        { q: 'What do the four modes do?', a: 'Hot water up to 100 °C after you release the child lock. Ambient water at room temperature for everyday drinking and medicines. Alkaline at about pH 8.5 for everyday drinking. High alkaline at about pH 9.5 for occasional use.' },
        { q: 'Which pH should I choose?', a: 'Start with pH 8.5 for everyday drinking. Keep pH 9.5 for occasional use, and read the manual before you use it.' },
        { q: 'How long does alkaline water stay alkaline?', a: 'In our test, high-alkaline water in a sealed glass bottle at about 24 to 25 °C went from pH 9.35 to 8.75 over 48 hours. Hydrogen and negative ORP fade sooner, so drink it fresh.' },
        { q: 'What should I store it in?', a: 'Glass or stainless steel, filled to the top and sealed, kept cool. Hydrogen passes through most plastics.' },
        { q: 'Where does the acidic water go?', a: 'To the drain. It is for external use only and is not for drinking.' },
        { q: 'What does the display show?', a: 'Live water temperature, your selected pH mode, filter life with a days-remaining countdown, and fault alerts.' },
      ] },
      { title: 'Care, service and warranty', items: [
        { q: 'How often are filters replaced?', a: 'The sediment, carbon and nano filters are replaced together every 6 to 8 months, depending on use. UV has no part to replace.' },
        { q: 'How will I know when?', a: 'The display shows each filter’s life in bars. A new filter shows 3 bars. When the display shows an error or “replace filters”, call DVINE service.' },
        { q: 'Can I change filters myself?', a: 'Yes. It is as simple as pressing the button and lifting the filter out. Use only genuine DVINE H2O filters.' },
        { q: 'What routine care does Crystal need?', a: 'Wipe the outside weekly with a soft damp cloth. Check the inlet and drain pipes monthly for leaks. Have a certified technician inspect it every year.' },
        { q: 'What does a filter set or a service visit cost?', a: 'Up to ₹10,000 a year.' },
        { q: 'What does the warranty cover?', a: 'One year on the machine, comprehensive, and five years on the electrolysis chamber, for up to 1,000 litres of use. It excludes misuse, unauthorised repairs and use outside the manual.', links: [{ href: '/policies/warranty#crystal', label: 'Read the warranty' }] },
        { q: 'Who services Crystal, and where?', a: 'Certified DVINE engineers. Delivery, installation and service are available throughout Odisha. Raise a request on Support or call 1800 202 4504.', links: [{ href: '/support#contact', label: 'Raise a request' }] },
        { q: 'Can I pay in instalments, and can I return it?', a: 'Yes, you can pay by UPI, card or EMI, including EMI through Bajaj Finance. You can return Crystal within 30 days of delivery.', links: [{ href: '/policies/returns#crystal', label: 'Returns policy' }] },
      ] },
    ] as FaqGroup[],
  },
};

/* ───────────────────────── Hyper ───────────────────────── */
export const HYPER = {
  hero: {
    title: 'Meet Hyper. A hydrogen water bottle to take along.',
    body: 'Hyper uses PEM electrolysis to generate dissolved molecular hydrogen in suitable drinking water. See the bottle, explore the controls and find out how to use it.',
    gallery: ['/images/hyper/rose-front.webp', '/images/hyper/rose-angle.webp', '/images/hyper/rose-open.webp', '/images/hyper/inside.webp'],
  },
  /** Hyper comes in two colours (BottleFinish.tsx): picking one wipes its own photo up over the last on the product
   *  stage, and the gallery shows that colour. The cut-outs share one canvas so the wipe lines up. */
  finishes: [
    { key: 'rose', name: 'Rose', swatch: '#b4202a', cutout: '/images/hyper/rose.webp',
      photos: ['/images/hyper/rose-front.webp', '/images/hyper/rose-angle.webp', '/images/hyper/rose-back.webp', '/images/hyper/rose-open.webp', '/images/hyper/inside.webp'] },
    { key: 'gravity-grey', name: 'Gravity Grey', swatch: '#6f787b', cutout: '/images/hyper/grey.webp',
      photos: ['/images/hyper/grey-front.webp', '/images/hyper/grey-angle.webp', '/images/hyper/grey-side.webp', '/images/hyper/grey-back.webp', '/images/hyper/inside.webp'] },
  ],
  everyday: {
    title: '*From your desk* to your day out.',
    body: 'Keep it on your desk, pack it with your gym kit or take it along when you head out. Explore a portable format that fits the way you already carry water.',
    cards: [
      // B05–B07: the card titles are the copy; `alt` follows the photo brief ("Photo: Hyper on a work desk")
      { title: 'At your desk', alt: 'Hyper in Gravity Grey on a sunlit work desk beside a laptop and coffee', image: '/images/settings/hyper-desk.webp' },
      { title: 'In your bag', alt: 'Hyper in a bag side pocket', image: '/images/lifestyle-locker.webp' },
      { title: 'Outdoors', alt: 'Hyper in Rose held up on a seafront promenade at sunset', image: '/images/settings/hyper-outdoors.webp' },
    ],
  },
  how: {
    title: '*Fill it. Start the cycle.* Follow the guide.',
    steps: [
      'Fill with drinking water that meets the product instructions.',
      'Start a hydrogen-generation cycle using the bottle’s controls.',
      'Follow the guidance for drinking, cleaning and storage.',
    ],
  },
  tech: {
    title: '*Hydrogen generation* inside the bottle.',
    body: 'The electrolysis chamber generates molecular hydrogen that dissolves into the water during operation. Digital controls let you operate the available functions according to the product instructions.',
    /** Labels for HyperAssembly. 01–04 are the electrolysis cell's parts, top to bottom, named while they spread
     *  apart above the base; 05–08 are the outer parts, named as the bottle closes up around them. */
    parts: [
      { name: 'Sealing ring', body: 'Seals the electrolysis cell, so the water stays in the chamber and away from the electronics.' },
      { name: 'Threaded collar', body: 'Holds the cell together and lets the glass chamber screw firmly onto the base.' },
      { name: 'Platinum-titanium electrodes', body: 'Split a little of the water by electrolysis to make hydrogen, a cycle at a time.' },
      { name: 'SPE/PEM membrane', body: 'Lets the hydrogen into your water and keeps the oxygen on the other side, where it is released.' },
      { name: 'Control base', body: 'One-touch panel with an LED indicator, a smart timer and auto shut-off. Starts a 4 ppm or 8 ppm cycle.' },
      { name: 'Battery and USB-C port', body: '2000 mAh battery (3.7 V / 7.4 Wh). About 75 minutes to a full charge, and about 45 cycles from each charge.' },
      { name: 'Glass chamber', body: 'Borosilicate glass in an aluminium sleeve. You can watch the micro-bubbles rise while the cycle runs.' },
      { name: 'Anodised aluminium cup', body: 'It screws on to close the bottle, so it travels in a bag without leaking.' },
    ],
    /** three lines under the parts */
    benefits: [
      { title: 'Fresh when you want it.', body: 'You make hydrogen-rich water in your own bottle, so you drink it soon after the cycle.' },
      { title: 'Carry it.', body: 'USB-C charging, a leak-proof body, built for daily and travel use.' },
      { title: 'Clean in one tap.', body: 'An Auto Clean mode is part of the cycle controls.' },
    ],
  },
  /** under the spec table */
  smallPrint: 'Hyper makes hydrogen-rich water. It does not purify water, so start with drinking water. Hydrogen escapes over time, so drink soon after the cycle.',
  care: {
    title: '*A little care* between refills.',
    body: 'Follow the instructions for cleaning the bottle, charging it and caring for the electrolysis chamber. You’ll find the guide here when you need a reminder.',
    steps: [
      { title: 'Rinse', body: 'Empty and rinse the cup and glass chamber after use.' },
      { title: 'Clean', body: 'Run the Auto Clean mode as described in the guide.' },
      { title: 'Charge', body: 'Recharge over USB-C when the indicator shows low battery.' },
    ],
  },
  /** Hyper FAQ (website update brief): four groups, marked up as FAQPage. */
  faq: {
    title: '*A few things to know* before you buy.',
    groups: [
      { title: 'The basics', items: [
        { q: 'What is hydrogen-rich water?', a: 'Drinking water with molecular hydrogen (H2) gas dissolved in it.' },
        { q: 'How does Hyper make it?', a: 'Platinum-titanium plates and a PEM membrane split water by electrolysis. The hydrogen dissolves into the water in the glass chamber, and the oxygen is released.' },
        { q: 'What do 4 ppm and 8 ppm mean?', a: 'ppm is parts per million, which in water is milligrams per litre. At 4 ppm there are 4 mg of hydrogen in each litre. Hyper has a 4 ppm mode and an 8 ppm mode.' },
        { q: 'What does the research say about hydrogen water?', a: 'Molecular hydrogen is studied as a selective antioxidant. Most human trials are small, results are mixed, and dissolved hydrogen is hard to measure at the moment of drinking. Hyper is a hydration product, not a medical device. We make no claim to treat or prevent any condition.', links: [{ href: '/blog/hydrogen-water-what-early-research-says', label: 'Read more' }] },
        { q: 'Does Hyper purify water?', a: 'No. Start with drinking water. Hyper adds hydrogen and does not treat untreated water.' },
      ] },
      { title: 'Using Hyper', items: [
        { q: 'How do I use it?', a: 'Fill the bottle with drinking water. Start a cycle from the one-touch panel. Drink soon after, and follow the care steps.' },
        { q: 'What water can I use?', a: 'Clean drinking water at room temperature, such as filtered, RO or purified water. Never hot water, carbonated or flavoured drinks, soda or heavy mineral water.' },
        { q: 'How long does a cycle take?', a: 'Between 5 and 10 minutes, depending on the mode, and auto shut-off ends it.' },
        { q: 'How soon should I drink it?', a: 'Within about 15 to 30 minutes of the cycle. Hydrogen is a very small molecule and escapes from water and from most containers, so water kept for hours holds less.' },
        { q: 'How much does the bottle hold?', a: '280 ml.' },
        { q: 'Can I take Hyper on a flight?', a: 'Its battery is rated 7.4 Wh, below the 100 Wh limit that airlines commonly set for carry-on devices.' },
      ] },
      { title: 'Battery, cleaning and care', items: [
        { q: 'How do I charge it, and how long does a charge last?', a: 'Charge it over USB-C with the cable in the box. The LED shows when the battery is low. The battery is 2000 mAh (3.7 V). A full charge takes about 75 minutes and lasts about 45 cycles, around 11 litres.' },
        { q: 'How do I clean it?', a: 'Rinse after use, run the Auto Clean mode, and recharge when the LED shows low battery.' },
        { q: 'Is it dishwasher safe?', a: 'No. Rinse the cup and glass chamber by hand, and keep the base out of water.' },
        { q: 'Is the body leak-proof?', a: 'Yes. The housing is leak-proof and made of BPA-free Tritan. The chamber is borosilicate glass and the cup is anodised aluminium.' },
        { q: 'How long will Hyper last?', a: 'Hyper is built for about five years of use. The warranty covers the first year.' },
      ] },
      { title: 'Buying Hyper', items: [
        { q: 'Which colours does Hyper come in?', a: 'Rose and Gravity Grey.' },
        { q: 'What is in the box?', a: 'The Hyper bottle, a USB-C charging cable and the user guide.' },
        { q: 'What does it cost?', a: 'MRP ₹18,999. ₹15,999 after the discount, inclusive of GST.' },
        { q: 'What is the warranty?', a: 'One year.', links: [{ href: '/policies/warranty#hyper', label: 'Read the warranty' }] },
        { q: 'Can I order Hyper in bulk or as gifts?', a: 'Yes. Use the bulk and gifting form on the Business page.', links: [{ href: '/for-business#bulk', label: 'Bulk and gifting' }] },
        { q: 'Can I pay in instalments, and can I return it?', a: 'Yes, you can pay by UPI, card or EMI, including EMI through Bajaj Finance. Returns are accepted for products that arrive damaged or do not match their description.', links: [{ href: '/policies/returns#hyper', label: 'Returns policy' }] },
      ] },
    ] as FaqGroup[],
  },
};

/* ───────────────────────── Water testing ───────────────────────── */
export const WATER_TESTING = {
  hero: {
    title: '*Get to know the water* you use every day.',
    body: 'See what a water test can tell you, check what’s available in your area and choose your next step. If you already have a report, you can share it with our team.',
  },
  scope: {
    title: '*Know what’s included* before you book.',
    body: 'Enter your postcode to see the available testing options. Each option shows what is measured, how the sample is collected, the price and when to expect your report.',
  },
  how: {
    title: '*Here’s what* happens next.',
    steps: [
      { title: 'Choose your test', body: 'Check the scope and select an available option.' },
      { title: 'Arrange your sample', body: 'Follow the collection instructions for your booking.' },
      { title: 'Receive your report', body: 'See the measured results and the scope of the test.' },
      { title: 'Ask a question', body: 'Contact us if you need help understanding the next step.' },
    ],
  },
  booking: {
    title: '*Let’s arrange* your water test.',
    body: 'Tell us where the sample will come from. We’ll show the available collection options and total cost before you confirm.',
  },
  upload: {
    title: '*Already have* a water report?',
    body: 'Share a clear copy of the complete report, including the test date. Tell us what you’d like to understand, and our team will review your enquiry.',
  },
  explain: {
    title: '*Read the results* with context.',
    body: 'Your report lists the parameters tested and their measured results. Read those results alongside the sample details, test date and the reference ranges used in the report. If something is unclear, ask us.',
    // illustrative layout only: shows where each column sits on a report, not real results
    sample: {
      meta: [['Sample', 'Kitchen tap, source supply'], ['Collected', 'DD MMM YYYY'], ['Report ref', 'WT-XXXXX']],
      cols: ['Parameter', 'Unit', 'Result', 'Reference range'],
      rows: [['pH', '—', '•••', 'As listed in the report'], ['TDS', 'mg/L', '•••', 'As listed in the report'], ['Total hardness', 'mg/L as CaCO₃', '•••', 'As listed in the report'], ['Free chlorine', 'mg/L', '•••', 'As listed in the report'], ['Turbidity', 'NTU', '•••', 'As listed in the report'], ['E. coli', 'CFU/100 mL', '•••', 'As listed in the report']],
      note: 'Results are compared with IS 10500, India’s drinking-water standard.',
    },
  },
  /** Comparison of the two tests: the rows come from the tests in Admin (price, method, report, parameters). */
  compare: {
    title: '*Choose a test* in ten seconds.',
    body: 'Two tests. The Essential test is a quick on-site check of four basics. The Comprehensive lab test covers 17 parameters, including bacteria and metals.',
  },
  faq: {
    title: '*Before* you book.',
    items: [
      { q: 'Which test do I need?', a: 'The Essential test is a quick on-site check of four basics. The Comprehensive lab test covers 17 parameters, including bacteria and metals. Choose Comprehensive for borewell or tanker water, a new home, or any change in taste, smell or colour, and before you choose a system.' },
      { q: 'What does each test measure?', a: 'Essential: pH, TDS, hardness and chlorine. Comprehensive: those four plus alkalinity, chloride, iron, nitrate, fluoride, turbidity, total coliform, E. coli, arsenic, lead, mercury, sulphate and manganese.' },
      { q: 'What does it cost?', a: 'The Essential test is free. The Comprehensive lab test is ₹999.' },
      { q: 'Do I have to buy a DVINE product?', a: 'No. You can request a test without buying anything.' },
      { q: 'How is the sample taken?', a: 'For Essential, a DVINE technician tests on site. For Comprehensive, we collect the sample at home in a sterile kit.' },
      { q: 'When will I get the report?', a: 'Essential, in the same visit. Comprehensive, in 7 to 9 working days.' },
      { q: 'Can I test water from my RO or filter?', a: 'Yes. When you book, say whether the sample is your source supply or water from a system, so we can confirm the right test.' },
      { q: 'How do I read my report?', a: 'Every result has a parameter, a unit, a measured value and a reference range. Hover or tap any term for its meaning, or read the guide on this page.' },
      { q: 'What limits do you compare my results with?', a: 'IS 10500, India’s drinking-water standard, which gives an acceptable and a permissible limit for each parameter. For example, TDS is 500 mg/L acceptable and 2,000 mg/L permissible, and pH should sit between 6.5 and 8.5.' },
      { q: 'Does a test tell me my water is safe to drink?', a: 'No single test does. A report describes one sample on one day. If it finds E. coli or total coliform, do not drink that water untreated, and call us.' },
      { q: 'Can I upload an older report?', a: 'Yes. Use the upload form and tell us what you want to understand.', links: [{ href: '#upload', label: 'Upload a report' }] },
    ] as Faq[],
  },
  /** One-line definitions for the parameters and units (src/lib/glossary.ts, shown by Term.tsx). */
  glossary: GLOSSARY,
  slots: ['Morning (9 am – 12 pm)', 'Afternoon (12 – 4 pm)', 'Evening (4 – 7 pm)'],
  sources: ['Municipal supply', 'Borewell', 'Tanker', 'Overhead tank', 'Existing purifier / RO', 'Other'],
};

/* ───────────────────────── For business ───────────────────────── */
export const BUSINESS = {
  hero: {
    title: '*Water for the spaces* people share.',
    body: 'Explore Titan for your workplace, hospitality property or larger residence. Tell us about daily use and peak demand so we can help assess your requirement.',
  },
  titan: {
    title: '*Meet* TitanForce 111.',
    body: 'Eleven platinum-coated titanium plates. A floor-standing system with a SmartFlow multi-mode display. Designed for semi-commercial applications with greater water demand.',
    views: [
      { title: 'Front view', body: 'TitanForce 111, floor-standing.', image: '/images/titan/force-111-front.webp' },
      { title: 'Three-quarter view', body: 'The service side, with the handle and vent.', image: '/images/titan/force-111-angle-right.webp' },
      { title: 'Side view', body: '34 cm deep.', image: '/images/titan/force-111-side.webp' },
    ],
    /** the four details around Titan on the office page, from its specifications */
    features: [
      { icon: 'plates11', title: 'Eleven plates', body: 'Platinum-coated titanium, HydroCore ionisation for higher demand.' },
      { icon: 'drop', title: '120 litres an hour', body: 'Continuous output for the busiest part of the day.' },
      { icon: 'display', title: 'SmartFlow display', body: 'One panel for hot, cold, ambient, alkaline and high-alkaline water.' },
      { icon: 'building', title: 'Floor-standing', body: 'A semi-commercial build for offices, hospitality and larger homes.' },
    ],
  },
  /** Six benefit cards under the hero, as the homepage's. Tags say "Specification": there is no Titan test data yet. */
  benefits: {
    title: '*Why teams* choose Titan.',
    cards: [
      { title: 'Water for the whole floor', body: '120 litres an hour, continuous. Enough output that a busy corridor or a full canteen does not wait on the tap.', tag: 'Specification',
        image: '/images/titan/pour.webp', alt: 'TitanForce 111 filling a glass' },
      { title: 'Five choices at one point', body: 'Hot, cold, ambient, alkaline and high alkaline from the same unit.', tag: 'Specification',
        image: '/images/titan/display.webp', alt: 'The TitanForce 111 display with its water options' },
      { title: 'Crystal’s engine, scaled up', body: 'Eleven platinum-coated titanium plates use the same ionisation principle as Crystal, built for shared use.', tag: 'Specification',
        image: '/images/titan/front.webp', alt: 'TitanForce 111, front view' },
      { title: 'See it at a glance', body: 'The SmartFlow Interface puts every mode on one panel, with live status and fault alerts on the display.', tag: 'Specification',
        image: '/images/titan/setup.webp', alt: 'Choosing a water mode on the TitanForce 111 display' },
      { title: 'Planned around your space', body: 'A site assessment comes first. A DVINE-trained technician installs it and hands it over.', tag: 'Process',
        image: '/images/titan/blog-cover.webp', alt: 'TitanForce 111 installed at a client site' },
      { title: 'Looked after', body: 'Installed and serviced by certified DVINE engineers, throughout Odisha. Warranty and service terms are set out in your quotation.', tag: 'Service',
        image: '/images/titan.webp', alt: 'TitanForce 111 in use at a client site' },
    ],
  },
  /** Water options, laid out as Crystal's modes. */
  modes: {
    title: '*Five water options.* One unit.',
    items: [
      { key: 'hot', title: 'Hot', body: 'Hot water for tea, coffee and instant meals, with the temperature on the display. Up to 100 °C.', color: '#FF0401' },
      { key: 'cold', title: 'Cold', body: 'Chilled water on tap, down to 15 °C.', color: '#43D2FA' },
      { key: 'neutral', title: 'Ambient', body: 'Plain water at room temperature, for everyday drinking and for taking medicines.', color: '#F0F2F7' },
      { key: 'alkaline', title: 'Alkaline', body: 'About pH 8.5, for everyday drinking.', color: '#25FFE8' },
      { key: 'high', title: 'High alkaline', body: 'About pH 9.5, for occasional use, not everyday drinking. Read the manual first.', color: '#5B00FF' },
    ],
    note: 'Alkaline water is not recommended for infants. Ambient water is always available at the same unit.',
  },
  /** what the quotation depends on, under "Priced on quotation" */
  quote: 'What shapes the quote: the number of users, your peak hours, the source water and the site layout.',
  /** the demo film block shows only once Titan has a video (Admin › Products) */
  demo: { title: '*See Titan* in use.' },
  faq: {
    title: '*Questions about* TitanForce 111.',
    items: [
      { q: 'What is TitanForce 111, and who is it for?', a: 'A floor-standing water system for shared spaces, with an eleven-plate HydroCore ionisation engine and a SmartFlow Multi-Mode Display. It is built for offices, hospitality and larger homes.' },
      { q: 'How much water can it supply?', a: '120 litres an hour, continuous. Tell us your daily users and peak hours and we size the system to them.' },
      { q: 'Which water options does it offer?', a: 'Hot, cold, ambient, alkaline and high alkaline.' },
      { q: 'How is Titan different from Crystal?', a: 'Titan uses eleven plates where Crystal uses five, so it scales output on the same principle. It stands on the floor and is built for shared use. Crystal sits on a counter and fits a household.' },
      { q: 'Is the water safe for everyone in the office?', a: 'Alkaline water is not recommended for infants, and anyone who is pregnant or breastfeeding, or has a kidney or liver condition, should speak to a qualified healthcare professional first. Ambient water is always available at the same unit. Use high alkaline for occasional drinking only.' },
      { q: 'What does Titan cost?', a: 'Titan is priced on quotation. The quote depends on the number of daily users, peak demand, your source water and the site layout.' },
      { q: 'How does the process work?', a: 'Site assessment, then configuration and connections, then installation and handover by a DVINE-trained technician, then service arrangements.' },
      { q: 'What do I need to prepare?', a: 'Floor space for a unit 123 × 34 × 34 cm that weighs 22 kg, a tap-water inlet at 100 to 150 psi, a drain and a 220–240 V power point. We confirm the details at the site assessment.' },
      { q: 'What source water does it need?', a: 'Tap water, at an inlet pressure of 100 to 150 psi. If your supply is borewell, tanker or stored water, test it first.', links: [{ href: '/water-testing', label: 'Water testing' }] },
      { q: 'How are filters handled?', a: 'Sediment, carbon and nano filters with UV treatment come before ionisation. Filter changes are planned with your service arrangements, and the interval and price are set out in your quotation.' },
      { q: 'What are the warranty and service terms?', a: 'Titan’s warranty, its return and refund terms and its user manual are being finalised. Until they are published, the terms for your unit are set out in your quotation. Service is by certified DVINE engineers, throughout Odisha.' },
      { q: 'Can I buy Titan online?', a: 'No. Titan is sold only on quotation, after we understand your space and demand. Request a quote and our team will get in touch.', links: [{ href: '#enquiry', label: 'Request a quote' }] },
      { q: 'Can I see Titan before I buy?', a: 'Yes. Book a demo.', links: [{ href: '/book-demo?product=titan', label: 'Book a demo' }] },
      { q: 'Can I get several units or a service contract?', a: 'Use the bulk form for several units, and tell us in your quote request if you need a service contract.', links: [{ href: '#bulk', label: 'Bulk orders' }] },
    ] as Faq[],
  },
  settings: {
    title: '*Plan around the way* your space works.',
    items: [
      { title: 'Offices', body: 'Consider daily users, refill points and the busiest part of the day.', image: '/images/settings/titan-office.webp', alt: 'Colleagues queueing to fill a bottle at TitanForce 111 in an office pantry' },
      { title: 'Hospitality', body: 'Discuss guest areas, dining spaces and operating hours.', image: '/images/settings/titan-hospitality.webp', alt: 'A server filling a carafe at TitanForce 111 in a restaurant' },
      { title: 'Larger residences', body: 'Assess household demand and the available installation space.', image: '/images/settings/titan-residence.webp', alt: 'A parent filling a glass at TitanForce 111 as a child waits, in a family kitchen' },
    ],
  },
  setup: {
    title: '*Get the setup right* before you order.',
    body: 'Share your location, source water and intended installation area. We’ll use those details to discuss the configuration, connections and service arrangements for your site.',
    steps: [
      { title: 'Site assessment', body: 'We look at your space, source water and daily demand.' },
      { title: 'Configuration and connections', body: 'We agree the setup, water line and drain for your site.' },
      { title: 'Installation and handover', body: 'A DVINE-trained technician installs Titan and walks your team through it.' },
      { title: 'Service arrangements', body: 'Filter changes and servicing are planned around your site.' },
    ],
  },
  enquiry: {
    title: '*Tell us what* you need.',
    body: 'Whether it’s one location or several, share the basics and we’ll take the conversation from there.',
    settings: ['Office', 'Hospitality', 'Larger residence', 'Wellness / clinic', 'Other'],
    timelines: ['Within a month', '1–3 months', '3–6 months', 'Just exploring'],
  },
  bulk: {
    title: '*Looking at* a larger order?',
    body: 'Ask about Hyper for team or client gifting, or share a requirement for multiple DVINE products. We’ll confirm availability, quantities and delivery options in your quotation.',
  },
};

/* ───────────────────────── Support ───────────────────────── */
export const SUPPORT = {
  hero: { title: '*What can we* help you with?', body: 'Find guidance for your product, ask about an order or tell us what you need help with.', topics: ['Buying', 'Delivery', 'Installation', 'Product Care'] },
  products: {
    title: '*Choose your* product.',
    body: 'Select Crystal, Titan or Hyper to find the relevant guides, care instructions and service options.',
    items: [
      { slug: 'crystal', title: 'Crystal', body: 'Home water system · guides, care, service', image: '/images/crystal/card.webp' },
      { slug: 'titan', title: 'Titan', body: 'Business water system · guides, care, service', image: '/images/titan/force-111-front.webp' },
      { slug: 'hyper', title: 'Hyper', body: 'Hydrogen bottle · guides, care, service', image: '/images/hyper/card.webp' },
    ],
  },
  order: { title: '*Need help with* an order?', body: 'Use your order details to check the current status or contact us about delivery. If installation applies to your purchase, you’ll find the next steps with your order information.' },
  manuals: { title: '*Keep the right* information close.', body: 'Find your operating guide, check the care instructions and read the warranty terms for your model. If something isn’t working as expected, send us the details.' },
  contact: { title: '*Tell us what’s* happening.', body: 'A few details will help us direct your enquiry. Choose a topic, leave your contact information and describe what you need.', topics: ['Order or delivery', 'Installation', 'Product care', 'Service request', 'Warranty', 'Buying advice', 'Other'] },
  faq: {
    title: '*Quick answers before* you get in touch.',
    items: [
      { q: 'Can I order without creating an account?', a: 'Yes. Use guest checkout and keep your order confirmation.' },
      { q: 'How do I book a water test?', a: 'Visit Water Testing to check the available service and booking options.' },
      { q: 'Where can I check delivery?', a: 'Enter your postcode on the product page or at checkout.' },
      { q: 'Where is my product guide?', a: 'Choose your model above to see its manuals and care instructions.' },
    ] as Faq[],
  },
};

/* ───────────────────────── Policies ─────────────────────────
   Returns and Warranty are DVINE's own documents (public/docs/policies/*.pdf), set as web text; the PDFs are offered
   for download on the page. Privacy, Terms and Shipping are still drafts (see docs/legal-review.md). */

/** A paragraph, or a bulleted list when it is an array. */
export type PolicyBlock = string | string[];
export type PolicySection = { h: string; p: PolicyBlock[] };
export type PolicyDoc = { label: string; href: string };
/** A policy with different terms per product is split into parts, one per product. */
export type PolicyPart = { id: string; title: string; intro?: string; docs?: PolicyDoc[]; sections: PolicySection[] };
export type Policy = { title: string; intro?: string; sections?: PolicySection[]; parts?: PolicyPart[] };

/** DVINE's documents, served from public/docs. */
export const DOCS = {
  crystalManual: { label: 'Crystal 5114 user manual', href: '/docs/manuals/crystal-5114-user-manual.pdf' },
  hyperManual: { label: 'Hyper user guide', href: '/docs/manuals/hyper-hydrogen-bottle-manual.pdf' },
  crystalWarranty: { label: 'Warranty policy', href: '/docs/policies/crystal-warranty-policy-v2.pdf' },
  crystalReturns: { label: 'Return and refund policy', href: '/docs/policies/crystal-return-refund-policy.pdf' },
  crystalReplacement: { label: 'Replacement policy', href: '/docs/policies/crystal-replacement-policy.pdf' },
  hyperReturns: { label: 'Return and refund policy', href: '/docs/policies/hyper-return-refund-policy.pdf' },
  hyperReplacement: { label: 'Replacement terms', href: '/docs/policies/hyper-replacement-terms.pdf' },
} satisfies Record<string, PolicyDoc>;

export const POLICIES: Record<string, Policy> = {
  privacy: {
    title: 'Privacy policy',
    sections: [
      { h: 'What we collect', p: ['When you order, book a water test, request a demo or contact us, we collect your name, phone number, email address, delivery and billing addresses, and the details you share in the form.', 'Payments are processed by our payment partner. We do not store card numbers, CVV, UPI PINs or banking passwords; we keep only the payment references needed for reconciliation and refunds.'] },
      { h: 'How we use it', p: ['To process and deliver orders, arrange installation, provide warranty and service, respond to enquiries and send the order and service updates you ask for.', 'We send marketing messages only if you opt in, and you can opt out at any time.'] },
      { h: 'Sharing', p: ['We share the minimum necessary information with delivery, installation, payment and communication partners who help us serve you.'] },
      { h: 'Cookies', p: [
        'The site uses a few cookies it needs to work: one keeps the items in your cart, and others keep you signed in to your account. They are not used for advertising.',
        // only once analytics IDs are set (src/components/seo/Analytics.tsx)
        ...(process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID ? ['We also use Google Analytics and Meta to understand how visitors use the site and how our ads perform. These services set their own cookies. You can block them in your browser settings without affecting your orders.'] : []),
      ] },
      { h: 'Your choices', p: ['You can ask us to access, correct or delete your information by writing to reachout@dvineh2o.com.'] },
      { h: 'Who we are', p: ['DVINE H2O is a brand of DVINE United Private Limited, Office No. 5, 1st Floor, Block 1, Bhawani Mall, Saheed Nagar, Bhubaneswar, Odisha 751007.'] },
    ],
  },
  terms: {
    title: 'Terms of use and sale',
    sections: [
      { h: 'Orders', p: ['An order is confirmed when payment is received and you see an order confirmation. Prices include applicable GST unless stated otherwise.', 'TitanForce 111 is supplied on quotation following a site discussion.'] },
      { h: 'Product use', p: ['Use DVINE products as described in the supplied manual. Use only the drinking-water settings specified for drinking. Hyper is not a substitute for water treatment.'] },
      { h: 'Liability', p: ['Nothing in these terms limits rights you have under applicable consumer protection law.'] },
      { h: 'Seller', p: [['DVINE United Private Limited', 'GSTIN 21AAKCD6664L1ZC', 'Office No. 5, 1st Floor, Block 1, Bhawani Mall, Saheed Nagar, Bhubaneswar, Odisha 751007', 'Customer care: 1800 202 4504, customercare@dvineh2o.com']] },
    ],
  },
  'shipping-and-installation': {
    title: 'Shipping and installation',
    sections: [
      { h: 'Where we deliver', p: ['Delivery, installation and service are available throughout Odisha. Orders are dispatched from Bhawani Mall, Saheed Nagar, Bhubaneswar.'] },
      { h: 'Delivery', p: ['Enter your pincode on the product page or at checkout to see whether we deliver to you and the expected delivery time.', 'You will receive tracking details when your order ships.'] },
      { h: 'Installation', p: ['Crystal is installed by a DVINE-trained technician. After delivery, our team contacts you to schedule installation. Please make sure the water connection and power point are available.'] },
      // from the Crystal 5114 user manual (Installation guide, pp. 8–9)
      { h: 'What Crystal needs', p: [
        'Before the installation visit, please check that the place you have chosen has:',
        ['A flat, stable surface that can hold 10 kg or more, or a wall for the optional wall mount', 'A cold tap water line within reach, at an inlet pressure of 40–100 psi', 'An earthed 220–240 V, 50–60 Hz power socket nearby', 'A drain or sink within reach of the drain pipe', 'At least 10 cm of clear space on both sides and at the back, away from direct sunlight, heat, humidity and standing water'],
        'Crystal is made for standard tap water with a TDS of up to 350. Don’t connect it to seawater, industrial or chemically contaminated water. For borewell water, have the water tested and fit suitable pre-filtration first.',
      ] },
    ],
  },
  returns: {
    title: 'Returns, refunds and replacement',
    intro: 'Crystal and Hyper have different terms: Crystal is installed in your home, while Hyper is shipped to you ready to use. Choose your product below.',
    parts: [
      {
        id: 'crystal', title: 'Crystal home water system', intro: 'The DVINE Alkaline Water Ionizer, Crystal 5114.',
        // the 30-day return comes from the client's Nov 2026 update; their return PDF still says 48 hours, so only the
        // replacement PDF is offered until a new one arrives
        docs: [DOCS.crystalReplacement],
        sections: [
          { h: 'Cancelling an order', p: [[
            'Orders can be cancelled before dispatch at no charge.',
            'If an order is cancelled after dispatch but before installation, the actual shipping and handling charges are deducted.',
            'Once Crystal is installed, use a return instead.',
          ]] },
          { h: 'Returns within 30 days', p: [
            'You can return Crystal within 30 days of delivery. To return it:',
            ['Raise the request within 30 days of the delivery date', 'Keep all parts, accessories and the invoice, and the original packaging if you still have it', 'Make sure the warranty seal is intact and the product has not been damaged, misused or opened'],
            'Our team uninstalls and collects Crystal, and an authorised technician inspects it. Final approval depends on that inspection.',
          ] },
          { h: 'Replacement', p: [
            'Crystal is eligible for replacement only if:',
            ['The unit has a manufacturing defect', 'It was damaged during delivery, reported within 48 hours', 'It is not working because of an internal technical fault, verified by an authorised technician'],
            'Raise the replacement request within 7 days of delivery or installation. After 7 days, the issue is handled under the warranty instead.',
            'Replacement is processed after inspection by DVINE-authorised service personnel. If a manufacturing defect is confirmed, the defective part or unit is replaced free of charge with a new or equivalent one, within 7–10 working days of approval. The original packaging, invoice and all accessories must be returned. A replacement is not approved if the product seal, warranty seal or internal components have been tampered with.',
          ] },
          { h: 'Refunds', p: [
            'Refunds are made when:',
            ['The order was cancelled before dispatch', 'A return within 30 days of delivery was approved after inspection', 'A return was approved for a confirmed manufacturing defect and a replacement isn’t possible'],
            'Refunds are initiated within 7–14 working days of approval, to the original payment method. For EMI purchases, the refund follows the bank or finance partner’s policy.',
          ] },
          { h: 'Not eligible', p: [
            'Returns, refunds and replacement do not apply to:',
            ['Requests made more than 30 days after delivery', 'Damage from mishandling, or installation by an unauthorised person', 'Damage from voltage fluctuation', 'Water quality or water pressure beyond the recommended limits', 'Unauthorised repairs or tampering', 'Normal wear and tear of filters, which are consumables'],
          ] },
          { h: 'How to request a return', p: ['Call customer care on 1800 202 4504 or email customercare@dvineh2o.com with your order ID. Signed-in customers can also start a return from their account.'] },
          { h: 'Before you buy', p: ['Crystal is set up for your home. Please check whether your water suits it and what installation needs before you order. If you’re unsure about your water, book a water test first.'] },
        ],
      },
      {
        id: 'hyper', title: 'Hyper hydrogen water bottle',
        docs: [DOCS.hyperReturns, DOCS.hyperReplacement],
        sections: [
          { h: 'Cancelling an order', p: ['Hyper orders must be cancelled within 24 hours of being placed. After 24 hours, or once the order has shipped, it can’t be cancelled.'] },
          { h: 'Returns', p: [
            'You can request a return within 7 days of delivery if:',
            ['The product is unused and in its original condition', 'The product safety seal is intact', 'All original packaging, accessories, the charging cable and the manual are included', 'There is no physical damage, scratches, dents or water damage', 'You have the original invoice'],
            'A product that has been used, whose seal is broken, removed or tampered with, that has accidental or physical damage, or that comes back without its original packaging or parts can’t be returned.',
          ] },
          { h: 'Damaged or defective on arrival', p: [
            'If Hyper arrives damaged, defective or not working, tell us within 48 hours of delivery and send:',
            ['A complete unboxing video, without pauses or cuts', 'Clear photos of the product and packaging', 'Your order ID and a copy of the invoice', 'A description of the issue'],
            'Without this proof, the request may be declined. After verification we arrange a pickup (where available) and our technical team inspects the product. If approved, a replacement is dispatched within 5–7 working days, or the product is repaired under warranty. If no defect is found, the product is sent back to you.',
            'One replacement is allowed per order.',
          ] },
          { h: 'Refunds', p: [[
            'Refunds are processed only after the product passes inspection.',
            'Once approved, the refund is initiated within 5–7 working days, to the original payment method.',
            'Shipping charges, if any, are non-refundable.',
            'Cash on delivery orders are refunded by bank transfer or UPI.',
          ]] },
          { h: 'Not eligible', p: [
            'Returns and replacements aren’t accepted for:',
            ['Change of mind or personal preference', 'Minor variation in colour, design or shade', 'Improper handling or misuse', 'Damage from drops, voltage fluctuation, or immersion in water outside normal use', 'Battery damage from incorrect charging or a third-party charger', 'Normal wear and tear'],
          ] },
          { h: 'How to request a return', p: ['Call customer care on 1800 202 4504 or email customercare@dvineh2o.com with your order ID, contact details and the reason for the return. Signed-in customers can also start a return from their account.'] },
        ],
      },
      {
        id: 'titan', title: 'TitanForce 111',
        sections: [{ h: 'Returns and refunds', p: ['Titan is sold only on quotation. Its return and refund terms are being finalised; until they are published here, the terms for your unit are set out in your quotation.'] }],
      },
    ],
  },
  warranty: {
    title: 'Warranty',
    intro: 'Warranty terms differ by product. Your warranty starts on the purchase date and is listed in your account with the order.',
    parts: [
      {
        id: 'crystal', title: 'Crystal home water system', intro: 'The DVINE Water Ionizer, Crystal 5114.',
        docs: [DOCS.crystalWarranty, DOCS.crystalManual],
        sections: [
          { h: 'One-year comprehensive warranty', p: [
            'Crystal comes with a one-year comprehensive warranty from the date of purchase. It covers:',
            ['All electrical components', 'Internal functional parts', 'Manufacturing defects', 'Display and control panel issues', 'The pump and internal fittings'],
            'During this period, any defect arising from a manufacturing fault is repaired or the part replaced free of charge.',
          ] },
          { h: 'Electrolysis chamber: 5 years', p: ['The electrolysis chamber is covered for 5 years from the date of purchase, for up to 1,000 litres of use. This covers manufacturing defects and performance issues under normal household use.'] },
          { h: 'Service', p: [[
            'Service assistance is provided within 48 hours of a complaint being registered.',
            'Service is available across Odisha.',
            'Register a complaint on 1800 202 4504, through an authorised service representative, from your account or on the Support page.',
          ]] },
          { h: 'Conditions', p: [
            'The warranty applies when:',
            ['The product is used under normal domestic conditions', 'It was installed by an authorised technician', 'The purchase invoice is shown at the time of service', 'Recommended maintenance and filter replacements have been followed'],
          ] },
          { h: 'Warranty seal', p: [[
            'Crystal is secured with an authorised warranty seal sticker. If the seal is broken, tampered with, removed or damaged, the warranty is void immediately.',
            'A broken seal is treated as unauthorised internal repair or tampering, and service is then chargeable.',
            'Only DVINE-authorised service technicians may open or service the machine’s internal components.',
          ]] },
          { h: 'What is not covered', p: [[
            'Physical damage, mishandling or accidental breakage',
            'Damage from improper installation or voltage fluctuation',
            'Unauthorised repairs or tampering',
            'Damage from water quality beyond the recommended limits',
            'Consumables such as filters, unless stated separately',
          ]] },
          { h: 'Limitation of liability', p: ['DVINE’s responsibility is limited to repairing or replacing defective parts. Claims for indirect or consequential damage are not accepted.'] },
        ],
      },
      {
        id: 'hyper', title: 'Hyper hydrogen water bottle',
        docs: [DOCS.hyperManual, DOCS.hyperReplacement],
        sections: [
          { h: 'One-year warranty', p: [
            'Hyper comes with a one-year warranty from the date of purchase. It covers:',
            ['Free repair or replacement for manufacturing defects under normal use', 'Functional issues during the warranty period'],
            'After the warranty ends, service is available at nominal charges.',
            'If Hyper arrives damaged, defective or not working, tell us within 48 hours of delivery; after verification it is replaced or repaired under warranty, as set out in the returns and replacement terms.',
          ] },
          { h: 'What is not covered', p: [[
            'Damage caused by misuse or accidents',
            'Unauthorised repair or disassembly',
            'Wear and tear of parts such as seals and gaskets',
            'A missing proof of purchase or warranty card',
            'Using unapproved liquids. Fill Hyper only with clean drinking water such as filtered, distilled or purified water, never carbonated drinks, soda or heavy mineral water.',
            'Battery damage from incorrect charging or a third-party charger. Charge only with the cable supplied.',
            'Damage from drops, or immersing the generator base in water.',
          ]] },
        ],
      },
      {
        id: 'titan', title: 'TitanForce 111',
        sections: [{ h: 'Coverage', p: ['Titan is sold only on quotation, after a site discussion. Its warranty policy and user manual are being finalised; until they are published here, the warranty and service terms for your unit are set out in your quotation.'] }],
      },
    ],
  },
};

/** Every section of a policy, across its parts, for search. */
export const policySections = (p: Policy) => [...(p.sections ?? []), ...(p.parts ?? []).flatMap(x => x.sections)];

/* ───────────────────────── Site search index ───────────────────────── */
export function searchIndex() {
  const pages = [
    { href: '/home-water-systems', title: 'Crystal home water system', body: `${CRYSTAL.hero.body} ${CRYSTAL.features.cards.map(c => c.title + ' ' + c.body).join(' ')}` },
    { href: '/hydrogen-bottles', title: 'Hyper hydrogen water bottle', body: `${HYPER.hero.body} ${HYPER.tech.body}` },
    { href: '/for-business', title: 'TitanForce 111 for business', body: `${BUSINESS.hero.body} ${BUSINESS.titan.body}` },
    { href: '/water-testing', title: 'Water testing', body: `${WATER_TESTING.hero.body} ${WATER_TESTING.scope.body}` },
    { href: '/support', title: 'Support', body: `${SUPPORT.hero.body} ${SUPPORT.order.body} ${SUPPORT.manuals.body}` },
    { href: '/track', title: 'Track my order', body: 'Order status delivery tracking shipment AWB' },
    { href: '/book-demo', title: 'Book a demo', body: 'Book a Crystal or Titan demonstration at home or on a video call.' },
    ...Object.entries(POLICIES).map(([k, v]) => ({ href: `/policies/${k}`, title: v.title, body: policySections(v).map(s => s.h + ' ' + s.p.flat().join(' ')).join(' ') })),
  ];
  const faqs = [
    ...CRYSTAL.faq.groups.flatMap(g => g.items).map(f => ({ ...f, href: '/home-water-systems#faq' })),
    ...HYPER.faq.groups.flatMap(g => g.items).map(f => ({ ...f, href: '/hydrogen-bottles#faq' })),
    ...BUSINESS.faq.items.map(f => ({ ...f, href: '/for-business#faq' })),
    ...WATER_TESTING.faq.items.map(f => ({ ...f, href: '/water-testing#faq' })),
    ...SUPPORT.faq.items.map(f => ({ ...f, href: '/support#faq' })),
  ].map(f => ({ href: f.href, title: f.q, body: f.a }));
  return [...pages, ...faqs];
}
