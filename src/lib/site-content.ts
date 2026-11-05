/**
 * Editable site content (Admin › Homepage & promotions). One document holds everything the team can change
 * without a deploy: the announcement ribbon, extra hero slides, the promotion cards, the water-testing copy and
 * the Become a Partner page. Shared by the admin editor (client) and the pages (server), so no server imports.
 *
 * The defaults reproduce the site as designed: with nothing saved, the homepage looks exactly as before.
 */
import { z } from 'zod';
import { HOME } from './content';

/* ───────────── Themes: brand-book colour pairs for promotions ───────────── */
/** bg/fg: the block colour and its text; em: the accent word; pin: the corner pins; accent: buttons on the dark hero card */
export const THEMES = {
  volt:    { label: 'Voltage',      bg: '#F0FF00', fg: '#04164A', em: '#046FED', pin: '#046FED', accent: '#F0FF00', dark: false },
  glacier: { label: 'Glacier',      bg: '#25FFE8', fg: '#04164A', em: '#046FED', pin: '#FF2E9C', accent: '#25FFE8', dark: false },
  current: { label: 'Deep Current', bg: '#046FED', fg: '#FFFFFF', em: '#F0FF00', pin: '#25FFE8', accent: '#25FFE8', dark: true },
  flash:   { label: 'Hyper Flash',  bg: '#FF2E9C', fg: '#FFFFFF', em: '#F0FF00', pin: '#F0FF00', accent: '#FF2E9C', dark: true },
  ultra:   { label: 'Ultra Ion',    bg: '#5B00FF', fg: '#FFFFFF', em: '#25FFE8', pin: '#25FFE8', accent: '#25FFE8', dark: true },
  ink:     { label: 'Midnight',     bg: '#04164A', fg: '#FFFFFF', em: '#25FFE8', pin: '#F0FF00', accent: '#25FFE8', dark: true },
  mist:    { label: 'Mist',         bg: '#F0F2F7', fg: '#04164A', em: '#046FED', pin: '#046FED', accent: '#25FFE8', dark: false },
} as const;
export type ThemeKey = keyof typeof THEMES;
export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];
/** CSS custom properties for a theme, applied inline by every promotion component. */
export const themeVars = (k: ThemeKey) => {
  const t = THEMES[k] ?? THEMES.volt;
  return { '--p-bg': t.bg, '--p-fg': t.fg, '--p-em': t.em, '--p-pin': t.pin, '--p-accent': t.accent } as Record<string, string>;
};

/* ───────────── Schema ───────────── */
const s = (max: number, d = '') => z.string().trim().max(max).catch(d).default(d);
const bool = (d: boolean) => z.boolean().catch(d).default(d);
const theme = (d: ThemeKey) => z.enum(THEME_KEYS as [ThemeKey, ...ThemeKey[]]).catch(d).default(d);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')).catch('').default('');
const uid = z.string().max(40).catch(() => Math.random().toString(36).slice(2, 10));

/** Optional run dates (India time, inclusive). Empty = always on. */
const Schedule = z.object({ from: date, to: date }).catch({ from: '', to: '' }).default({ from: '', to: '' });
export const Link = z.object({ label: s(40), href: s(300) });
export const Media = z.object({
  type: z.enum(['image', 'video']).catch('image'),
  src: s(500),
  poster: s(500),
  alt: s(200),
}).nullable().catch(null).default(null);

export const RibbonSchema = z.object({
  enabled: bool(false),
  items: z.array(z.object({ id: uid, text: s(140) })).max(12).catch([]).default([]),
  theme: theme('volt'),
  /** seconds for one full loop of the messages */
  speed: z.number().min(8).max(120).catch(36).default(36),
  separator: z.enum(['drop', 'star', 'dot', 'spark']).catch('drop').default('drop'),
  href: s(300),
  scope: z.enum(['home', 'all']).catch('home').default('home'),
  schedule: Schedule,
});

const n = (min: number, max: number, d: number) => z.number().min(min).max(max).catch(d).default(d);
/**
 * Decoration (PNG sticker: diya, lantern, garland…) placed over a slide or card. x/y: its centre as a % of the
 * slide (may hang off the edges); w: width as a % of the slide's width; back: behind the text, front: over it.
 */
