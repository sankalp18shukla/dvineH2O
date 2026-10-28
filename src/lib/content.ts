/**
 * Website copy, taken from "DVINE H2O Website — Page-wise content in wireframe format" (21 Sep 2026)
 * and product facts from the DVINE H2O master catalog. Prices, stock and specs that the team edits
 * live in the database (Admin › Products); this file holds the page copy.
 */

export type Faq = { q: string; a: string };

export const SITE = {
  name: 'DVINE H2O',
  tagline: 'The future of hydration',
  phone: '1800 202 4504',
  email: 'care@dvineh2o.com',
  description: 'DVINE H2O makes functional hydration systems: Crystal for the home, Hyper hydrogen water bottle for the day, and Titan 111 for shared spaces.',
};

export const NAV = {
  main: [
    { href: '/home-water-systems', label: 'Home Water Systems' },
    { href: '/hydrogen-bottles', label: 'Hydrogen Bottles' },
    { href: '/water-testing', label: 'Water Testing' },
  ],
  utility: [
    { href: '/for-business', label: 'For Business' },
    { href: '/support', label: 'Support' },
    { href: '/support#contact', label: 'Contact Us' },
  ],
};

export const FOOTER = [
  { title: 'Shop', links: [{ href: '/home-water-systems', label: 'Crystal' }, { href: '/hydrogen-bottles', label: 'Hyper' }, { href: '/for-business', label: 'Titan 111' }, { href: '/for-business#bulk', label: 'Bulk and gifting' }] },
  { title: 'Learn', links: [{ href: '/#about', label: 'Meet DVINE' }, { href: '/hydrogen-bottles#how-it-works', label: 'How Hyper works' }, { href: '/water-testing#book', label: 'Book a water test' }, { href: '/water-testing#upload', label: 'Upload a report' }] },
  { title: 'Help', links: [{ href: '/track', label: 'Track my order' }, { href: '/support#manuals', label: 'Manuals and warranty' }, { href: '/support#contact', label: 'Service request' }, { href: '/book-demo', label: 'Book a demo' }] },
  { title: 'Contact', links: [{ href: 'tel:18002024504', label: '1800 202 4504' }, { href: 'mailto:care@dvineh2o.com', label: 'care@dvineh2o.com' }, { href: '/support#contact', label: 'Send an enquiry' }, { href: '/for-business#enquiry', label: 'Request a quote' }] },
];

// TODO: replace '#' with DVINE's profile URLs once the team shares them
export const SOCIAL = [
  { key: 'instagram', label: 'Instagram', href: '#' },
  { key: 'linkedin', label: 'LinkedIn', href: '#' },
  { key: 'youtube', label: 'YouTube', href: '#' },
] as const;

export const POLICY_LINKS = [
  { href: '/policies/privacy', label: 'Privacy' },
  { href: '/policies/terms', label: 'Terms' },
  { href: '/policies/shipping-and-installation', label: 'Shipping and Installation' },
  { href: '/policies/returns', label: 'Returns' },
  { href: '/policies/warranty', label: 'Warranty' },
];

