import { searchIndex } from './content';

export type ChatMsg = { from: 'user' | 'bot' | 'agent'; text: string; at: string; links?: { href: string; label: string }[] };

const INTENTS: { re: RegExp; text: string; links?: { href: string; label: string }[] }[] = [
  { re: /\b(track|where.*order|order status|awb|shipment|deliver(ed|y) status)\b/i, text: 'You can check any order with its order number and the email or phone you used.', links: [{ href: '/track', label: 'Track my order' }] },
  { re: /\b(price|cost|how much|emi|offer|discount)\b/i, text: 'Current prices for Crystal and Hyper are on their product pages, including GST. Titan is priced on quotation after a short site discussion.', links: [{ href: '/home-water-systems', label: 'Crystal' }, { href: '/hydrogen-bottles', label: 'Hyper' }, { href: '/for-business#enquiry', label: 'Titan quote' }] },
  { re: /\b(water test|test my water|tds|report|lab)\b/i, text: 'You can book a water test at your address, or upload a report you already have for our team to review.', links: [{ href: '/water-testing#book', label: 'Book a test' }, { href: '/water-testing#upload', label: 'Upload a report' }] },
  { re: /\b(demo|demonstration|see it|visit)\b/i, text: 'We can show you Crystal or Titan at home or on a video call.', links: [{ href: '/book-demo', label: 'Book a demo' }] },
  { re: /\b(install|installation|fit|plumb)\b/i, text: 'Crystal is installed by a DVINE-trained technician. After delivery we contact you to schedule it. Check availability for your pincode on the product page.', links: [{ href: '/policies/shipping-and-installation', label: 'Shipping and installation' }] },
  { re: /\b(warrant|guarantee|repair|service|not working|broken|issue|problem)\b/i, text: 'Every DVINE system is backed by a five-year warranty. You can raise a service request from your account or the Support page.', links: [{ href: '/support#contact', label: 'Service request' }, { href: '/account/service', label: 'My account' }] },
  { re: /\b(return|refund|cancel)\b/i, text: 'You can cancel an order from your account until it is packed. Returns for delivered items are requested from the order page.', links: [{ href: '/policies/returns', label: 'Returns policy' }] },
  { re: /\b(business|office|hotel|bulk|corporate|gift|dealer|distribut)/i, text: 'For workplaces, hospitality, bulk orders or distributorship, share a few details and our business team will reply.', links: [{ href: '/for-business#enquiry', label: 'Business enquiry' }, { href: '/for-business#bulk', label: 'Bulk and gifting' }] },
  { re: /\b(hi|hello|hey|namaste)\b/i, text: 'Hello! Ask me about our products, delivery, installation, water testing or an existing order.' },
];

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'i', 'my', 'to', 'of', 'and', 'or', 'for', 'do', 'does', 'can', 'what', 'how', 'it', 'in', 'on', 'with', 'you', 'me', 'be', 'this', 'that']);
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));

export function botReply(text: string): Omit<ChatMsg, 'at'> {
  for (const i of INTENTS) if (i.re.test(text)) return { from: 'bot', text: i.text, links: i.links };
  const q = words(text);
  let best: { score: number; item?: ReturnType<typeof searchIndex>[number] } = { score: 0 };
  for (const item of searchIndex()) {
    const hay = words(`${item.title} ${item.title} ${item.body}`);
    const score = q.reduce((s, w) => s + (hay.includes(w) ? 1 : hay.some(h => h.startsWith(w.slice(0, 5))) ? 0.5 : 0), 0);
    if (score > best.score) best = { score, item };
  }
  if (best.item && best.score >= 1.5) return { from: 'bot', text: best.item.body.length < 260 ? best.item.body : best.item.body.slice(0, 240).replace(/\s\S*$/, '') + '…', links: [{ href: best.item.href, label: best.item.title.length > 40 ? 'Read more' : best.item.title }] };
  return { from: 'bot', text: 'I’m not sure about that one. Would you like to talk to someone from our team? Tap “Talk to a person” and we’ll pick it up here.' };
}
