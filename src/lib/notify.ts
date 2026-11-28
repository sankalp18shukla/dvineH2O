/**
 * Outbound messages. Every message is written to the notifications table (Admin › Messages sent).
 *
 * Email goes out when SMTP_* is configured. WhatsApp goes out when WHATSAPP_TOKEN and WHATSAPP_PHONE_ID are set,
 * always as an approved Meta template (see whatsapp-templates.ts), because WhatsApp doesn't allow a business to
 * open a conversation with free text. Until a channel is configured, its messages are stored with status
 * "logged", so nothing is lost before go-live and the history is complete from day one.
 */
import { eq } from 'drizzle-orm';
import { db } from './db';
import { notifications } from './db/schema';
import { WA_TEMPLATES, waParam, type WaKey } from './whatsapp-templates';

const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export type Msg = {
  template: string;
  subject: string;
  /** the message, without the link */
  text: string;
  /** one action: shown as a button in the email and on the WhatsApp message */
  link?: { href: string; label: string };
  /** the WhatsApp template and its variables, in order; absent = email only */
  wa?: { key: WaKey; params: (string | number | null | undefined)[] };
};

/** plain-text email body: the message, then the link on its own line */
const plain = (m: Msg) => `${m.text}${m.link ? `\n\n${m.link.label}: ${m.link.href}` : ''}\n\nDVINE H2O`;

