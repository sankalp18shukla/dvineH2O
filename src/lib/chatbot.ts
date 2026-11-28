/**
 * The chat assistant in the bottom corner. No AI: a fixed set of topics recognised by keywords (with typo
 * tolerance and a little Hinglish), answered from the site's own copy and live data (prices, stock, warranty,
 * running offers, delivery pincodes). Replies are written to read naturally and suggest what to ask next.
 * When it cannot answer twice in a row, or the visitor asks for a person, it hands over to WhatsApp.
 *
 * Copy follows the brand voice: plain and factual, and never a health or medical claim.
 */
import 'server-only';
import { z } from 'zod';
import { getProduct } from './catalog';
import { CRYSTAL, HOME, HYPER, SITE, searchIndex } from './content';
import { couponInfo, couponProducts, describeCoupon } from './coupon-info';
import { formatINR } from './money';
import { getLiveContent } from './site-content.server';
import { liveOffers } from './promo-codes';
import { findPincode } from './pincodes';

export type ChatLink = { href: string; label: string };
/** `agent` messages exist only in older live-chat transcripts (Admin › Form responses). */
export type ChatMsg = { from: 'user' | 'bot' | 'agent'; text: string; at: string; links?: ChatLink[]; chips?: string[]; handoff?: boolean };
type Reply = Omit<ChatMsg, 'from' | 'at'>;

type Product = 'crystal' | 'hyper' | 'titan';
/** What the widget sends back with each question: the product being discussed, misses in a row, and whether a pincode was asked for. */
export const ChatCtx = z.object({
  topic: z.enum(['crystal', 'hyper', 'titan']).optional(),
  misses: z.number().int().min(0).max(20).catch(0).default(0),
  awaiting: z.enum(['pincode']).optional(),
}).catch({ misses: 0 });
export type ChatCtx = z.infer<typeof ChatCtx>;

/** Misses in a row before the assistant offers a person on WhatsApp. */
const HANDOFF_AFTER = 2;

/* ───────────── Understanding a message ───────────── */
const norm = (s: string) => ` ${s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9₹\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;

/** Edit distance, stopping early once it is past `max`. */
function lev(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * A key is a word ("price"), a stem ending in * ("deliver*"), or a phrase with a space ("how much").
 * Words of five letters or more forgive one typo, ten or more two; a word starting with = must be exact
 * ("=cancer", so "cancel" is not read as it).
 */
function hit(q: { n: string; toks: string[] }, key: string) {
  if (key.startsWith('=')) return q.toks.includes(key.slice(1));
  if (key.includes(' ')) return q.n.includes(` ${key} `);
  if (key.endsWith('*')) { const stem = key.slice(0, -1); return q.toks.some(t => t.startsWith(stem) || (stem.length >= 5 && lev(t.slice(0, stem.length), stem, 1) <= 1)); }
  return q.toks.some(t => t === key || (key.length >= 5 && lev(t, key, key.length >= 10 ? 2 : 1) <= (key.length >= 10 ? 2 : 1)));
}
const count = (q: Parameters<typeof hit>[0], keys: string[]) => keys.reduce((n, k) => n + (hit(q, k) ? 1 : 0), 0);

const PRODUCT_KEYS: Record<Product, string[]> = {
  crystal: ['crystal', 'purifier', 'ionizer', 'ioniser', 'ionis*', 'ioniz*', 'alkaline', 'kitchen', 'home system', 'home water', 'ro', 'water machine'],
  hyper: ['hyper', 'hydrogen', 'bottle', 'bottles', 'portable', 'h2'],
  titan: ['titan', 'titanforce', 'office', 'commercial', 'dispenser', 'workplace'],
};
function productIn(q: Parameters<typeof hit>[0]): Product | undefined {
  const found = (Object.keys(PRODUCT_KEYS) as Product[]).filter(p => count(q, PRODUCT_KEYS[p]) > 0);
  return found.length === 1 ? found[0] : undefined;
}

/* ───────────── Facts from the site and the database ───────────── */
const NAME: Record<Product, string> = { crystal: 'Crystal', hyper: 'Hyper', titan: 'Titan' };
const PAGE: Record<Product, string> = { crystal: '/home-water-systems', hyper: '/hydrogen-bottles', titan: '/for-business' };
const product = (p: Product) => getProduct(p).catch(() => null);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const years = (m: number) => (m % 12 === 0 ? `${m / 12}-year` : `${m}-month`);

async function offers() {
  return liveOffers(await getLiveContent()).then(rows => rows.map(couponInfo), () => []);
}
/** "Right now, code DIWALI10 takes 10% off Hyper." for a product, or the empty string. */
async function offerLine(p: Product) {
  const o = (await offers()).find(c => !couponProducts(c) || couponProducts(c)!.includes(NAME[p]));
  return o ? ` Right now, code ${o.code} gives ${describeCoupon(o)}.` : '';
}

async function priceOf(p: Product): Promise<Reply> {
  const x = await product(p);
  if (p === 'titan' || !x || x.saleMode !== 'cart') return {
    text: 'Titan is priced on quotation, after a short discussion about your site, the number of users and the installation. Share a few details and our business team will send you a quote.',
    links: [{ href: '/for-business#enquiry', label: 'Request a quote' }], chips: ['Book a demo', 'Bulk orders'],
  };
  if (!x.price) return { text: `You’ll find ${NAME[p]}’s current price on its page.`, links: [{ href: PAGE[p], label: `See ${NAME[p]}` }] };
  const mrp = x.mrp > x.price ? ` (MRP ${formatINR(x.mrp)})` : '';
  return {
    text: `${NAME[p]} is ${formatINR(x.price)}${mrp}, GST included.${await offerLine(p)} You can pay by UPI, card or EMI at checkout.`,
    links: [{ href: `${PAGE[p]}#buy`, label: `Buy ${NAME[p]}` }],
    chips: p === 'crystal' ? ['Installation', 'Crystal warranty', 'Delivery to my pincode'] : ['How does Hyper work?', 'Hyper warranty', 'Delivery to my pincode'],
  };
}