/* ───────────────────────── Hero slides (home) ───────────────────────── */
export const HERO_SLIDES = [
  {
    key: 'hyper', model: '/models/bottle.glb', accent: '#FF2E9C',
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
    key: 'crystal', model: '/models/crystal.glb', accent: '#25FFE8',
    name: 'Crystal', desc: ['Home', 'Water', 'System'],
    lede: 'A home water system with five platinum-coated titanium plates, PureCore multi-stage filtration and four water modes.',
    ctas: [{ href: '/home-water-systems', label: 'Shop Crystal', primary: true }, { href: '/book-demo?product=crystal', label: 'Book a Demo' }],
    feats: [
      { icon: 'plates5', title: 'Five-plate ionisation', sub: 'Platinum-coated titanium' },
      { icon: 'modes', title: 'Four water modes', sub: 'Hot, Neutral, Alkaline, High-Alkaline' },
      { icon: 'screen', title: 'Touchscreen controls', sub: 'pH, ORP and filter status' },
    ],
  },
  {
    key: 'titan', model: '/models/titan.glb', accent: '#F0FF00',
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
    // `cutout` is the transparent product PNG; until it is in public/, the section falls back to `image`
    cards: [
      { slug: 'crystal', href: '/home-water-systems', title: 'Crystal', where: 'At home', desc: 'Home Water System', body: 'A water system for your home. Explore filtration, ionisation and four water modes.', cta: 'Shop Crystal', cutout: '/images/crystal_product.png', image: '/images/crystal.webp' },
      { slug: 'hyper', href: '/hydrogen-bottles', title: 'Hyper', where: 'On the go', desc: 'Hydrogen Water Bottle', body: 'A hydrogen water bottle you can take along. Explore its operation and care.', cta: 'Shop Hyper', cutout: '/images/hyper_product.png', image: '/images/hyper.webp' },
      { slug: 'titan', href: '/for-business', title: 'Titan', where: 'For larger spaces', desc: 'Semi-commercial Water System', body: 'A water system for larger spaces. Discuss capacity for your workplace or property.', cta: 'Explore Titan', cutout: '/images/titan_product.png', image: '/images/titan.webp' },
    ],
  },
  technology: {
    title: '*See what happens* inside.',
    body: 'Crystal filters incoming water before the ionisation stage. Five platinum-coated titanium plates carry out electrolysis, while the touchscreen brings the operating information into view.',
    // one step per part of the inside video; `fact`/`note` is the figure set opposite the copy on wide screens
    labels: [
      { title: 'Filtration', body: 'Incoming water passes through PureCore multi-stage filtration first. Sediment and impurities stay behind in the cartridges.', fact: 'PureCore', note: 'multi-stage filtration' },
      { title: 'Ionisation', body: 'In the ionisation chamber, five platinum-coated titanium plates carry out electrolysis on the filtered water.', fact: '5 plates', note: 'platinum-coated titanium' },
      { title: 'Touchscreen', body: 'Choose hot, ambient or alkaline water with a tap. pH, ORP and filter status are shown at the machine.', fact: 'pH · ORP', note: 'and filter status on screen' },
    ],
  },
  helpChoosing: {
    title: '*A few details can* help you choose.',
    body: 'Looking for a system for your kitchen, a bottle to take along, or water for a shared space? Start with where you’ll use it.',
    // `image` is the section photo; until it is in public/, the card falls back to `fallback`
    // each option opens its product; `tone` is the product colour from the collection (Crystal glacier, Hyper flash, Titan volt)
    options: [
      { title: 'At Home', product: 'Crystal', desc: 'Home Water System', tone: 'glacier', href: '/home-water-systems', image: '/images/crystal_sec.png', fallback: '/images/crystal.webp' },
      { title: 'On the Go', product: 'Hyper', desc: 'Hydrogen Water Bottle', tone: 'flash', href: '/hydrogen-bottles', image: '/images/hyper_sec.png', fallback: '/images/lifestyle-locker.webp' },
      { title: 'For My Business', product: 'Titan', desc: 'Semi-commercial Water System', tone: 'volt', href: '/for-business', image: '/images/titan_sec.png', fallback: '/images/titan.webp' },
    ],
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

/* ───────────────────────── Crystal ───────────────────────── */
export const CRYSTAL = {
  hero: {
    title: 'Crystal. Made for your kitchen.',
    body: 'A home water system with five platinum-coated titanium plates, PureCore multi-stage filtration and four water modes. Explore the controls, check your installation requirements and choose when you’re ready.',
    gallery: ['/images/crystal.webp', '/images/crystal-inside.webp', '/images/collection.webp', '/images/ripple.webp'],
  },
  features: {
    title: 'The details that make *Crystal work.*',
    cards: [
      { icon: 'plates5', title: 'Five-plate ionisation', body: 'Platinum-coated titanium plates carry out electrolysis.' },
      { icon: 'filter', title: 'Multi-stage filtration', body: 'PureCore prepares incoming water before ionisation.' },
      { icon: 'modes', title: 'Four water modes', body: 'Choose from Hot, Neutral, Alkaline and High-Alkaline settings.' },
      { icon: 'screen', title: 'Touchscreen controls', body: 'View pH, ORP and filter status at the machine.' },
    ],
  },
  modes: {
    title: 'Choose a mode. *Understand its use.*',
    items: [
      { key: 'hot', title: 'Hot', body: 'Explore the hot-water option.', color: '#FF0401' },
      { key: 'neutral', title: 'Neutral', body: 'View the neutral-water setting.', color: '#F0F2F7' },
      { key: 'alkaline', title: 'Alkaline', body: 'Explore the alkaline-water setting.', color: '#25FFE8' },
      { key: 'high', title: 'High-Alkaline', body: 'An output for designated applications.', color: '#5B00FF' },
    ],
    note: 'Use only the drinking-water settings specified in the product manual.',
  },
  demo: {
    title: 'Take a closer look *at Crystal.*',
    body: 'See how to select a mode, read the display and use the controls. The demonstration walks you through the machine before your first use.',
  },
  fit: {
    title: 'Check the fit. *Know what comes with it.*',
    body: 'Before you order, check the dimensions, water connections and available space. You can also share a photo of your kitchen and ask our team about the setup.',
    needs: [
      { icon: 'home', title: 'Counter space', body: 'A level counter beside your sink, with room above for the dispenser.' },
      { icon: 'drop', title: 'Water inlet', body: 'A cold-water connection the technician can tap into.' },
      { icon: 'battery', title: 'Power point', body: 'A grounded socket within reach of the unit.' },
      { icon: 'wrench', title: 'Drain line', body: 'A drain or sink outlet for the waste-water line.' },
    ],
    setup: { title: 'Check *my setup.*', body: 'Tell us about your kitchen and attach a photo of the counter and water connection. Our team will check the setup with you before you order.' },
  },
  delivery: {
    title: 'Know what to expect *after you order.*',
    body: 'Check delivery availability for your postcode, review the installation arrangements and see the maintenance guidance for Crystal. Your warranty details are available here whenever you need them.',
    items: [
      { q: 'Delivery', a: 'Enter your pincode in the purchase panel to see whether we deliver to you and the expected date. We confirm the delivery date when you order and share tracking once it ships.' },
      { q: 'Installation', a: 'After delivery, our team contacts you to schedule installation. A DVINE-trained technician installs Crystal, connects the water line and walks you through the controls. Please keep the water connection and power point ready.' },
      { q: 'Care and maintenance', a: 'The touchscreen shows filter status. Follow the replacement guidance in the manual; usage and source-water conditions affect how often filters need replacing.' },
      { q: 'Warranty', a: 'Crystal carries a five-year DVINE Assured Care warranty. It starts on the purchase date and is listed in your account with your order.' },
    ] as Faq[],
  },
  faq: {
    title: 'Still deciding? *Let’s clear a few things up.*',
    items: [
      { q: 'Will Crystal work with my water supply?', a: 'Suitability depends on your source water and setup. Share those details with our team.' },
      { q: 'When do filters need replacing?', a: 'Follow the model guidance; usage and water conditions affect replacement needs.' },
      { q: 'Are all modes for drinking?', a: 'Use only the drinking-water settings specified in the manual.' },
    ] as Faq[],
  },
};

/* ───────────────────────── Hyper ───────────────────────── */
export const HYPER = {
  hero: {
    title: 'Meet Hyper. A hydrogen water bottle to take along.',
    body: 'Hyper uses PEM electrolysis to generate dissolved molecular hydrogen in suitable drinking water. See the bottle, explore the controls and find out how to use it.',
    gallery: ['/images/hyper.webp', '/images/hyper-water.webp', '/images/hyper-exploded.webp', '/images/bubbles.webp'],
  },
  everyday: {
    title: 'From your desk *to your day out.*',
    body: 'Keep it on your desk, pack it with your gym kit or take it along when you head out. Explore a portable format that fits the way you already carry water.',
    cards: [
      { title: 'At your desk', body: 'A bottle that sits beside your laptop and your day.', image: '/images/hyper.webp' },
      { title: 'In your bag', body: 'Packs with your gym kit and goes where you go.', image: '/images/lifestyle-locker.webp' },
      { title: 'Outdoors', body: 'Rechargeable over USB-C for the day out.', image: '/images/lifestyle-move.webp' },
    ],
  },
  how: {
    title: 'Fill it. Start the cycle. *Follow the guide.*',
    steps: [
      'Fill with drinking water that meets the product instructions.',
      'Start a hydrogen-generation cycle using the bottle’s controls.',
      'Follow the guidance for drinking, cleaning and storage.',
    ],
  },
  tech: {
    title: 'Hydrogen generation *inside the bottle.*',
    body: 'The electrolysis chamber generates molecular hydrogen that dissolves into the water during operation. Digital controls let you operate the available functions according to the product instructions.',
    parts: ['Anodised aluminium cup', 'Glass chamber', 'Electrolysis chamber', 'LED indicator', '2000 mAh battery (3.7 V / 7.4 Wh)'],
  },
  care: {
    title: 'A little care *between refills.*',
    body: 'Follow the instructions for cleaning the bottle, charging it and caring for the electrolysis chamber. You’ll find the guide here when you need a reminder.',
    steps: [
      { title: 'Rinse', body: 'Empty and rinse the cup and glass chamber after use.' },
      { title: 'Clean', body: 'Run the Auto Clean mode as described in the guide.' },
      { title: 'Charge', body: 'Recharge over USB-C when the indicator shows low battery.' },
    ],
  },
  faq: {
    title: 'A few things to know *before you buy.*',
    items: [
      { q: 'Does Hyper purify untreated water?', a: 'Do not use it as a substitute for water treatment. Use suitable drinking water as directed.' },
      { q: 'What is included?', a: 'Check the box-contents section for your selected model.' },
      { q: 'How long does a cycle take?', a: 'Cycle options and times appear in the product specifications and supplied guide.' },
    ] as Faq[],
  },
};

/* ───────────────────────── Water testing ───────────────────────── */
export const WATER_TESTING = {
  hero: {
    title: 'Get to know the water *you use every day.*',
    body: 'See what a water test can tell you, check what’s available in your area and choose your next step. If you already have a report, you can share it with our team.',
  },
  scope: {
    title: 'Know what’s included *before you book.*',
    body: 'Enter your postcode to see the available testing options. Each option shows what is measured, how the sample is collected, the price and when to expect your report.',
  },
  how: {
    title: 'Here’s what *happens next.*',
    steps: [
      { title: 'Choose your test', body: 'Check the scope and select an available option.' },
      { title: 'Arrange your sample', body: 'Follow the collection instructions for your booking.' },
      { title: 'Receive your report', body: 'See the measured results and the scope of the test.' },
      { title: 'Ask a question', body: 'Contact us if you need help understanding the next step.' },
    ],
  },
  booking: {
    title: 'Let’s arrange *your water test.*',
    body: 'Tell us where the sample will come from. We’ll show the available collection options and total cost before you confirm.',
  },
  upload: {
    title: 'Already have *a water report?*',
    body: 'Share a clear copy of the complete report, including the test date. Tell us what you’d like to understand, and our team will review your enquiry.',
  },
  explain: {
    title: 'Read the results *with context.*',
    body: 'Your report lists the parameters tested and their measured results. Read those results alongside the sample details, test date and the reference ranges used in the report. If something is unclear, ask us.',
    // illustrative layout only: shows where each column sits on a report, not real results
    sample: {
      meta: [['Sample', 'Kitchen tap, source supply'], ['Collected', 'DD MMM YYYY'], ['Report ref', 'WT-XXXXX']],
      cols: ['Parameter', 'Unit', 'Result', 'Reference range'],
      rows: [['pH', '—', '•••', 'As listed in the report'], ['TDS', 'mg/L', '•••', 'As listed in the report'], ['Total hardness', 'mg/L as CaCO₃', '•••', 'As listed in the report'], ['Free chlorine', 'mg/L', '•••', 'As listed in the report']],
    },
  },
  faq: {
    title: 'Before *you book.*',
    items: [
      { q: 'Do I need to buy a DVINE product?', a: 'No product purchase is required to request a test.' },
      { q: 'What will the test measure?', a: 'The selected test lists its parameters before booking.' },
      { q: 'Can I test my current filtered water?', a: 'Tell us whether the sample is from your source supply or an existing system so the team can confirm the right option.' },
      { q: 'When will I get the report?', a: 'Check the turnaround shown for your selected service.' },
    ] as Faq[],
  },
  slots: ['Morning (9 am – 12 pm)', 'Afternoon (12 – 4 pm)', 'Evening (4 – 7 pm)'],
  sources: ['Municipal supply', 'Borewell', 'Tanker', 'Overhead tank', 'Existing purifier / RO', 'Other'],
};

/* ───────────────────────── For business ───────────────────────── */
export const BUSINESS = {
  hero: {
    title: 'Water for the spaces *people share.*',
    body: 'Explore Titan for your workplace, hospitality property or larger residence. Tell us about daily use and peak demand so we can help assess your requirement.',
  },
  titan: {
    title: 'Meet *TitanForce 111.*',
    body: 'Eleven platinum-coated titanium plates. A floor-standing system with a SmartFlow multi-mode display. Designed for semi-commercial applications with greater water demand.',
    views: [
      { title: 'Front view', body: 'TitanForce 111, floor-standing.', image: '/images/titan.webp' },
      { title: 'Controls', body: 'SmartFlow multi-mode display.', image: '/images/titan-display.webp' },
    ],
  },
  settings: {
    title: 'Plan around the way *your space works.*',
    items: [
      { title: 'Offices', body: 'Consider daily users, refill points and the busiest part of the day.' },
      { title: 'Hospitality', body: 'Discuss guest areas, dining spaces and operating hours.' },
      { title: 'Larger residences', body: 'Assess household demand and the available installation space.' },
    ],
  },
  setup: {
    title: 'Get the setup right *before you order.*',
    body: 'Share your location, source water and intended installation area. We’ll use those details to discuss the configuration, connections and service arrangements for your site.',
  },
  enquiry: {
    title: 'Tell us *what you need.*',
    body: 'Whether it’s one location or several, share the basics and we’ll take the conversation from there.',
    settings: ['Office', 'Hospitality', 'Larger residence', 'Wellness / clinic', 'Other'],
    timelines: ['Within a month', '1–3 months', '3–6 months', 'Just exploring'],
  },
  bulk: {
    title: 'Looking at *a larger order?*',
    body: 'Ask about Hyper for team or client gifting, or share a requirement for multiple DVINE products. We’ll confirm availability, quantities and delivery options in your quotation.',
  },
};

/* ───────────────────────── Support ───────────────────────── */
export const SUPPORT = {
  hero: { title: 'What can we *help you with?*', body: 'Find guidance for your product, ask about an order or tell us what you need help with.', topics: ['Buying', 'Delivery', 'Installation', 'Product Care'] },
  products: {
    title: 'Choose *your product.*',
    body: 'Select Crystal, Titan or Hyper to find the relevant guides, care instructions and service options.',
    items: [
      { slug: 'crystal', title: 'Crystal', body: 'Home water system · guides, care, service', image: '/images/crystal.webp' },
      { slug: 'titan', title: 'Titan', body: 'Business water system · guides, care, service', image: '/images/titan.webp' },
      { slug: 'hyper', title: 'Hyper', body: 'Hydrogen bottle · guides, care, service', image: '/images/hyper.webp' },
    ],
  },
  order: { title: 'Need help *with an order?*', body: 'Use your order details to check the current status or contact us about delivery. If installation applies to your purchase, you’ll find the next steps with your order information.' },
  manuals: { title: 'Keep the right information *close.*', body: 'Find your operating guide, check the care instructions and read the warranty terms for your model. If something isn’t working as expected, send us the details.' },
  contact: { title: 'Tell us *what’s happening.*', body: 'A few details will help us direct your enquiry. Choose a topic, leave your contact information and describe what you need.', topics: ['Order or delivery', 'Installation', 'Product care', 'Service request', 'Warranty', 'Buying advice', 'Other'] },
  faq: {
    title: 'Quick answers *before you get in touch.*',
    items: [
      { q: 'Can I order without creating an account?', a: 'Yes. Use guest checkout and keep your order confirmation.' },
      { q: 'How do I book a water test?', a: 'Visit Water Testing to check the available service and booking options.' },
      { q: 'Where can I check delivery?', a: 'Enter your postcode on the product page or at checkout.' },
      { q: 'Where is my product guide?', a: 'Choose your model above to see its manuals and care instructions.' },
    ] as Faq[],
  },
};

/* ───────────────────────── Policies (drafts) ───────────────────────── */
export const POLICIES: Record<string, { title: string; sections: { h: string; p: string[] }[] }> = {
  privacy: {
    title: 'Privacy policy',
    sections: [
      { h: 'What we collect', p: ['When you order, book a water test, request a demo or contact us, we collect your name, phone number, email address, delivery and billing addresses, and the details you share in the form.', 'Payments are processed by our payment partner. We do not store card numbers, CVV, UPI PINs or banking passwords; we keep only the payment references needed for reconciliation and refunds.'] },
      { h: 'How we use it', p: ['To process and deliver orders, arrange installation, provide warranty and service, respond to enquiries and send the order and service updates you ask for.', 'We send marketing messages only if you opt in, and you can opt out at any time.'] },
      { h: 'Sharing', p: ['We share the minimum necessary information with delivery, installation, payment and communication partners who help us serve you.'] },
      { h: 'Your choices', p: ['You can ask us to access, correct or delete your information by writing to care@dvineh2o.com.'] },
    ],
  },
  terms: {
    title: 'Terms of use and sale',
    sections: [
      { h: 'Orders', p: ['An order is confirmed when payment is received and you see an order confirmation. Prices include applicable GST unless stated otherwise.', 'Titan 111 is supplied on quotation following a site discussion.'] },
      { h: 'Product use', p: ['Use DVINE products as described in the supplied manual. Use only the drinking-water settings specified for drinking. Hyper is not a substitute for water treatment.'] },
      { h: 'Liability', p: ['Nothing in these terms limits rights you have under applicable consumer protection law.'] },
    ],
  },
  'shipping-and-installation': {
    title: 'Shipping and installation',
    sections: [
      { h: 'Delivery', p: ['Enter your pincode on the product page or at checkout to see whether we deliver to you and the expected delivery time.', 'You will receive tracking details when your order ships.'] },
      { h: 'Installation', p: ['Crystal is installed by a DVINE-trained technician. After delivery, our team contacts you to schedule installation. Please make sure the water connection and power point are available.'] },
    ],
  },
  returns: {
    title: 'Returns and cancellations',
    sections: [
      { h: 'Cancelling an order', p: ['You can cancel from your account until the order is packed. A paid order is refunded in full to the original payment method.'] },
      { h: 'Returns', p: ['If a product arrives damaged or not as described, request a return from your account within the return window shown on your order. Our team will review the request and arrange collection.'] },
      { h: 'Refunds', p: ['Approved refunds are issued to the original payment method. Banks may take 5–7 working days to show the credit.'] },
    ],
  },
  warranty: {
    title: 'Warranty',
    sections: [
      { h: 'Coverage', p: ['Every DVINE system is backed by a five-year warranty covering parts, labour and performance (DVINE Assured Care). Warranty for Hyper is shown on the product page.', 'Your warranty starts on the purchase date and is listed in your account with the order.'] },
      { h: 'Service', p: ['Raise a service request from your account or the Support page. A PAN India network of certified engineers handles service visits.'] },
      { h: 'What is not covered', p: ['Damage from misuse, unauthorised repairs, or use outside the conditions in the product manual.'] },
    ],
  },
};

/* ───────────────────────── Site search index ───────────────────────── */
export function searchIndex() {
  const pages = [
    { href: '/home-water-systems', title: 'Crystal home water system', body: `${CRYSTAL.hero.body} ${CRYSTAL.features.cards.map(c => c.title + ' ' + c.body).join(' ')}` },
    { href: '/hydrogen-bottles', title: 'Hyper hydrogen water bottle', body: `${HYPER.hero.body} ${HYPER.tech.body}` },
    { href: '/for-business', title: 'Titan 111 for business', body: `${BUSINESS.hero.body} ${BUSINESS.titan.body}` },
    { href: '/water-testing', title: 'Water testing', body: `${WATER_TESTING.hero.body} ${WATER_TESTING.scope.body}` },
    { href: '/support', title: 'Support', body: `${SUPPORT.hero.body} ${SUPPORT.order.body} ${SUPPORT.manuals.body}` },
    { href: '/track', title: 'Track my order', body: 'Order status delivery tracking shipment AWB' },
    { href: '/book-demo', title: 'Book a demo', body: 'Book a Crystal or Titan demonstration at home or on a video call.' },
    ...Object.entries(POLICIES).map(([k, v]) => ({ href: `/policies/${k}`, title: v.title, body: v.sections.map(s => s.h + ' ' + s.p.join(' ')).join(' ') })),
  ];
  const faqs = [
    ...CRYSTAL.faq.items.map(f => ({ ...f, href: '/home-water-systems#faq' })),
    ...HYPER.faq.items.map(f => ({ ...f, href: '/hydrogen-bottles#faq' })),
    ...WATER_TESTING.faq.items.map(f => ({ ...f, href: '/water-testing#faq' })),
    ...SUPPORT.faq.items.map(f => ({ ...f, href: '/support#faq' })),
  ].map(f => ({ href: f.href, title: f.q, body: f.a }));
  return [...pages, ...faqs];
}