export const DecorSchema = z.object({
  id: uid, src: s(500),
  x: n(-20, 120, 50), y: n(-20, 120, 50), w: n(2, 80, 12), rotate: n(-180, 180, 0), opacity: n(.1, 1, 1),
  layer: z.enum(['front', 'back']).catch('front').default('front'),
  motion: z.enum(['float', 'sway', 'twinkle', 'spin', 'none']).catch('float').default('float'),
  mobile: bool(true),
});
const Decor = z.array(DecorSchema).max(16).catch([]).default([]);

export const SlideSchema = z.object({
  id: uid,
  enabled: bool(true),
  /** first: the slide every visitor lands on; last: after the three products */
  position: z.enum(['first', 'last']).catch('first').default('first'),
  theme: theme('volt'),
  /** pinned descriptor above the title; its last word is set in the accent colour */
  tag: s(60),
  /** large title; new lines are kept */
  title: s(80),
  body: s(320),
  primary: Link.catch({ label: '', href: '' }).default({ label: '', href: '' }),
  secondary: Link.catch({ label: '', href: '' }).default({ label: '', href: '' }),
  media: Media,
  /** cover: photo or video fills the card behind the copy; side: shown on the right, as the products are */
  fit: z.enum(['cover', 'side']).catch('cover').default('cover'),
  /** how much the media is darkened behind the copy (0–90) */
  shade: z.number().min(0).max(90).catch(45).default(45),
  /** seconds before the slideshow moves on */
  duration: z.number().min(3).max(60).catch(8).default(8),
  decor: Decor,
  schedule: Schedule,
});

export const CardSchema = z.object({
  id: uid,
  enabled: bool(true),
  theme: theme('volt'),
  tag: s(40),
  title: s(90),
  body: s(280),
  cta: Link.catch({ label: '', href: '' }).default({ label: '', href: '' }),
  media: Media,
  decor: Decor,
  schedule: Schedule,
});

export const PromoSchema = z.object({
  enabled: bool(false),
  /** optional heading over the cards: write *italic words* for the Garamond line */
  title: s(90),
  body: s(280),
  cards: z.array(CardSchema).max(3).catch([]).default([]),
});

export const PicSchema = z.object({ id: uid, after: s(40), src: s(500), alt: s(160) });
export const WaterSchema = z.object({
  title: s(90, HOME.waterTesting.title),
  body: s(600, HOME.waterTesting.body),
  pics: z.array(PicSchema).max(8).catch([]).default([]),
  primary: Link.catch({ label: 'Book a Water Test', href: '/water-testing#book' }).default({ label: 'Book a Water Test', href: '/water-testing#book' }),
  secondary: Link.catch({ label: 'Upload My Report', href: '/water-testing#upload' }).default({ label: 'Upload My Report', href: '/water-testing#upload' }),
});

const Item = z.object({ id: uid, title: s(80), body: s(400) });
export const PartnerSchema = z.object({
  title: s(90, '*Grow with* DVINE.'),
  body: s(500),
  media: Media,
  benefitsTitle: s(90),
  benefits: z.array(Item).max(8).catch([]).default([]),
  stepsTitle: s(90),
  steps: z.array(Item).max(8).catch([]).default([]),
  partnerTypes: z.array(z.object({ id: uid, text: s(60) })).max(12).catch([]).default([]),
  formTitle: s(90),
  formBody: s(400),
  faqs: z.array(z.object({ id: uid, q: s(160), a: s(800) })).max(12).catch([]).default([]),
});

export const SiteContentSchema = z.object({
  ribbon: RibbonSchema.catch(() => RibbonSchema.parse({})).default({}),
  slides: z.array(SlideSchema).max(4).catch([]).default([]),
  promo: PromoSchema.catch(() => PromoSchema.parse({})).default({}),
  water: WaterSchema.catch(() => WaterSchema.parse({})).default({}),
  partner: PartnerSchema.catch(() => PartnerSchema.parse({})).default({}),
});

export type SiteContent = z.infer<typeof SiteContentSchema>;
export type Ribbon = SiteContent['ribbon'];
export type PromoSlide = SiteContent['slides'][number];
export type PromoCard = SiteContent['promo']['cards'][number];
export type MediaItem = NonNullable<PromoSlide['media']>;
export type WaterPic = SiteContent['water']['pics'][number];
export type DecorItem = z.infer<typeof DecorSchema>;

