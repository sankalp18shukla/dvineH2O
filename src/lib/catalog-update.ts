/**
 * The catalogue changes from the website update brief (Nov 2026) that live in the database rather than in code:
 * new prices, the spec tables, the two water tests and the first blog articles.
 *
 * Nothing here touches the live site by itself:
 *  - `npm run catalog:update` writes it to the database (run it when the code that goes with it is deployed);
 *  - PREVIEW_CATALOG_UPDATE=1 in .env.local lays it over the database on a local dev server only, so the new
 *    prices and tables can be checked before anything is pushed. Production builds ignore the flag.
 * Once it has been written to the database this file can stay: the values then match and the preview is a no-op.
 */
import type { Post } from './blog';
import { ODISHA_PINCODES, deliveryDaysFor } from './odisha-pincodes';

const P = (rupees: number) => rupees * 100;

type Spec = { label: string; value: string };
export type ProductUpdate = { mrp?: number; price?: number; specs?: Spec[]; boxContents?: string[] };

export const PRODUCT_UPDATES: Record<string, ProductUpdate> = {
  crystal: {
    mrp: P(225000), price: P(175000),
    specs: [
      { label: 'Model', value: 'DC-5114' },
      { label: 'Ionisation plates', value: '5, titanium 99.99% pure, 0.5 mm, platinum coating about 5 µm' },
      { label: 'Drive voltage', value: '24 V' },
      { label: 'Rated power', value: '200 W (ionisation)' },
      { label: 'Drinking presets', value: 'pH 8.5 and pH 9.5' },
      { label: 'Adjustable pH range', value: '4.5 to 9.5' },
      { label: 'Water modes', value: 'Hot, Ambient, Alkaline, High alkaline' },
      { label: 'Flow rate', value: '1.5 to 2 L per minute' },
      { label: 'Storage', value: '6 L purified water' },
      { label: 'Filtration', value: 'Sediment, activated carbon, nano filter, built-in UV (UV has no part to replace)' },
      { label: 'Inlet pressure', value: '40 to 100 psi' },
      { label: 'Source water', value: 'Municipal tap water, TDS up to 350 mg/L, 5 to 40 °C' },
      { label: 'Filter replacement', value: 'Every 6 to 8 months, depending on usage' },
      { label: 'Interface', value: 'SmartFlow Interface: intelligent display with temperature, pH mode, filter status and fault alerts' },
      { label: 'Installation', value: 'By a DVINE-trained technician' },
      { label: 'Certifications', value: 'CE, ISO 9001:2015, GMP, RoHS, BIS IS 14724:1999' },
      { label: 'Warranty', value: '1 year comprehensive on the machine; electrolysis chamber 5 years (up to 1,000 litres)' },
    ],
  },
  hyper: {
    mrp: P(18999), price: P(15999),
    specs: [
      { label: 'Model', value: 'DVH-HYP-01' },
      { label: 'Technology', value: 'H2 Precision Infusion™, PEM electrolysis' },
      { label: 'Hydrogen modes', value: '4 ppm or 8 ppm' },
      { label: 'Cycle time', value: '5 or 10 minutes, depending on the mode' },
      { label: 'Electrodes and membrane', value: 'Platinum-titanium anode and cathode, SPE/PEM membrane' },
      { label: 'Chamber and cup', value: 'Borosilicate glass, anodised aluminium' },
      { label: 'Housing', value: 'BPA-free Tritan, leak-proof' },
      { label: 'Controls', value: 'One-touch digital panel, smart timer, auto shut-off, LED' },
      { label: 'Capacity', value: '280 ml' },
      { label: 'Battery and charging', value: '2000 mAh (3.7 V, 7.4 Wh), USB-C' },
      { label: 'Charging time', value: 'About 75 minutes to full' },
      { label: 'Cycles per charge', value: 'About 45' },
      { label: 'Hydrogen test method', value: 'H2 reagent test' },
      { label: 'Warranty', value: '1 year' },
    ],
    boxContents: ['Hyper bottle (unassembled)', 'USB-C charging cable', 'User guide'],
  },
  titan: {
    specs: [
      { label: 'Model', value: 'TitanForce 111' },
      { label: 'Ionisation', value: 'HydroCore 11-plate: solid 99.99% titanium, platinum coating 0.5 micron' },
      { label: 'Output', value: '120 litres per hour, continuous' },
      { label: 'Net flow rate', value: '2.5 to 3 L per minute' },
      { label: 'Water options', value: 'Hot (up to 100 °C), cold (down to 15 °C), ambient, alkaline (pH 8.5), high alkaline (pH 9.5)' },
      { label: 'pH range', value: '4.5 to 9.5' },
      { label: 'Display', value: 'SmartFlow Multi-Mode Display™, touch controls' },
      { label: 'Filtration', value: 'Sediment, carbon and nano filters, then UV treatment, before ionisation' },
      { label: 'Storage', value: '7 litres' },
      { label: 'Cleaning', value: 'Automatic, by a 3-way solenoid valve' },
      { label: 'Source water', value: 'Tap water' },
      { label: 'Inlet pressure', value: '100 to 150 psi' },
      { label: 'Power supply', value: '220–240 V, 50–60 Hz' },
      { label: 'Dimensions', value: '123 × 34 × 34 cm (boxed 128 × 37 × 37 cm)' },
      { label: 'Weight', value: '22 kg' },
      { label: 'Build', value: 'Semi-commercial, floor-standing' },
      { label: 'Colour', value: 'Midnight' },
      { label: 'Warranty', value: 'Set out in your quotation' },
      { label: 'Made by', value: 'DVINE United Private Limited' },
    ],
  },
};