async function allPrices(): Promise<Reply> {
  const [c, h] = await Promise.all([product('crystal'), product('hyper')]);
  const line = (n: string, x: typeof c) => (x?.price ? `${n}: ${formatINR(x.price)}` : null);
  const list = [line('Crystal, the home water system', c), line('Hyper, the hydrogen water bottle', h)].filter(Boolean);
  return {
    text: `${list.length ? `Here are today’s prices, GST included:\n• ${list.join('\n• ')}\n` : 'Current prices are on each product page. '}Titan, for workplaces, is priced on quotation.`,
    links: [{ href: '/home-water-systems', label: 'Crystal' }, { href: '/hydrogen-bottles', label: 'Hyper' }, { href: '/for-business#enquiry', label: 'Titan quote' }],
    chips: ['Current offers', 'Which one is right for me?', 'EMI options'],
  };
}

async function pincodeReply(pin: string): Promise<Reply> {
  const row = await findPincode(pin).catch(() => null);
  if (!row || !row.serviceable) return {
    text: `We don’t deliver to ${pin} yet, sorry. Our team can still check what’s possible for your area.`,
    chips: ['Talk to a person', 'Check another pincode'],
  };
  const by = new Date(Date.now() + row.deliveryDays * 86400_000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
  const extras = [row.installation ? 'Crystal installation is available there' : 'Crystal installation isn’t available there yet', row.waterTesting ? 'and we can test your water at home' : ''].filter(Boolean).join(' ');
  return {
    text: `Good news: we deliver to ${row.city} (${pin}). Order today and it should reach you by about ${by}. ${extras}.`,
    chips: ['Price of Hyper', 'Price of Crystal', 'Current offers'],
  };
}

/* ───────────── Topics ───────────── */
type Ctx = { q: Parameters<typeof hit>[0]; raw: string; p?: Product; ctx: ChatCtx };
type Topic = { id: string; keys: string[]; strong?: string[]; answer: (c: Ctx) => Reply | Promise<Reply> };

const handoff = (text: string): Reply => ({ text, handoff: true, chips: ['Current offers', 'Track my order'] });

const TOPICS: Topic[] = [
  { id: 'human', keys: ['whatsapp', 'person', 'human', 'agent', 'representative', 'executive', 'someone', 'customer care', 'customer service', 'support team', 'baat karni', 'baat karna', 'callback', 'call back', 'call me'],
    strong: ['talk to', 'speak to', 'speak with', 'talk with', 'real person', 'connect me'],
    answer: () => handoff(pick(['Sure, our team is on WhatsApp and happy to help. Tap below and your question goes with you, so you won’t have to type it again.', 'Of course. A person from our team will take it from here on WhatsApp. Tap below to start; I’ve added your question to the message.'])) },

  { id: 'upset', keys: ['useless', 'worst', 'pathetic', 'fraud', 'scam', 'cheat*', 'angry', 'disappointed', 'terrible', 'horrible', 'not helpful', 'bekar', 'bakwas'],
    answer: () => handoff('I’m sorry this has been frustrating. Let’s get you to a person who can sort it out properly. Tap below to message our team on WhatsApp.') },

  { id: 'health', strong: ['=health', '=healthy', 'benefit*', '=cure', '=cures', 'disease*', 'diabetes', '=cancer', 'blood pressure', 'immunity', 'weight loss', 'antioxidant*', 'detox', 'medical', 'medicine', '=doctor', 'kidney', 'acidity', 'pregnan*', 'side effect*', 'good for'], keys: [],
    answer: ({ p }) => ({
      text: `We don’t make health or medical claims about our products. ${p === 'crystal' ? 'Crystal filters your water and offers four water modes' : p === 'titan' ? 'Titan supplies treated water for shared spaces' : 'Hyper generates dissolved molecular hydrogen in suitable drinking water'}, used as the manual describes. For anything about your health, please speak to your doctor.`,
      links: [{ href: '/blog', label: 'Read our blog' }], chips: ['How does Hyper work?', 'Crystal water modes', 'Talk to a person'],
    }) },

  { id: 'safety', keys: ['=safe', 'safety', '=kids', '=kid', 'children', '=child', '=baby', 'elderly', 'toxic', 'harmful', 'dangerous'],
    answer: ({ p }) => ({
      text: `${p === 'crystal' ? 'Use Crystal’s drinking-water settings as the manual specifies; not every mode is meant for drinking.' : p === 'titan' ? 'Titan is installed and set up by our team for your site, and its use is covered in the handover.' : 'Use Hyper as the user guide describes, with suitable drinking water; it is not a substitute for water treatment.'} For questions about children or a medical condition, please check with your doctor. Our team can answer anything about the product itself.`,
      links: [{ href: '/support#manuals', label: 'Manuals and guides' }], chips: ['Talk to a person', 'How does Hyper work?'],
    }) },

  { id: 'greet', keys: ['hi', 'hii', 'hello', 'helo', 'hey', 'hlo', 'namaste', 'namaskar', 'good morning', 'good afternoon', 'good evening', 'yo', 'hola'],
    answer: () => {
      const h = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }));
      const hi = h < 12 ? 'Good morning!' : h < 17 ? 'Good afternoon!' : 'Good evening!';
      return { text: `${hi} I can help with prices and offers, delivery to your pincode, installation, water testing or an order you’ve placed. What would you like to know?`, chips: ['Current offers', 'Which one is right for me?', 'Track my order'] };
    } },

  { id: 'thanks', strong: ['thanks', 'thank', 'thx', 'thankyou', 'ty', 'shukriya', 'dhanyavad', 'dhanyawad'], keys: [],
    answer: () => ({ text: pick(['You’re welcome! Anything else I can help with?', 'Happy to help. Is there anything else you’d like to know?']), chips: ['Current offers', 'Talk to a person'] }) },

  { id: 'bye', strong: ['bye', 'goodbye', 'see you', 'thats all', 'that is all', 'nothing else', 'no thanks'], keys: [],
    answer: () => ({ text: 'Thanks for stopping by. If anything comes up, I’m right here in the corner.' }) },

  { id: 'bot', strong: ['are you a bot', 'are you ai', 'are you human', 'are you real', 'who are you', 'your name', 'chatgpt', 'robot'], keys: [],
    answer: () => ({ text: 'I’m DVINE’s website assistant. I answer the common questions instantly, day or night. For anything I can’t handle, our team is on WhatsApp.', chips: ['Talk to a person', 'Current offers'] }) },

  { id: 'offers', keys: ['offer', 'offers', 'discount*', 'coupon*', 'promo', 'promocode', 'code', 'codes', 'sale', 'deal', 'deals', 'cashback', 'festive', 'diwali', 'cheaper', 'voucher'],
    answer: async ({ p }) => {
      const list = (await offers()).filter(c => !p || !couponProducts(c) || couponProducts(c)!.includes(NAME[p]));
      if (!list.length) return { text: `There’s no code running${p ? ` for ${NAME[p]}` : ''} right now. The prices on the product pages are current, and new offers show up in the ribbon at the top of the site.`, chips: ['Price of Hyper', 'Price of Crystal', 'EMI options'] };
      return {
        text: `${list.length === 1 ? 'There’s one offer running' : `There are ${list.length} offers running`} right now:\n${list.map(c => `• ${c.code}: ${describeCoupon(c)}`).join('\n')}\nTap a code to add it to your cart. The saving shows at checkout.`,
        links: list.slice(0, 3).map(c => ({ href: `/offer/${c.code}?to=/cart`, label: `Apply ${c.code}` })),
        chips: ['Price of Hyper', 'Price of Crystal'],
      };
    } },

  { id: 'price', keys: ['price', 'prices', 'pricing', 'cost', 'costs', 'rate', 'mrp', 'kitna', 'kitne', 'kimat', 'keemat', 'daam', 'expensive', 'afford*', 'budget'], strong: ['how much'],
    answer: ({ p }) => (p ? priceOf(p) : allPrices()) },

  { id: 'emi', keys: ['emi', 'installment*', 'instalment*', 'upi', 'payment', 'pay', 'paying', 'card', 'credit', 'debit', 'netbanking', 'phonepe', 'gpay', 'paytm', 'cod', 'cash'], strong: ['cash on delivery', 'no cost emi'],
    answer: ({ q }) => ({
      text: `${count(q, ['cod', 'cash', 'cash on delivery']) ? 'Orders are paid online at checkout, so there’s no cash on delivery. ' : ''}You can pay by UPI, debit or credit card, or EMI, through PhonePe’s secure checkout. EMI plans depend on your card or bank and are shown when you pay.`,
      chips: ['Price of Crystal', 'Current offers'],
    }) },

  { id: 'track', keys: ['track', 'tracking', 'status', 'awb', 'shipment', 'shipped', 'dispatch*', 'courier'], strong: ['where is my order', 'order status', 'my order', 'order kaha', 'not received', 'not delivered'],
    answer: ({ raw }) => {
      const num = raw.match(/\bDV-?\d{2}-?\d{6}\b/i)?.[0].toUpperCase();
      return { text: `${num ? `Let’s find ${num}. ` : ''}You can check any order with its order number and the email or phone you used. Signed in? Your orders are all in your account too.`, links: [{ href: '/track', label: 'Track my order' }, { href: '/account/orders', label: 'My orders' }], chips: ['Cancel an order', 'Talk to a person'] };
    } },

  { id: 'delivery', keys: ['deliver*', 'shipping', 'ship', 'ships', 'pincode', 'pin code', 'postcode', 'kab', 'arrive', 'reach', 'serviceable', 'available in', 'city'], strong: ['how long', 'how many days', 'kitne din', 'deliver to'],
    answer: ({ raw }) => {
      const pin = raw.match(/\b[1-9]\d{5}\b/)?.[0];
      if (pin) return pincodeReply(pin);
      return { text: 'Happy to check. What’s your 6-digit pincode? I’ll tell you if we deliver there and roughly when it would arrive.' };
    } },

  { id: 'install', keys: ['install*', 'fitting', 'fit', 'plumb*', 'technician', 'mount*', 'setup', 'lagwana', 'lagana', 'connection', 'space', 'counter'],
    answer: ({ p }) => p === 'hyper'
      ? { text: 'Hyper needs no installation. Charge it over USB-C, fill it with drinking water and start a cycle with the button on the base.', chips: ['How does Hyper work?', 'Price of Hyper'] }
      : p === 'titan'
        ? { text: 'Titan is installed by our team after a site check, so the water line, power and drainage suit your space. The details come with your quotation.', links: [{ href: '/for-business#enquiry', label: 'Request a quote' }] }
        : { text: `After delivery, our team calls you to schedule installation. A DVINE-trained technician installs Crystal, connects the water line and walks you through the controls. Please keep ready: ${CRYSTAL.fit.needs.map(n => n.title.toLowerCase()).join(', ')}.`,
          links: [{ href: '/home-water-systems#setup', label: 'Check the fit' }, { href: '/policies/shipping-and-installation', label: 'Shipping and installation' }], chips: ['Delivery to my pincode', 'Price of Crystal'] } },

  { id: 'warranty', keys: ['warranty', 'warrenty', 'guarantee', 'guaranty'],
    answer: async ({ p }) => {
      if (p === 'titan') return { text: 'Titan’s warranty policy is being finalised. Until it is published, the warranty and service terms for your unit are set out in your quotation.', links: [{ href: '/policies/warranty', label: 'Warranty policy' }] };
      const h = await product('hyper');
      const hyper = `Hyper has a ${years(h?.warrantyMonths ?? 12)} warranty from the purchase date. If it arrives damaged or not working, tell us within 48 hours of delivery.`;
      const crystal = 'Crystal has a one-year comprehensive warranty on the machine and a five-year warranty on the electrolysis chamber, for up to 1,000 litres of use.';
      return { text: p === 'hyper' ? hyper : p === 'crystal' ? crystal : `${crystal} ${hyper}`, links: [{ href: '/warranty', label: 'Check my warranty' }, { href: '/policies/warranty', label: 'Warranty policy' }], chips: ['Raise a service request', 'Returns'] };
    } },

  { id: 'referral', keys: ['refer', 'referral', 'referrals', 'referal', 'referring', 'invite', 'friend code', 'share code'], strong: ['refer a friend', 'referral code', 'my code', 'earn reward'],
    answer: async () => {
      const { getReferralSettings } = await import('./referrals');
      const s = await getReferralSettings();
      if (!s.enabled) return { text: 'Our refer-a-friend programme is paused right now. Rewards you’ve already earned still work in your cart.', links: [{ href: '/account/referrals', label: 'My rewards' }] };
      return { text: `After your first purchase you get a personal referral code to share. Friends get ${s.friendPercent}% off their first DVINE order${s.friendMax ? ` (up to ${formatINR(s.friendMax)})` : ''}, and once their order is delivered${s.holdDays ? ` and kept ${s.holdDays} days` : ''} you get a ${formatINR(s.rewardFlat)} code for your next order. Your code is in your account once you sign in.`, links: [{ href: '/account/referrals', label: 'Get my code' }], chips: ['Current offers', 'Price of Hyper'] };
    } },

  { id: 'service', keys: ['repair', 'service', 'servicing', 'broken', 'leak*', 'error', 'faulty', 'defect*', 'damage*', 'kharab', 'complaint'], strong: ['not working', 'stopped working', 'doesnt work', 'dont work', 'service request'],
    answer: () => ({ text: 'Sorry to hear that. Raise a service request with your order or serial number and a short description (a photo helps), and our service team will get in touch. If it’s urgent, message us on WhatsApp.', links: [{ href: '/support#contact', label: 'Service request' }, { href: '/account/service', label: 'My service requests' }], chips: ['Warranty', 'Talk to a person'] }) },

  { id: 'returns', keys: ['return', 'returns', 'refund*', 'cancel*', 'replace*', 'exchange', 'money back'], strong: ['cancel my order', 'cancel order', 'cancel the order'],
    answer: () => ({ text: 'You can cancel an order from your account until it’s packed. If a product arrives damaged or faulty, tell us quickly: within 48 hours of delivery for Hyper, or within 7 days of delivery or installation for Crystal. We inspect it and replace or repair it. When a refund is due, it goes back to your original payment method.', links: [{ href: '/policies/returns', label: 'Returns policy' }, { href: '/account/orders', label: 'My orders' }], chips: ['Track my order', 'Talk to a person'] }) },

  { id: 'compare', keys: ['compare', 'comparison', 'difference', 'different', 'recommend*', 'suggest*', 'best', 'better', 'confused', 'choose', 'which'], strong: ['which one', 'right for me', 'should i buy', 'vs', 'versus'],
    answer: () => ({ text: 'It depends on where you drink most of your water:\n• At home: Crystal, a kitchen-counter water system with filtration and four water modes.\n• On the go: Hyper, a portable bottle that generates dissolved hydrogen in your drinking water.\n• At work: Titan, a semi-commercial system for offices and shared spaces.\nTell me which fits and I’ll share the details.', links: [{ href: '/#collection', label: 'Help me choose' }], chips: ['Tell me about Crystal', 'Tell me about Hyper', 'Tell me about Titan'] }) },

  { id: 'howHyper', keys: ['electrolysis', 'pem', 'spe', 'membrane', 'cycle', 'generate*', 'dissolved'], strong: ['how does it work', 'how it works', 'how does hyper work'],
    answer: ({ p }) => p === 'crystal'
      ? { text: `${CRYSTAL.hero.body.split('. ')[0]}. ${CRYSTAL.features.cards.map(c => c.body).slice(0, 2).join(' ')}`, links: [{ href: '/home-water-systems', label: 'See Crystal' }], chips: ['Crystal water modes', 'Price of Crystal'] }
      : { text: `${HYPER.hero.body.split('. ')[0]}. ${HYPER.tech.body.split('. ')[0]}. Fill it with suitable drinking water, start a cycle from the base, and follow the guide for drinking, cleaning and storage.`, links: [{ href: '/hydrogen-bottles#how-it-works', label: 'How Hyper works' }], chips: ['Hyper battery', 'Price of Hyper', 'Hyper warranty'] } },

  { id: 'battery', keys: ['battery', 'charge', 'charging', 'charger', 'usb', 'mah'],
    answer: () => ({ text: `Hyper has a 2000 mAh battery (3.7 V, 7.4 Wh) in its control base and recharges over USB-C. Recharge when the indicator shows low battery.`, links: [{ href: '/hydrogen-bottles', label: 'Hyper specifications' }], chips: ['How does Hyper work?', 'Price of Hyper'] }) },

  { id: 'modes', keys: ['mode', 'modes', 'hot', 'neutral', 'ambient', 'ph', 'orp', 'touchscreen', 'display'],
    answer: () => ({ text: `Crystal has four water modes: Hot, Ambient, Alkaline and High-Alkaline. The touchscreen shows pH, ORP and filter status. ${CRYSTAL.modes.note}`, links: [{ href: '/home-water-systems', label: 'See Crystal' }], chips: ['Crystal filter care', 'Price of Crystal'] }) },

  { id: 'filter', keys: ['filter', 'filters', 'cartridge', 'maintenance', 'maintain', 'clean', 'cleaning', 'care'], strong: ['filter replacement', 'replace the filter', 'change the filter', 'filter change'],
    answer: ({ p }) => p === 'hyper'
      ? { text: `Caring for Hyper is simple: ${HYPER.care.steps.map(s => `${s.title.toLowerCase()}: ${s.body.charAt(0).toLowerCase()}${s.body.slice(1, -1)}`).join('; ')}.`, links: [{ href: '/support#manuals', label: 'Hyper user guide' }] }
      : { text: 'Crystal’s touchscreen shows filter status. Replace filters as the manual describes; how often depends on your usage and source water. Our service team can arrange replacements.', links: [{ href: '/support#manuals', label: 'Manuals' }, { href: '/support#contact', label: 'Request service' }], chips: ['Crystal warranty', 'Talk to a person'] } },

  { id: 'buy', keys: ['buy', 'purchase', 'order online', 'amazon', 'flipkart', 'offline', 'outlet', 'retail'], strong: ['where to buy', 'where can i buy', 'how to order', 'how do i order', 'place an order'],
    answer: ({ p }) => ({
      text: p === 'titan' ? 'Titan is ordered through our business team after a short site discussion.' : `You can order ${p ? NAME[p] : 'Crystal and Hyper'} right here on the website, as a guest or with an account, and pay by UPI, card or EMI. We deliver, install and service throughout Odisha.`,
      links: p === 'titan' ? [{ href: '/for-business#enquiry', label: 'Request a quote' }] : p ? [{ href: `${PAGE[p]}#buy`, label: `Buy ${NAME[p]}` }] : [{ href: '/home-water-systems#buy', label: 'Buy Crystal' }, { href: '/hydrogen-bottles#buy', label: 'Buy Hyper' }],
      chips: ['Delivery to my pincode', 'Current offers'],
    }) },

  { id: 'specs', keys: ['size', 'dimension*', 'weight', 'capacity', 'litre*', 'liter*', 'specs', 'specification*', 'height', 'width', 'material', 'box', 'included', 'contents'],
    answer: ({ p }) => ({
      text: `${p ? `${NAME[p]}’s` : 'Each product’s'} full specifications, dimensions and what comes in the box are listed on ${p ? 'its' : 'its own'} page.${p === 'crystal' ? ' Before ordering Crystal, check you have counter space, a water inlet, a power point and a drain line nearby.' : ''}`,
      links: p ? [{ href: `${PAGE[p]}#specs`, label: `${NAME[p]} specifications` }] : [{ href: '/home-water-systems#specs', label: 'Crystal' }, { href: '/hydrogen-bottles#specs', label: 'Hyper' }],
      chips: p === 'crystal' ? ['Installation', 'Price of Crystal'] : ['Hyper battery', 'Price of Hyper'],
    }) },

  { id: 'colours', keys: ['colour', 'colours', 'color', 'colors', 'rose', 'grey', 'gray', 'ivory', 'midnight', 'black', 'white', 'red'],
    answer: ({ p }) => ({ text: p === 'crystal' ? 'Crystal comes in Ivory and Midnight.' : p === 'hyper' ? 'Hyper comes in Rose and Gravity Grey.' : 'Crystal comes in Ivory and Midnight, and Hyper in Rose and Gravity Grey. Pick your colour on the product page.', links: p ? [{ href: PAGE[p], label: `See ${NAME[p]}` }] : [{ href: '/home-water-systems', label: 'Crystal' }, { href: '/hydrogen-bottles', label: 'Hyper' }] }) },

  { id: 'stock', keys: ['stock', 'available', 'availability', 'sold out', 'out of stock', 'in stock'],
    answer: async ({ p }) => {
      const list = await Promise.all((p ? [p] : ['crystal', 'hyper'] as Product[]).filter(x => x !== 'titan').map(async x => ({ x, r: await product(x) })));
      if (!list.length) return { text: 'Titan is built to order after your quotation.', links: [{ href: '/for-business#enquiry', label: 'Request a quote' }] };
      return { text: list.map(({ x, r }) => `${NAME[x]}: ${!r ? 'see the product page' : r.stock === 'out_of_stock' ? 'out of stock right now' : r.stock === 'low_stock' ? `only ${r.available} left` : 'in stock'}`).join('. ') + '.', links: list.map(({ x }) => ({ href: `${PAGE[x]}#buy`, label: `Buy ${NAME[x]}` })) };
    } },

  { id: 'water', keys: ['tds', 'hardness', 'hard water', 'contamin*', 'quality', 'lab', 'report', 'sample', 'borewell', 'bore', 'tanker', 'municipal'], strong: ['water test', 'test my water', 'water testing', 'testing'],
    answer: () => ({ text: 'We can test your water at your address, or review a report you already have. Each test option shows what is measured, how the sample is collected, the price and when to expect your report.', links: [{ href: '/water-testing#book', label: 'Book a test' }, { href: '/water-testing#upload', label: 'Upload a report' }], chips: ['Which one is right for me?', 'Talk to a person'] }) },

  { id: 'demo', keys: ['demo', 'demonstration', 'showroom', 'visit', 'video call'], strong: ['see it', 'try it'],
    answer: () => ({ text: 'We can show you Crystal or Titan at home or on a video call. Pick a time that suits you.', links: [{ href: '/book-demo', label: 'Book a demo' }], chips: ['Price of Crystal', 'Titan for offices'] }) },

  { id: 'business', keys: ['business', 'bulk', 'corporate', 'gift*', 'hotel', 'restaurant', 'school', 'gym', 'quotation', 'quote', 'wholesale', 'company'],
    answer: () => ({ text: 'For offices, hospitality, bulk orders or corporate gifting, share a few details and our business team will reply with options and a quotation.', links: [{ href: '/for-business#enquiry', label: 'Business enquiry' }, { href: '/for-business#bulk', label: 'Bulk and gifting' }], chips: ['Tell me about Titan', 'Book a demo'] }) },

  { id: 'partner', keys: ['dealer*', 'distribut*', 'partner*', 'franchise', 'reseller', 'retailer', 'dealership'],
    answer: () => ({ text: 'We’d love to hear from you. See how partnering with DVINE works and apply on the Become a Partner page.', links: [{ href: '/become-a-partner', label: 'Become a partner' }] }) },

  { id: 'account', keys: ['account', 'login', 'log in', 'signin', 'sign in', 'register', 'signup', 'password', 'otp'],
    answer: ({ q }) => count(q, ['password', 'forgot']) ? { text: 'No problem. Reset your password with the email on your account.', links: [{ href: '/account/forgot', label: 'Reset password' }] }
      : { text: 'You don’t need an account to order; guest checkout works fine. With one, you can see orders, warranties and service requests in one place.', links: [{ href: '/account/login', label: 'Sign in' }, { href: '/account/register', label: 'Create an account' }] } },

  { id: 'invoice', keys: ['invoice', 'bill', 'gst', 'gstin', 'receipt', 'tax'],
    answer: () => ({ text: 'Every order comes with a GST invoice. Open the order in your account, or track it with your order number, to download it. Need GST details for a business? Add your GSTIN at checkout.', links: [{ href: '/account/orders', label: 'My orders' }, { href: '/track', label: 'Track my order' }] }) },

  { id: 'manual', keys: ['manual', 'guide', 'instructions', 'brochure', 'pdf', 'download'],
    answer: () => ({ text: 'Manuals, care instructions and warranty terms for each product are on the Support page.', links: [{ href: '/support#manuals', label: 'Manuals and guides' }] }) },

  { id: 'contact', keys: ['contact', 'phone', 'number', 'email', 'mail', 'address', 'location', 'located', 'store', 'shop', 'helpline', 'toll'],
    answer: () => ({ text: `You can reach us at ${SITE.phone} (toll-free) or ${SITE.email}. We’re at ${SITE.address.join(' ').replace(/,\s*$/, '')}.`, links: [{ href: `tel:${SITE.phone.replace(/\s/g, '')}`, label: 'Call us' }, { href: '/support#contact', label: 'Send an enquiry' }], chips: ['Talk to a person'] }) },

  { id: 'about', keys: ['dvine', 'divine', 'brand', 'founder', 'made in', 'indian'], strong: ['who are you guys', 'about dvine', 'about your company', 'what is dvine'],
    answer: () => ({ text: `${HOME.about.body} DVINE H2O was founded by Nandini Lakhotia in Bhubaneswar, Odisha.`, links: [{ href: '/about', label: 'About us' }], chips: ['Which one is right for me?', 'Current offers'] }) },

  { id: 'ack', keys: ['ok', 'okay', 'okk', 'k', 'cool', 'great', 'nice', 'fine', 'got it', 'hmm', 'alright', 'sure', 'yes', 'yeah', 'no', 'nope'],
    answer: () => ({ text: pick(['Great. Anything else I can help with?', 'Got it. What else would you like to know?']), chips: ['Current offers', 'Which one is right for me?', 'Talk to a person'] }) },
];