/* ───────────── Decoration packs (public/decor) ─────────────
   Ready-made transparent PNGs; the team can also upload their own. `w` is the size each starts at. */
export const DECOR_PACKS = [
  { key: 'diwali', label: 'Diwali', items: [
    { src: '/decor/diwali/diya.png', label: 'Diya', w: 9 },
    { src: '/decor/diwali/lantern.png', label: 'Lantern', w: 6 },
    { src: '/decor/diwali/garland.png', label: 'Marigold garland', w: 40 },
    { src: '/decor/diwali/toran.png', label: 'Toran', w: 60 },
    { src: '/decor/diwali/lights.png', label: 'Fairy lights', w: 50 },
    { src: '/decor/diwali/rangoli.png', label: 'Rangoli', w: 18 },
    { src: '/decor/diwali/marigold.png', label: 'Marigold', w: 6 },
    { src: '/decor/diwali/sparkles.png', label: 'Sparkles', w: 8 },
    { src: '/decor/diwali/firework.png', label: 'Firework', w: 14 },
  ] },
] as const;
type DecorSeed = Partial<DecorItem> & { src: string };
const decor = (items: DecorSeed[]) => items.map((d, i) => DecorSchema.parse({ id: `d${i}`, ...d }));

export const newId = () => Math.random().toString(36).slice(2, 10);

/* ───────────── Defaults (= the site as designed) ───────────── */
const WATER_PICS: Omit<WaterPic, 'id'>[] = [
  { after: 'look', src: '/images/1_2ndsec.png', alt: 'Cupped hands catching clear running water' },
  { after: 'available', src: '/images/2_2ndsec.png', alt: 'A scientist holding up a sample vial in a lab' },
  { after: 'area,', src: '/images/3_2ndsec.png', alt: 'A street map of the local area' },
  { after: 'team.', src: '/images/4_2ndsec.png', alt: 'A drop of water falling into still water' },
];

export const DEFAULT_PARTNER: SiteContent['partner'] = {
  title: '*Grow with* DVINE.',
  body: 'We work with distributors, dealers, retailers and institutional partners who want to bring functional hydration to their city. Tell us about your business and the territory you cover, and our partnerships team will get in touch.',
  media: { type: 'image', src: '/images/collection.webp', poster: '', alt: 'Crystal, Titan and Hyper together' },
  benefitsTitle: '*Why partner* with us.',
  benefits: [
    { id: 'b1', title: 'A complete range', body: 'Crystal for homes, Hyper for the day and Titan 111 for shared spaces: one partner, three ways to sell.' },
    { id: 'b2', title: 'Training and demos', body: 'Product training for your team, demo units and help running in-store and at-home demonstrations.' },
    { id: 'b3', title: 'Installation and service', body: 'Installation, warranty and service arrangements, so your customers are looked after after the sale.' },
    { id: 'b4', title: 'Marketing support', body: 'Brand assets, launch material and promotions for festive seasons and local events.' },
  ],
  stepsTitle: '*How it* works.',
  steps: [
    { id: 's1', title: 'Send your details', body: 'Tell us about your business, your territory and the products you are interested in.' },
    { id: 's2', title: 'Meet our team', body: 'Our partnerships team calls you to understand your market and answer your questions.' },
    { id: 's3', title: 'Agree the terms', body: 'We share the partnership terms, pricing and support for your region.' },
    { id: 's4', title: 'Launch together', body: 'Training, demo units and launch support to get you started.' },
  ],
  partnerTypes: ['Distributor', 'Dealer', 'Retail store', 'Corporate or institutional', 'Interior designer or architect', 'Other'].map((text, i) => ({ id: `t${i}`, text })),
  formTitle: '*Tell us* about your business.',
  formBody: 'Share a few details and our partnerships team will get back to you within two working days.',
  faqs: [
    { id: 'q1', q: 'Who can become a DVINE partner?', a: 'Distributors, dealers, retail stores, and corporate or institutional buyers. If your business serves homes, workplaces or hospitality, we would like to hear from you.' },
    { id: 'q2', q: 'Is there a minimum order?', a: 'Terms depend on the partnership type and region. Our team will share the details after the first call.' },
    { id: 'q3', q: 'Do you provide training?', a: 'Yes. We train your team on the products, demonstrations, installation requirements and after-sales service.' },
  ],
};