export const templates = {
  orderConfirmed: (o: { number: string; name: string; total: string; link: string }): Msg => ({
    template: 'order_confirmed', subject: `Your DVINE H2O order ${o.number} is confirmed`,
    text: `Hi ${o.name},\n\nThank you. Your order ${o.number} (${o.total}) is confirmed. We'll let you know when it ships.`,
    link: { href: o.link, label: 'View your order' },
    wa: { key: 'order_confirmed', params: [o.name, o.number, o.total] },
  }),
  orderShipped: (o: { number: string; name: string; courier?: string | null; awb?: string | null; link: string }): Msg => ({
    template: 'order_shipped', subject: `Order ${o.number} has shipped`,
    text: `Hi ${o.name},\n\nYour order ${o.number} is on its way${o.courier ? ` with ${o.courier}` : ''}${o.awb ? ` (AWB ${o.awb})` : ''}.`,
    link: { href: o.link, label: 'Track it' },
    wa: { key: 'order_shipped', params: [o.name, o.number, o.courier || 'our courier partner', o.awb || 'on your order page'] },
  }),
  orderDelivered: (o: { number: string; name: string; link: string }): Msg => ({
    template: 'order_delivered', subject: `Order ${o.number} was delivered`,
    text: `Hi ${o.name},\n\nYour order ${o.number} has been delivered. Your invoice and warranty are on your order page.`,
    link: { href: o.link, label: 'View your order' },
    wa: { key: 'order_delivered', params: [o.name, o.number] },
  }),
  orderCancelled: (o: { number: string; name: string }): Msg => ({
    template: 'order_cancelled', subject: `Order ${o.number} was cancelled`,
    text: `Hi ${o.name},\n\nYour order ${o.number} has been cancelled. If you paid, your refund has been started and will reach your original payment method.`,
    wa: { key: 'order_cancelled', params: [o.name, o.number] },
  }),
  enquiryReceived: (e: { ref: string; name: string; what: string }): Msg => ({
    template: 'enquiry_received', subject: `We've received your request (${e.ref})`,
    text: `Hi ${e.name},\n\nThanks for getting in touch about ${e.what}. Your reference is ${e.ref}. Our team will contact you shortly.`,
    wa: { key: 'enquiry_received', params: [e.name, e.what, e.ref] },
  }),
  waterTestBooked: (w: { ref: string; name: string; when: string; link: string }): Msg => ({
    template: 'water_test_booked', subject: `Water test request ${w.ref}`,
    text: `Hi ${w.name},\n\nYour water test request ${w.ref} for ${w.when} has been received. We'll confirm your collection slot shortly.`,
    link: { href: w.link, label: 'View booking' },
    wa: { key: 'water_test_booked', params: [w.name, w.ref, w.when] },
  }),
  /** A: a test DVINE carried out. The lab's PDF is on the booking page. */
  waterReportReady: (w: { ref: string; name: string; link: string }): Msg => ({
    template: 'water_report_ready', subject: `Your water test report ${w.ref} is ready`,
    text: `Hi ${w.name},\n\nThe lab report for your water test ${w.ref} is ready. It lists each parameter tested, the measured result and the reference range.`,
    link: { href: w.link, label: 'Open your report' },
    wa: { key: 'water_report_ready', params: [w.name, w.ref] },
  }),
  /** B: a report the customer uploaded, reviewed by the DVINE team. */
  reportReviewReady: (e: { ref: string; name: string; link: string }): Msg => ({
    template: 'report_review_ready', subject: `We've reviewed your water report (${e.ref})`,
    text: `Hi ${e.name},\n\nOur team has reviewed the water report you shared with us (reference ${e.ref}). Our notes are on the page below.`,
    link: { href: e.link, label: 'Read our review' },
    wa: { key: 'report_review_ready', params: [e.name, e.ref] },
  }),
  paymentLink: (o: { number: string; name: string; total: string; what: string; link: string; until: string }): Msg => ({
    template: 'payment_link', subject: `Your DVINE H2O quote is ready to pay (${o.number})`,
    text: `Hi ${o.name},\n\nAs agreed, here is the secure payment link for ${o.what} (${o.total}, GST included). The link is valid until ${o.until}. Your GST invoice is issued as soon as the payment is confirmed.`,
    link: { href: o.link, label: 'Pay securely' },
    wa: { key: 'payment_link', params: [o.name, o.what, o.total, o.until] },
  }),
  /** to the team inbox (TEAM_ALERT_EMAIL): a customer has raised a service request */
  ticketForTeam: (t: { number: string; name: string; contact: string; issue: string; link: string }): Msg => ({
    template: 'ticket_team_alert', subject: `New service request ${t.number} from ${t.name}`,
    text: `A new service request has come in.\n\n${t.number}\nFrom: ${t.name} (${t.contact})\n\n${t.issue}`,
    link: { href: t.link, label: 'Open it' },
  }),
  ticketOpened: (t: { number: string; name: string }): Msg => ({
    template: 'ticket_opened', subject: `Service request ${t.number}`,
    text: `Hi ${t.name},\n\nWe've logged your service request ${t.number}. A DVINE engineer will be in touch.`,
    wa: { key: 'ticket_opened', params: [t.name, t.number] },
  }),
  referralPending: (r: { name: string; friend: string; reward: string; link: string }): Msg => ({
    template: 'referral_pending', subject: `${r.friend} ordered with your referral code`,
    text: `Hi ${r.name},\n\nGood news: ${r.friend} has just ordered from DVINE H2O with your referral code. Your ${r.reward} reward will be sent to you after their order is delivered.`,
    link: { href: r.link, label: 'View your referrals' },
    wa: { key: 'referral_pending', params: [r.name, r.friend, r.reward] },
  }),
  referralReward: (r: { name: string; code: string; reward: string; until: string; link: string }): Msg => ({
    template: 'referral_reward', subject: `Your ${r.reward} DVINE H2O reward is here`,
    text: `Hi ${r.name},\n\nThank you for referring a friend to DVINE H2O. Your reward code ${r.code} gives you ${r.reward} off your next order and can be used until ${r.until}. Sign in with this account and enter the code in your cart.`,
    link: { href: r.link, label: 'View your rewards' },
    wa: { key: 'referral_reward', params: [r.name, r.code, r.reward, r.until] },
  }),
};

/** Alerts the team inbox, when one is set (TEAM_ALERT_EMAIL, comma-separated for several people). */
export async function notifyTeam(msg: Msg) {
  for (const to of (process.env.TEAM_ALERT_EMAIL ?? '').split(',').map(x => x.trim()).filter(x => /^\S+@\S+\.\S+$/.test(x))) await sendEmail(to, msg).catch(() => {});
}

export async function notify(to: { email?: string | null; phone?: string | null }, msg: Msg) {
  if (to.email) await sendEmail(to.email, msg).catch(() => {});
  if (to.phone && msg.wa) await sendWhatsApp(to.phone, msg).catch(() => {});
}