/** A product named on its own ("Tell me about Hyper", "crystal?"). */
async function overview(p: Product): Promise<Reply> {
  if (p === 'titan') return { text: 'Titan is our semi-commercial water system for offices, hospitality and shared spaces. It’s built to order and priced on quotation after a short site discussion.', links: [{ href: '/for-business', label: 'See Titan' }, { href: '/for-business#enquiry', label: 'Request a quote' }], chips: ['Book a demo', 'Bulk orders'] };
  const x = await product(p);
  const price = x?.price ? ` It’s ${formatINR(x.price)}, GST included.` : '';
  const intro = p === 'crystal' ? CRYSTAL.hero.body.split('. ')[0] : HYPER.hero.body.split('. ')[0];
  return { text: `${intro}.${price}${await offerLine(p)}`, links: [{ href: PAGE[p], label: `See ${NAME[p]}` }],
    chips: p === 'crystal' ? ['Installation', 'Crystal water modes', 'Crystal warranty'] : ['How does Hyper work?', 'Hyper battery', 'Hyper warranty'] };
}

/** Last resort: the closest FAQ or page on the site. */
function fromSite(q: Parameters<typeof hit>[0]): Reply | null {
  const words = q.toks.filter(w => w.length > 2 && !STOP.has(w));
  if (!words.length) return null;
  let best: { score: number; item?: ReturnType<typeof searchIndex>[number] } = { score: 0 };
  for (const item of searchIndex()) {
    const hay = norm(`${item.title} ${item.title} ${item.body}`).split(' ');
    const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : hay.some(h => h.length > 4 && h.startsWith(w.slice(0, 5))) ? 0.5 : 0), 0);
    if (score > best.score) best = { score, item };
  }
  if (!best.item || best.score < Math.max(2, words.length * 0.6)) return null;
  const body = best.item.body.length < 260 ? best.item.body : best.item.body.slice(0, 240).replace(/\s\S*$/, '') + '…';
  return { text: body, links: [{ href: best.item.href, label: best.item.title.length > 40 ? 'Read more' : best.item.title }], chips: ['Talk to a person'] };
}
const STOP = new Set(['the', 'and', 'for', 'does', 'can', 'what', 'how', 'with', 'you', 'this', 'that', 'are', 'your', 'have', 'there', 'about', 'from', 'will', 'when', 'where', 'which', 'want', 'need', 'please', 'tell', 'know', 'any', 'get', 'its', 'kya', 'hai', 'mujhe', 'mera', 'meri']);