/** The two water tests. Matched to the database rows by name; the Standard lab test is switched off, not deleted. */
export const TEST_UPDATES: { name: string; active: boolean; summary?: string; parameters?: string[]; collectionMethod?: string; turnaround?: string; price?: number }[] = [
  { name: 'Essential drinking water test', active: true, summary: 'A quick on-site check of four basics.', parameters: ['pH', 'TDS', 'Hardness', 'Chlorine'],
    collectionMethod: 'A DVINE technician tests on site', turnaround: 'Same visit', price: 0 },
  { name: 'Standard lab test', active: false },
  { name: 'Comprehensive lab test', active: true, summary: 'Everything in Essential and in the old Standard test: 17 parameters, including bacteria and metals.',
    parameters: ['pH', 'TDS', 'Total hardness', 'Alkalinity', 'Chloride', 'Iron', 'Nitrate', 'Fluoride', 'Turbidity', 'Chlorine', 'Total coliform', 'E. coli', 'Arsenic', 'Lead', 'Mercury', 'Sulphate', 'Manganese'],
    collectionMethod: 'Sample collected at home in a sterile kit, tested in a lab', turnaround: '7 to 9 working days', price: P(999) },
];

/** Homepage blog tiles, in order (feature_order 1–3). Existing posts can take a slot too. */
export const FEATURED_SLUGS = ['what-ph-8-5-means', 'how-to-test-your-water', 'how-to-choose-a-water-ionizer'];

type NewPost = Pick<Post, 'slug' | 'title' | 'excerpt' | 'category' | 'product' | 'coverImage' | 'coverAlt' | 'body'> & { published: string };

/** The first articles, written from the FAQ answers in the brief. "Hydrogen water and what the research shows" is
 *  already on the blog (hydrogen-water-what-early-research-says), so it is not repeated. */
