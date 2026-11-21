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
  email: 'reachout@dvineh2o.com',
  whatsapp: '918984163478',
  whatsappUrl: 'https://wa.me/918984163478',
  address: ['1st Floor, Block 1, Bhawani Mall,', 'Sahid Nagar, Bhubaneswar 751007'],
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bhawani+Mall+Sahid+Nagar+Bhubaneswar+751007',
  description: 'DVINE H2O makes functional hydration systems: Crystal for the home, Hyper hydrogen water bottle for the day, and Titan 111 for shared spaces.',
};

export const NAV = {
  main: [
    { href: '/home-water-systems', label: 'Home Water Systems' },
    { href: '/for-business', label: 'Office Water Systems' },
    { href: '/hydrogen-bottles', label: 'Hydrogen Bottles' },
    { href: '/water-testing', label: 'Water Testing' },
    { href: '/become-a-partner', label: 'Become a Partner' },
  ],
  utility: [
    { href: '/for-business', label: 'For Business' },
    { href: '/support', label: 'Support' },
    { href: '/support#contact', label: 'Contact Us' },
  ],
};

export const FOOTER = [
  { title: 'Shop', links: [{ href: '/home-water-systems', label: 'Crystal' }, { href: '/hydrogen-bottles', label: 'Hyper' }, { href: '/for-business', label: 'Titan 111' }, { href: '/for-business#bulk', label: 'Bulk and gifting' }] },
  { title: 'Learn', links: [{ href: '/#about', label: 'Meet DVINE' }, { href: '/blog', label: 'Blog' }, { href: '/hydrogen-bottles#how-it-works', label: 'How Hyper works' }, { href: '/water-testing#book', label: 'Book a water test' }, { href: '/water-testing#upload', label: 'Upload a report' }] },
  { title: 'Help', links: [{ href: '/track', label: 'Track my order' }, { href: '/support#manuals', label: 'Manuals and warranty' }, { href: '/support#contact', label: 'Service request' }, { href: '/book-demo', label: 'Book a demo' }] },
  { title: 'Contact', links: [{ href: 'tel:18002024504', label: '1800 202 4504' }, { href: 'mailto:reachout@dvineh2o.com', label: 'reachout@dvineh2o.com' }, { href: 'https://wa.me/918984163478', label: 'WhatsApp us' }, { href: '/support#contact', label: 'Send an enquiry' }, { href: '/for-business#enquiry', label: 'Request a quote' }] },
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
        body: 'Made for the home where every object earns its place: water for drinking, for cooking and for infant feeds, from one system.',
        feats: [
          { title: 'Drinking water', sub: 'Alkaline, pH 8.5–9.5' },
          { title: 'Kitchen and nursery', sub: 'Ambient water for cooking and infants' },
          { title: '1-year comprehensive warranty', sub: 'Installed by factory-trained technicians' },
        ],
        cta: 'Shop Crystal', cutout: '/images/crystal/ivory.webp', image: '/images/crystal/duo.webp' },
      { slug: 'hyper', href: '/hydrogen-bottles', title: 'Hyper', where: 'On the go', desc: 'Hydrogen Water Bottle',
        body: 'Hydrogen-rich water wherever your day happens. It fits the routine you already have, in the gym bag or on the desk.',
        feats: [
          { title: 'Three modes', sub: 'H2 generation, auto clean, standby' },
          { title: 'One-touch timer', sub: 'With auto shut-off' },
          { title: 'Leak-proof body', sub: 'Built for daily and travel use' },
        ],
        cta: 'Shop Hyper', cutout: '/images/hyper/rose.webp', image: '/images/hyper/duo.webp' },
      { slug: 'titan', href: '/for-business', title: 'Titan', where: 'For larger spaces', desc: 'Semi-commercial Water System',
        body: 'For when a household becomes a compound and an office becomes a statement. Crystal’s ionisation, grown to institutional scale.',
        feats: [
          { title: '120 litres an hour', sub: 'Continuous output' },
          { title: 'Multiple water modes', sub: 'Alkaline, neutral and functional' },
          { title: 'Pan-India service', sub: 'Certified engineers, 5-year care' },
        ],
        cta: 'Explore Titan', cutout: '/images/titan_product.png', image: '/images/titan/front.webp' },
    ],
  },
  technology: {
    title: '*See what happens* inside.',
    body: 'Crystal filters incoming water before the ionisation stage. Five platinum-coated titanium plates carry out electrolysis, while the touchscreen brings the operating information into view.',
    // one step per part of the inside video; `fact`/`note` is the figure set opposite the copy on wide screens.
    // `refs` annotate a phrase of `body` (matched exactly) with a numbered link to the supporting paper (opens in a new tab).
    // The PDFs in public/research/ are placeholders until the real studies are in.
    labels: [
      { title: 'Filtration', body: 'Incoming water passes through PureCore multi-stage filtration first. Sediment and impurities stay behind in the cartridges.', fact: 'PureCore', note: 'multi-stage filtration',
        refs: [{ text: 'PureCore multi-stage filtration', href: '/research/filtration-study.pdf', label: 'Filtration performance study (PDF)' }] },
      { title: 'Ionisation', body: 'In the ionisation chamber, five platinum-coated titanium plates carry out electrolysis on the filtered water.', fact: '5 plates', note: 'platinum-coated titanium',
        refs: [{ text: 'carry out electrolysis', href: '/research/electrolysis-study.pdf', label: 'Electrolysis study (PDF)' }] },
      { title: 'Touchscreen', body: 'Choose hot, ambient or alkaline water with a tap. pH, ORP and filter status are shown at the machine.', fact: 'pH · ORP', note: 'and filter status on screen' },
    ],
  },
  helpChoosing: {
    title: '*A few details can* help you choose.',
    body: 'Looking for a system for your kitchen, a bottle to take along, or water for a shared space? Start with where you’ll use it.',
    // `image` is the section photo; until it is in public/, the card falls back to `fallback`
    // each option opens its product; `tone` is the product colour from the collection (Crystal glacier, Hyper flash, Titan volt)
    options: [
      { title: 'At Home', product: 'Crystal', desc: 'Home Water System', tone: 'glacier', href: '/home-water-systems', image: '/images/crystal_sec.png', fallback: '/images/crystal/duo.webp' },
      { title: 'On the Go', product: 'Hyper', desc: 'Hydrogen Water Bottle', tone: 'flash', href: '/hydrogen-bottles', image: '/images/hyper_sec.png', fallback: '/images/lifestyle-locker.webp' },
      { title: 'For My Business', product: 'Titan', desc: 'Semi-commercial Water System', tone: 'volt', href: '/for-business', image: '/images/titan_sec.png', fallback: '/images/titan/front.webp' },
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
    gallery: ['/images/crystal/ivory-front.webp', '/images/crystal/ivory-angle.webp', '/images/crystal/ivory-side.webp', '/images/crystal/ivory-profile.webp'],
  },
  /** Crystal's colours (BottleFinish.tsx): picking one wipes its own render up over the last on the product stage,
   *  and the gallery shows that colour. The cut-outs share one canvas so the wipe lines up. */
  finishes: [
    { key: 'ivory', name: 'Ivory', swatch: '#e9e6df', cutout: '/images/crystal/ivory.webp',
      photos: ['/images/crystal/ivory-front.webp', '/images/crystal/ivory-angle.webp', '/images/crystal/ivory-side.webp', '/images/crystal/ivory-profile.webp'] },
    { key: 'midnight', name: 'Midnight', swatch: '#232326', cutout: '/images/crystal/midnight.webp',
      photos: ['/images/crystal/midnight-front.webp', '/images/crystal/midnight-angle.webp', '/images/crystal/midnight-side.webp', '/images/crystal/midnight-profile.webp'] },
  ],
  features: {
    title: '*The details that make* Crystal work.',
    cards: [
      // `refs`: a phrase of `body` linked to its supporting paper (placeholder PDFs in public/research/ for now)
      { icon: 'plates5', title: 'Five-plate ionisation', body: 'Platinum-coated titanium plates carry out electrolysis.',
        refs: [{ text: 'carry out electrolysis', href: '/research/electrolysis-study.pdf', label: 'Electrolysis study (PDF)' }] },
      { icon: 'filter', title: 'Multi-stage filtration', body: 'PureCore prepares incoming water before ionisation.',
        refs: [{ text: 'PureCore prepares incoming water', href: '/research/filtration-study.pdf', label: 'Filtration performance study (PDF)' }] },
      { icon: 'modes', title: 'Four water modes', body: 'Choose from Hot, Ambient, Alkaline and High-Alkaline settings.' },
      { icon: 'screen', title: 'Touchscreen controls', body: 'View pH, ORP and filter status at the machine.' },
    ],
  },
  modes: {
    title: '*Choose a mode.* Understand its use.',
    items: [
      { key: 'hot', title: 'Hot', body: 'Explore the hot-water option.', color: '#FF0401' },
      { key: 'neutral', title: 'Ambient', body: 'View the ambient-water setting.', color: '#F0F2F7' },
      { key: 'alkaline', title: 'Alkaline', body: 'Explore the alkaline-water setting.', color: '#25FFE8' },
      { key: 'high', title: 'High-Alkaline', body: 'An output for designated applications.', color: '#5B00FF' },
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
      { q: 'Care and maintenance', a: 'The touchscreen shows filter status. Follow the replacement guidance in the manual; usage and source-water conditions affect how often filters need replacing.' },
      { q: 'Warranty', a: 'Crystal has a one-year comprehensive warranty, and its electrolysis chamber is covered for 4 years or 1,000 litres, whichever comes first. The warranty starts on the purchase date and is listed in your account with your order.' },
    ] as Faq[],
  },
  faq: {
    title: '*Still deciding? Let’s* clear a few things up.',
    items: [
      { q: 'Will Crystal work with my water supply?', a: 'Suitability depends on your source water and setup. Share those details with our team.' },
      { q: 'Are all modes for drinking?', a: 'Use only the drinking-water settings specified in the manual.' },
      { q: 'When do filters need replacing?', a: 'Follow the model guidance; usage and water conditions affect replacement needs.' },
    ] as Faq[],
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
    // in the order HyperAssembly builds the bottle, bottom up
    parts: ['Control base: LED indicator, 2000 mAh battery (3.7 V / 7.4 Wh)', 'Electrolysis chamber: platinum-titanium plates, SPE/PEM membrane', 'Glass chamber', 'Anodised aluminium cup'],
  },
  care: {
    title: '*A little care* between refills.',
    body: 'Follow the instructions for cleaning the bottle, charging it and caring for the electrolysis chamber. You’ll find the guide here when you need a reminder.',
    steps: [
      { title: 'Rinse', body: 'Empty and rinse the cup and glass chamber after use.' },
      { title: 'Clean', body: 'Run the Auto Clean mode as described in the guide.' },
      { title: 'Charge', body: 'Recharge over USB-C when the indicator shows low battery.' },
    ],
  },
  faq: {
    title: '*A few things to know* before you buy.',
    items: [
      { q: 'Does Hyper purify untreated water?', a: 'Do not use it as a substitute for water treatment. Use suitable drinking water as directed.' },
      { q: 'How long does a cycle take?', a: 'Cycle options and times appear in the product specifications and supplied guide.' },
      { q: 'What is included?', a: 'Check the box-contents section for your selected model.' },
    ] as Faq[],
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
      rows: [['pH', '—', '•••', 'As listed in the report'], ['TDS', 'mg/L', '•••', 'As listed in the report'], ['Total hardness', 'mg/L as CaCO₃', '•••', 'As listed in the report'], ['Free chlorine', 'mg/L', '•••', 'As listed in the report']],
    },
  },
  faq: {
    title: '*Before* you book.',
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
    title: '*Water for the spaces* people share.',
    body: 'Explore Titan for your workplace, hospitality property or larger residence. Tell us about daily use and peak demand so we can help assess your requirement.',
  },
  titan: {
    title: '*Meet* TitanForce 111.',
    body: 'Eleven platinum-coated titanium plates. A floor-standing system with a SmartFlow multi-mode display. Designed for semi-commercial applications with greater water demand.',
    views: [
      { title: 'Front view', body: 'TitanForce 111, floor-standing.', image: '/images/titan/front.webp' },
      { title: 'Controls', body: 'SmartFlow multi-mode display.', image: '/images/titan/display.webp' },
    ],
    /** the four details around Titan on the office page, from its specifications */
    features: [
      { icon: 'plates11', title: 'Eleven plates', body: 'Platinum-coated titanium, HydroCore ionisation for higher demand.' },
      { icon: 'drop', title: '120 litres an hour', body: 'Continuous output for the busiest part of the day.' },
      { icon: 'display', title: 'SmartFlow display', body: 'A multi-mode display for alkaline, neutral and functional water.' },
      { icon: 'building', title: 'Floor-standing', body: 'A semi-commercial build for offices, hospitality and larger homes.' },
    ],
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
      { slug: 'titan', title: 'Titan', body: 'Business water system · guides, care, service', image: '/images/titan/front.webp' },
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
  crystalWarranty: { label: 'Warranty policy', href: '/docs/policies/crystal-warranty-policy.pdf' },
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
        docs: [DOCS.crystalReturns, DOCS.crystalReplacement],
        sections: [
          { h: 'Cancelling an order', p: [[
            'Orders can be cancelled before dispatch at no charge.',
            'If an order is cancelled after dispatch but before installation, the actual shipping and handling charges are deducted.',
            'Orders cannot be cancelled once the product is installed.',
          ]] },
          { h: 'Returns', p: [
            'Because of hygiene, health safety and technical installation requirements, Crystal is generally non-returnable once installed. A return may be accepted only if:',
            ['The product is dead on arrival', 'A major manufacturing defect is found at the time of installation', 'The wrong product was delivered'],
            'Raise the return request within 48 hours of delivery. The product must be unused (apart from testing during installation), in its original packaging, with all accessories and the invoice. Final approval is subject to technical inspection by our authorised service team.',
          ] },
          { h: 'Replacement', p: [
            'Crystal is eligible for replacement only if:',
            ['The unit has a manufacturing defect', 'It was damaged during delivery, reported within 48 hours', 'It is not working because of an internal technical fault, verified by an authorised technician'],
            'Raise the replacement request within 7 days of delivery or installation. After 7 days, the issue is handled under the warranty instead.',
            'Replacement is processed after inspection by DVINE-authorised service personnel. If a manufacturing defect is confirmed, the defective part or unit is replaced free of charge with a new or equivalent one, within 7–10 working days of approval. The original packaging, invoice and all accessories must be returned. A replacement is not approved if the product seal, warranty seal or internal components have been tampered with.',
          ] },
          { h: 'Refunds', p: [
            'Refunds are made only when:',
            ['The order was cancelled before dispatch', 'A return was approved for a confirmed manufacturing defect and a replacement isn’t possible'],
            'Refunds are initiated within 7–14 working days of approval, to the original payment method. For EMI purchases, the refund follows the bank or finance partner’s policy.',
          ] },
          { h: 'Not eligible', p: [
            'Returns, refunds and replacement do not apply to:',
            ['Change of mind after installation', 'Dissatisfaction with the taste', 'Damage from mishandling, or installation by an unauthorised person', 'Damage from voltage fluctuation', 'Water quality or water pressure beyond the recommended limits', 'Unauthorised repairs or tampering', 'Normal wear and tear of filters, which are consumables'],
          ] },
          { h: 'Before you buy', p: ['Crystal is a health appliance set up for your home. Please make sure you understand its features, whether your water suits it and what installation needs before you order. If you’re unsure about your water, book a water test first.'] },
        ],
      },
      {
        id: 'hyper', title: 'Hyper hydrogen water bottle',
        docs: [DOCS.hyperReturns, DOCS.hyperReplacement],
        sections: [
          { h: 'Cancelling an order', p: ['Orders can be cancelled within 24 hours of being placed. Once an order has shipped, it can’t be cancelled.'] },
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
          { h: 'How to request a return', p: ['Call customer support on 1800 202 4504 or email reachout@dvineh2o.com with your order ID, contact details and the reason for the return. Signed-in customers can also start a return from their account.'] },
        ],
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
          { h: 'Electrolysis chamber: 4 years or 1,000 litres', p: ['The electrolysis chamber is covered for 4 years from the date of purchase or 1,000 litres of use, whichever comes first. This covers manufacturing defects and performance issues under normal household use.'] },
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
          { h: 'Coverage', p: ['Hyper’s warranty term is shown on its product page and on your invoice. If Hyper arrives damaged, defective or not working, tell us within 48 hours of delivery; after verification it is replaced or repaired under warranty, as set out in the returns and replacement terms.'] },
          { h: 'What is not covered', p: [[
            'Using unapproved liquids. Fill Hyper only with clean drinking water such as filtered, distilled or purified water, never carbonated drinks, soda or heavy mineral water.',
            'Battery damage from incorrect charging or a third-party charger. Charge only with the cable supplied.',
            'Damage from drops, misuse, or immersing the generator base in water.',
            'Opening or taking apart the internal components.',
          ]] },
        ],
      },
      {
        id: 'titan', title: 'Titan',
        sections: [{ h: 'Coverage', p: ['Titan is supplied on quotation after a site discussion. Its warranty and service terms are confirmed in your quotation.'] }],
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
    { href: '/for-business', title: 'Titan 111 for business', body: `${BUSINESS.hero.body} ${BUSINESS.titan.body}` },
    { href: '/water-testing', title: 'Water testing', body: `${WATER_TESTING.hero.body} ${WATER_TESTING.scope.body}` },
    { href: '/support', title: 'Support', body: `${SUPPORT.hero.body} ${SUPPORT.order.body} ${SUPPORT.manuals.body}` },
    { href: '/track', title: 'Track my order', body: 'Order status delivery tracking shipment AWB' },
    { href: '/book-demo', title: 'Book a demo', body: 'Book a Crystal or Titan demonstration at home or on a video call.' },
    ...Object.entries(POLICIES).map(([k, v]) => ({ href: `/policies/${k}`, title: v.title, body: policySections(v).map(s => s.h + ' ' + s.p.flat().join(' ')).join(' ') })),
  ];
  const faqs = [
    ...CRYSTAL.faq.items.map(f => ({ ...f, href: '/home-water-systems#faq' })),
    ...HYPER.faq.items.map(f => ({ ...f, href: '/hydrogen-bottles#faq' })),
    ...WATER_TESTING.faq.items.map(f => ({ ...f, href: '/water-testing#faq' })),
    ...SUPPORT.faq.items.map(f => ({ ...f, href: '/support#faq' })),
  ].map(f => ({ href: f.href, title: f.q, body: f.a }));
  return [...pages, ...faqs];
}