/** One answer for one message. The widget sends back the returned context with the next message. */
export async function botReply(text: string, prev: ChatCtx): Promise<{ reply: Reply; ctx: ChatCtx }> {
  const q = { n: norm(text), toks: norm(text).trim().split(' ').filter(Boolean) };
  const p = productIn(q);
  const topic = p ?? prev.topic;
  const ok = (reply: Reply, extra: Partial<ChatCtx> = {}) => ({ reply, ctx: { topic, misses: 0, ...extra } satisfies ChatCtx });

  // a pincode on its own, or after "what's your pincode?"
  const pin = text.match(/\b[1-9]\d{5}\b/)?.[0];
  if (pin && (prev.awaiting === 'pincode' || q.toks.length <= 3)) return ok(await pincodeReply(pin));

  // the best topic; small talk ("hi", "ok", "thanks") only answers when nothing else in the message does
  const SMALL = ['greet', 'thanks', 'ack', 'bye'];
  const scored = TOPICS.map(t => ({ t, score: count(q, t.keys) + 2 * count(q, t.strong ?? []) })).filter(x => x.score > 0);
  const top = (xs: typeof scored) => xs.reduce<typeof scored[number] | null>((b, x) => (x.score > (b?.score ?? 0) ? x : b), null);
  let best = top(scored.filter(x => !SMALL.includes(x.t.id)));
  // "hi hyper" is about Hyper, "ok thanks" is small talk
  if (!best && !p) best = top(scored);
  if (best) {
    const reply = await best.t.answer({ q, raw: text, p: topic, ctx: prev });
    return ok(reply, best.t.id === 'delivery' && !pin ? { awaiting: 'pincode' } : {});
  }
  if (p) return ok(await overview(p));

  const site = fromSite(q);
  if (site) return ok(site);

  const misses = prev.misses + 1;
  if (misses >= HANDOFF_AFTER) return { reply: handoff('I’m not able to answer that one properly, and I’d rather not guess. Our team can help you on WhatsApp. Tap below and your question goes with you.'), ctx: { topic, misses: 0 } };
  return {
    reply: { text: pick(['Sorry, I didn’t quite get that. Could you put it another way? I’m best with prices, offers, delivery, installation, warranty and orders.', 'Hmm, I’m not sure I understood. Try asking about a product, an offer, delivery to your pincode or an order.']), chips: ['Current offers', 'Which one is right for me?', 'Talk to a person'] },
    ctx: { topic, misses },
  };
}