export const NEW_POSTS: NewPost[] = [
  {
    slug: 'what-ph-8-5-means', category: 'guide', product: 'crystal', published: '2026-11-24',
    title: 'What pH 8.5 means',
    excerpt: 'pH is a 0 to 14 scale, and 7 is neutral. Here is what Crystal’s two drinking presets are, and when to use each.',
    coverImage: '/images/blog/calm-ripples.webp', coverAlt: 'Calm water rippling under soft light',
    body: `pH tells you how acidic or alkaline water is. The scale runs from 0 to 14, and 7 is neutral. Below 7 is acidic; above 7 is alkaline. So "alkaline water" simply means water with a pH above 7.

## Crystal’s two drinking presets

Crystal has two drinking presets:

- **pH 8.5**, for everyday drinking.
- **pH 9.5**, for occasional use, not for everyday drinking. Read the manual before you use it.

Start with pH 8.5. If you have a health condition, ask your doctor before you change what you drink.

## How Crystal gets there

Crystal does not add a powder or a mineral cartridge. It filters your water first, then runs it past five platinum-coated titanium plates at 24 V. At the negative plates the pH rises, and at the positive plates it falls. The alkaline stream goes to your glass and the acidic stream goes to the drain. You choose the pH.

## How long it stays at 8.5

pH drifts back once water stands. In our test, high-alkaline water in a sealed glass bottle at about 24 to 25 °C went from pH 9.35 to 8.75 over 48 hours. Drink it fresh, and if you store it, use glass or stainless steel filled to the top and sealed.

## Who should use ambient water instead

Alkaline water is not recommended for infants. Use Crystal’s ambient setting for infants and for taking medicines. If you are pregnant or breastfeeding, or have a kidney or liver condition, speak to a qualified healthcare professional first.

> We do not claim that alkaline water treats or prevents any condition. People choose it for taste and for an easy daily habit.

[See how Crystal works](/home-water-systems#technology)`,
  },
  {
    slug: 'tds-what-your-number-says', category: 'guide', product: null, published: '2026-11-23',
    title: 'TDS, and what your number says',
    excerpt: 'Total dissolved solids is the minerals and salts in your water, in mg/L. What the number shapes, and what it does not tell you.',
    coverImage: '/images/blog/glass-window-light.webp', coverAlt: 'A glass of water on a table in window light',
    body: `TDS stands for total dissolved solids: the minerals and salts dissolved in your water, measured in milligrams per litre (mg/L). In water, mg/L is the same as parts per million (ppm).

## What TDS shapes

TDS mostly shapes taste. Very low TDS can taste flat; high TDS can taste salty, bitter or heavy. It is a useful first number, but it is not a safety reading on its own.

## The Indian standard

IS 10500, India’s drinking-water standard from BIS, gives an acceptable limit of 500 mg/L for TDS and a permissible limit of 2,000 mg/L where no other source is available.

## What TDS does not tell you

A TDS meter cannot see bacteria, and it does not tell you which minerals are present. Water can have a normal TDS and still contain E. coli, iron or arsenic. For that you need a lab test.

## What it means for Crystal

Crystal is designed for municipal tap water up to 350 mg/L TDS. Above that, you are outside the range it is built for: test your water and add suitable pre-filtration first. Very low-TDS water, such as the output of an RO purifier, may not ionise well, because electrolysis needs dissolved minerals to carry current.

Crystal is not a desalination system. In one of our tests TDS fell from 310 to 185 mg/L; in another it rose slightly after ionisation (103 to 124 mg/L at pH 8.5). Each is one sample, and your water will differ.

[Book a water test](/water-testing#book)`,
  },
  {
    slug: 'how-to-test-your-water', category: 'guide', product: null, published: '2026-11-22',
    title: 'How to test your water',
    excerpt: 'Two tests, and how to choose: a free on-site check of four basics, or a 17-parameter lab test that includes bacteria and metals.',
    coverImage: '/images/blog/clear-stream.webp', coverAlt: 'Clear water running over stones in a stream',
    body: `You do not need to buy anything to have your water tested. DVINE offers two tests.

## The Essential test

A DVINE technician tests on site and you get the result in the same visit. It checks four basics: pH, TDS, hardness and chlorine.

## The Comprehensive lab test

We collect a sample at home in a sterile kit and test it in a lab. It covers 17 parameters: pH, TDS, total hardness, alkalinity, chloride, iron, nitrate, fluoride, turbidity, chlorine, total coliform, E. coli, arsenic, lead, mercury, sulphate and manganese.

## Which one you need

Choose the Comprehensive test for borewell or tanker water, a new home, any change in taste, smell or colour, and before you choose a water system. The Essential test is a quick check of the basics.

You can also test water that has already been through an RO or filter. When you book, tell us whether the sample is your source supply or water from a system, so we confirm the right test.

## Reading the report

Every result has a parameter, a unit, a measured value and a reference range. We compare results with IS 10500, India’s drinking-water standard, which gives an acceptable and a permissible limit for each parameter.

> No single test tells you water is safe to drink. A report describes one sample on one day. If it finds E. coli or total coliform, do not drink that water untreated, and call us.

[Book a water test](/water-testing#book) · [Upload an older report](/water-testing#upload)`,
  },
  {
    slug: 'borewell-versus-municipal-supply', category: 'guide', product: null, published: '2026-11-21',
    title: 'Borewell versus municipal supply',
    excerpt: 'Municipal water is treated before it reaches you; borewell water is whatever the ground holds. What that means for testing and for a water system.',
    coverImage: '/images/blog/forest-stream.webp', coverAlt: 'A stream and waterfall in a mossy forest',
    body: `Where your water comes from decides what to test for and which system suits it.

## Municipal supply

Municipal water is treated before it reaches your tap, usually with chlorine to keep it microbiologically clean on the way. Chlorine can leave a taste and smell. Old pipes and fittings can add sediment, rust or, in some buildings, lead.

## Borewell water

Borewell water comes from the ground, untreated. It often carries more dissolved minerals: hardness that leaves scale on kettles and taps, iron that gives a reddish colour and a metallic taste, and in some regions fluoride, nitrate or arsenic. It can change with the season.

## Tanker and stored water

Tanker water and water stored in overhead tanks can pick up bacteria and sediment along the way. Test it the same way you would test borewell water.

## What this means for Crystal

Crystal is designed for municipal tap water at 40 to 100 psi, up to 350 mg/L TDS and 5 to 40 °C. If your supply is borewell, tanker or stored water, book a water test first and add suitable pre-filtration if it needs it.

In our tests on iron-rich groundwater, total iron fell from 2.40 to 0.05 mg/L. On hard groundwater, total hardness fell from 450 to 210 mg/L, which is still above the IS 10500 acceptable limit of 200. Each is one sample, and your water will differ. We would rather check your water with you than guess.

[Book a water test](/water-testing#book)`,
  },
  {
    slug: 'how-to-choose-a-water-ionizer', category: 'guide', product: 'crystal', published: '2026-11-20',
    title: 'How to choose a water ionizer',
    excerpt: 'Seven questions to ask before you buy: source water, filtration, plates, pH presets, the display, filters and service.',
    coverImage: '/images/blog/water-drop.webp', coverAlt: 'A drop of water falling into rippling blue water',
    body: `A water ionizer is a purchase you live with for years. These are the questions worth asking of any of them, Crystal included.

## 1. Does it suit my water?

Ask for the source-water limits: pressure, TDS and temperature. Crystal is designed for municipal tap water at 40 to 100 psi, up to 350 mg/L TDS and 5 to 40 °C. If you are not sure what your water holds, test it first.

## 2. What happens before ionisation?

Ionisation does not clean water. Look for filtration first. Crystal’s PureCore Filtration™ runs four stages in order: sediment, activated carbon, a nano filter and UV, so each one protects the next.

## 3. How does it change pH?

Some purifiers raise pH by adding minerals from a cartridge. An ionizer changes pH by electrolysis. Ask how many plates it has, what they are made of and what voltage drives them. Crystal uses five plates of 99.99% pure titanium with a platinum coating, at 24 V.

## 4. Which pH settings will I actually use?

Look for clear drinking presets rather than a dial of numbers. Crystal has pH 8.5 for everyday drinking and pH 9.5 for occasional use, plus hot and ambient water.

## 5. Will it tell me what it is doing?

A good display shows the temperature, the mode you chose, filter life and any fault. Crystal’s SmartFlow Interface does all four.

## 6. What does upkeep cost?

Ask how often filters are replaced and what they cost. Crystal’s sediment, carbon and nano filters are replaced together every 6 to 8 months, depending on use.

## 7. Who installs and services it?

Ask who installs it, what the warranty covers and where service is available. Read the warranty terms before you buy.

> Be wary of any ionizer sold on promises to treat or cure a condition. That is not what these machines do.

[See Crystal](/home-water-systems) · [Book a demo](/book-demo?product=crystal)`,
  },
];