export const DEFAULT_CONTENT: SiteContent = SiteContentSchema.parse({
  ribbon: { enabled: false, items: [], theme: 'volt', speed: 36, separator: 'drop', href: '', scope: 'home' },
  slides: [],
  promo: { enabled: false, title: '', body: '', cards: [] },
  water: { pics: WATER_PICS.map((p, i) => ({ ...p, id: `p${i}` })) },
  partner: DEFAULT_PARTNER,
});

/** Validates anything (a saved document, a request body), falling back field by field to the defaults. */
export const parseContent = (v: unknown): SiteContent => {
  const r = SiteContentSchema.safeParse(v ?? {});
  return r.success ? r.data : DEFAULT_CONTENT;
};

/* ───────────── Scheduling ───────────── */
/** Today in India as YYYY-MM-DD, for comparing with the run dates. */
export const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
export const isLive = (x: { enabled?: boolean; schedule?: { from: string; to: string } }, today = todayIST()) =>
  x.enabled !== false && (!x.schedule?.from || x.schedule.from <= today) && (!x.schedule?.to || x.schedule.to >= today);

/* ───────────── Festive templates ─────────────
   One click fills the ribbon, a first hero slide and one promotion card with ready copy in a matching theme.
   Copy follows the brand voice: plain, factual, no health claims; offers are written for the team to finish. */