/* ─────────────── Email ─────────────── */

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** A plain, brand-coloured email that reads well in Gmail, Outlook and phone mail apps. */
function html(m: Msg) {
  const paras = m.text.split(/\n{2,}/).map(p => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const button = m.link ? `<p style="margin:22px 0 6px"><a href="${esc(m.link.href)}" style="display:inline-block;background:#0B2D8C;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${esc(m.link.label)}</a></p><p style="margin:0;font-size:12px;color:#6B7590;word-break:break-all">Or open: ${esc(m.link.href)}</p>` : '';
  return `<!doctype html><html><body style="margin:0;background:#F4F6FB;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#0E1A36;font-size:15px;line-height:1.55">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0B2D8C;padding:18px 28px;color:#ffffff;font-weight:700;letter-spacing:.08em">DVINE H2O</td></tr>
<tr><td style="padding:28px">${paras}${button}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #E6E9F2;font-size:12px;color:#6B7590">DVINE H2O · Bhubaneswar · ${esc(site().replace(/^https?:\/\//, ''))}</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendEmail(to: string, msg: Msg) {
  const body = plain(msg);
  const [row] = await db.insert(notifications).values({ channel: 'email', to, template: msg.template, subject: msg.subject, body }).returning();
  if (!process.env.SMTP_HOST) { await db.update(notifications).set({ status: 'logged' }).where(eq(notifications.id, row.id)); return; }
  try {
    const nodemailer = (await import('nodemailer')).default;
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await t.sendMail({ from: process.env.MAIL_FROM ?? 'DVINE H2O <reachout@dvineh2o.com>', replyTo: process.env.MAIL_REPLY_TO || undefined, to, subject: msg.subject, text: body, html: html(msg) });
    await db.update(notifications).set({ status: 'sent' }).where(eq(notifications.id, row.id));
  } catch (e) {
    await db.update(notifications).set({ status: 'failed', error: String(e) }).where(eq(notifications.id, row.id));
  }
}

/* ─────────────── WhatsApp (Cloud API, approved templates) ─────────────── */

/** The part of a link after the site address, for a template's button (its URL is the site address + {{1}}). */
const linkSuffix = (href: string) => (href.startsWith(site()) ? href.slice(site().length).replace(/^\//, '') : null);

export function whatsappPayload(to: string, msg: Msg) {
  const t = WA_TEMPLATES[msg.wa!.key];
  const components: Record<string, unknown>[] = [{ type: 'body', parameters: msg.wa!.params.map(p => ({ type: 'text', text: waParam(p) })) }];
  const suffix = 'button' in t && msg.link ? linkSuffix(msg.link.href) : null;
  if ('button' in t) components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: suffix ?? '' }] });
  return { messaging_product: 'whatsapp', to, type: 'template', template: { name: t.name, language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' }, components } };
}

async function sendWhatsApp(phone: string, msg: Msg) {
  const digits = phone.replace(/\D/g, '');
  const to = digits.length === 10 ? `91${digits}` : digits;
  const [row] = await db.insert(notifications).values({ channel: 'whatsapp', to, template: msg.wa!.key, subject: msg.subject, body: plain(msg) }).returning();
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) { await db.update(notifications).set({ status: 'logged' }).where(eq(notifications.id, row.id)); return; }
  try {
    const r = await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v21.0'}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(whatsappPayload(to, msg)),
    });
    await db.update(notifications).set(r.ok ? { status: 'sent' } : { status: 'failed', error: (await r.text()).slice(0, 2000) }).where(eq(notifications.id, row.id));
  } catch (e) {
    await db.update(notifications).set({ status: 'failed', error: String(e) }).where(eq(notifications.id, row.id));
  }
}

export const links = {
  order: (number: string, token: string) => `${site()}/order/${number}?t=${token}`,
  pay: (number: string, token: string) => `${site()}/checkout/pay/${number}?t=${token}`,
  waterTest: (ref: string, token: string) => `${site()}/water-testing/booking/${ref}?t=${token}`,
  reportReview: (ref: string, token: string) => `${site()}/water-testing/review/${ref}?t=${token}`,
  referrals: () => `${site()}/account/referrals`,
  referralShare: (code: string) => `${site()}/r/${encodeURIComponent(code)}`,
  account: () => `${site()}/account`,
};