/** Local preview only: never on a production build, so a stray flag on Vercel can't change the live store. */
export const previewUpdate = () => process.env.NODE_ENV !== 'production' && process.env.PREVIEW_CATALOG_UPDATE === '1';

/* ───────────── Client update, 27 Nov 2026 ───────────── */

/** Every Odisha pincode on the client's installation list, as a pincodes row: delivery, installation, service and
 *  home water testing throughout Odisha. Rows outside Odisha were placeholder metro samples and are switched off. */
export const odishaPincodeRow = (pincode: string, district: string) =>
  ({ pincode, city: district, state: 'Odisha', serviceable: true, installation: true, waterTesting: true, deliveryDays: deliveryDaysFor(district) });
export const PINCODE_ROWS = ODISHA_PINCODES.map(([p, d]) => odishaPincodeRow(p, d));

/** Product fields beyond the brief: Crystal's machine warranty is 12 months (the chamber's 5 years is in the copy),
 *  the manuals already in public/docs, and Titan's gallery with the client's TitanForce 111 studio renders. */
export const PRODUCT_FIELDS: Record<string, { warrantyMonths?: number; manualUrl?: string; images?: string[] }> = {
  crystal: { warrantyMonths: 12, manualUrl: '/docs/manuals/crystal-5114-user-manual.pdf' },
  hyper: { warrantyMonths: 12, manualUrl: '/docs/manuals/hyper-hydrogen-bottle-manual.pdf' },
  titan: { images: ['/images/titan/force-111-front.webp', '/images/titan/force-111-angle-right.webp', '/images/titan/force-111-side.webp'] },
};