export type Template = {
  key: string; label: string; theme: ThemeKey; emoji: string;
  ribbon: string[];
  slide: { tag: string; title: string; body: string; primary: { label: string; href: string }; media: string; fit: 'cover' | 'side'; decor?: DecorItem[] };
  card: { tag: string; title: string; body: string; cta: { label: string; href: string }; media: string; decor?: DecorItem[] };
};
export const TEMPLATES: Template[] = [
  {
    key: 'diwali', label: 'Diwali', theme: 'volt', emoji: '🪔',
    ribbon: ['Festive offers on Crystal and Hyper', 'Gift Hyper this Diwali', 'Free installation on Crystal this season', 'Book a free home demo'],
    slide: { tag: 'This Diwali Festive Offers', title: 'Light up\nevery sip.', body: 'Festive pricing on Crystal and Hyper for a limited period. Gift better water to the people you celebrate with.', primary: { label: 'Shop the Offers', href: '/home-water-systems' }, media: '/images/hyper_product.png', fit: 'side',
      decor: decor([
        { src: '/decor/diwali/rangoli.png', x: 74, y: 55, w: 34, layer: 'back', motion: 'spin', opacity: .3, mobile: false },
        { src: '/decor/diwali/toran.png', x: 70, y: 3, w: 58, layer: 'front', motion: 'sway', mobile: false },
        { src: '/decor/diwali/lantern.png', x: 52, y: 18, w: 5, layer: 'front', motion: 'sway' },
        { src: '/decor/diwali/lantern.png', x: 95, y: 22, w: 4.2, layer: 'front', motion: 'sway' },
        { src: '/decor/diwali/sparkles.png', x: 90, y: 50, w: 7, layer: 'front', motion: 'twinkle', mobile: false },
        { src: '/decor/diwali/diya.png', x: 60, y: 90, w: 9, layer: 'front', motion: 'float' },
        { src: '/decor/diwali/diya.png', x: 93, y: 91, w: 7, layer: 'front', motion: 'float', mobile: false },
      ]) },
    card: { tag: 'Diwali gifting', title: 'Gift Hyper this Diwali', body: 'A hydrogen water bottle for everyone on your list. Bulk and corporate gifting available.', cta: { label: 'Explore gifting', href: '/for-business#bulk' }, media: '/images/brand-hand-bottle.webp',
      decor: decor([
        { src: '/decor/diwali/lights.png', x: 50, y: 2, w: 70, layer: 'front', motion: 'sway' },
        { src: '/decor/diwali/diya.png', x: 36, y: 90, w: 9, layer: 'front', motion: 'float' },
        { src: '/decor/diwali/sparkles.png', x: 6, y: 24, w: 6, layer: 'front', motion: 'twinkle' },
      ]) },
  },
  {
    key: 'holi', label: 'Holi', theme: 'flash', emoji: '🎨',
    ribbon: ['Holi offers on Hyper', 'A splash of colour, a bottle of Hyper', 'Limited-period festive pricing'],
    slide: { tag: 'Holi Colour Edition', title: 'Splash into\nHoli.', body: 'Take Hyper along for the celebrations. Festive pricing for a limited period.', primary: { label: 'Shop Hyper', href: '/hydrogen-bottles' }, media: '/images/hyper_product.png', fit: 'side' },
    card: { tag: 'Holi special', title: 'Hyper for the celebrations', body: 'Rechargeable, portable and ready to go wherever the colours take you.', cta: { label: 'Shop Hyper', href: '/hydrogen-bottles' }, media: '/images/lifestyle-move.webp' },
  },
  {
    key: 'independence', label: 'Independence Day', theme: 'current', emoji: '🇮🇳',
    ribbon: ['Independence Day offers', 'Made for Indian water conditions', 'Book a free water test'],
    slide: { tag: 'Independence Day Special', title: 'Freedom\nto choose.', body: 'Independence Day pricing on Crystal. Start with a water test and choose the setup that suits your home.', primary: { label: 'Shop Crystal', href: '/home-water-systems' }, media: '/images/crystal_product.png', fit: 'side' },
    card: { tag: '15 August', title: 'Independence Day pricing', body: 'Limited-period offers on our home water systems, with installation included.', cta: { label: 'See the offer', href: '/home-water-systems' }, media: '/images/crystal.webp' },
  },
  {
    key: 'newyear', label: 'New Year', theme: 'ultra', emoji: '✨',
    ribbon: ['New year, new water routine', 'New Year offers on the full range', 'Book a free home demo'],
    slide: { tag: 'Happy New Year Resolution', title: 'New year.\nNew water.', body: 'Start the year with a better water routine. New Year offers across Crystal, Hyper and Titan.', primary: { label: 'Shop the Range', href: '/home-water-systems' }, media: '/images/collection.webp', fit: 'cover',
      decor: decor([{ src: '/decor/diwali/firework.png', x: 88, y: 20, w: 16, motion: 'twinkle' }, { src: '/decor/diwali/sparkles.png', x: 70, y: 70, w: 8, motion: 'twinkle' }]) },
    card: { tag: 'New Year', title: 'Start the year right', body: 'Offers across the range for a limited period.', cta: { label: 'Shop now', href: '/home-water-systems' }, media: '/images/lifestyle-drink.webp' },
  },
  {
    key: 'summer', label: 'Summer', theme: 'glacier', emoji: '☀️',
    ribbon: ['Stay hydrated this summer', 'Summer offers on Hyper', 'Free delivery across India'],
    slide: { tag: 'Summer Hydration Season', title: 'Keep your\ncool.', body: 'Summer is the season to drink more water. Take Hyper along, wherever the day goes.', primary: { label: 'Shop Hyper', href: '/hydrogen-bottles' }, media: '/images/hyper-water.webp', fit: 'cover' },
    card: { tag: 'Summer', title: 'Hydration on the go', body: 'Hyper is rechargeable over USB-C and fits in your bag.', cta: { label: 'Shop Hyper', href: '/hydrogen-bottles' }, media: '/images/pool.webp' },
  },
  {
    key: 'launch', label: 'New launch', theme: 'volt', emoji: '🚀',
    ribbon: ['Just launched', 'Be among the first to own it', 'Book a demo today'],
    slide: { tag: 'Introducing Something New', title: 'Just\nlaunched.', body: 'Meet the newest member of the DVINE family. Book a demo to see it for yourself.', primary: { label: 'Book a Demo', href: '/book-demo' }, media: '/images/crystal_product.png', fit: 'side' },
    card: { tag: 'New', title: 'Just launched', body: 'See what is new from DVINE H2O.', cta: { label: 'Find out more', href: '/book-demo' }, media: '/images/crystal-inside.webp' },
  },
  {
    key: 'sale', label: 'Sale', theme: 'flash', emoji: '🏷️',
    ribbon: ['Sale now on', 'Limited-period prices', 'While stocks last'],
    slide: { tag: 'Limited Period Sale', title: 'The DVINE\nsale.', body: 'Limited-period prices across the range, while stocks last.', primary: { label: 'Shop the Sale', href: '/home-water-systems' }, media: '/images/collection.webp', fit: 'cover' },
    card: { tag: 'Sale', title: 'Limited-period prices', body: 'Offers across Crystal and Hyper while stocks last.', cta: { label: 'Shop now', href: '/home-water-systems' }, media: '/images/collection.webp' },
  },
];