/** Published articles that still carried the old Titan "five years of DVINE Assured Care" and pan-India service lines
 *  (blog-seed.ts has been corrected). Exact-text replacements, so a post the team has rewritten is left alone. */
/** New blog covers (28 Nov 2026): free-licence water photos from Pexels (no text), in public/images/blog. A post's cover
 *  changes only while it still has the old one, so a cover chosen in Admin › Blog is never overwritten. */
export const COVER_UPDATES: { slug: string; from: string; to: string; alt: string }[] = [
  { slug: 'what-ph-8-5-means', from: '/images/drop.webp', to: '/images/blog/calm-ripples.webp', alt: 'Calm water rippling under soft light' },
  { slug: 'tds-what-your-number-says', from: '/images/ripple.webp', to: '/images/blog/glass-window-light.webp', alt: 'A glass of water on a table in window light' },
  { slug: 'how-to-test-your-water', from: '/images/hands-water.webp', to: '/images/blog/clear-stream.webp', alt: 'Clear water running over stones in a stream' },
  { slug: 'borewell-versus-municipal-supply', from: '/images/4_2ndsec.png', to: '/images/blog/forest-stream.webp', alt: 'A stream and waterfall in a mossy forest' },
  { slug: 'how-to-choose-a-water-ionizer', from: '/images/crystal/kitchen-setup.webp', to: '/images/blog/water-drop.webp', alt: 'A drop of water falling into rippling blue water' },
  { slug: 'what-ionisation-changes-in-your-water', from: '/images/water-rings.webp', to: '/images/blog/ripple-rings.webp', alt: 'Rings spreading across teal water' },
  { slug: 'hydrogen-water-what-early-research-says', from: '/images/rising-bubbles.webp', to: '/images/blog/rising-bubbles-light.webp', alt: 'Bubbles rising through sunlit water' },
];

export const POST_FIXES: { slug?: string; from: string; to: string }[] = [
  { from: '| Warranty | Five years of DVINE Assured Care |', to: '| Warranty | One year on the machine, five years on the electrolysis chamber |' },
  { from: '| Service | A certified service network across India |', to: '| Service | Certified DVINE engineers, throughout Odisha |' },
  { from: 'the warranty (five years of DVINE Assured Care) and the service arrangement', to: 'the warranty and the service arrangement' },
];
