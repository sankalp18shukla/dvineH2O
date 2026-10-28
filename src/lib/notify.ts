/**
 * Outbound messages. Every message is written to the notifications table (Admin › Notifications).
 * Email is sent when SMTP_* is configured; WhatsApp when WHATSAPP_TOKEN/PHONE_ID are set.
 * Otherwise the message is stored with status "logged" so nothing is lost before go-live.
 */
import { eq } from 'drizzle-orm';
import { db } from './db';
import { notifications } from './db/schema';

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

type Msg = { template: string; subject: string; text: string };
export const templates = {
  orderConfirmed: (o: { number: string; name: string; total: string; link: string }): Msg => ({
    template: 'order_confirmed', subject: `Your DVINE H2O order ${o.number} is confirmed`,
    text: `Hi ${o.name},\n\nThank you. Your order ${o.number} (${o.total}) is confirmed. We'll let you know when it ships.\n\nView your order: ${o.link}\n\nDVINE H2O`,
  }),
  orderShipped: (o: { number: string; name: string; courier?: string | null; awb?: string | null; link: string }): Msg => ({
    template: 'order_shipped', subject: `Order ${o.number} has shipped`,
    text: `Hi ${o.name},\n\nYour order ${o.number} is on its way${o.courier ? ` with ${o.courier}` : ''}${o.awb ? ` (AWB ${o.awb})` : ''}.\n\nTrack it: ${o.link}\n\nDVINE H2O`,
  }),
  orderDelivered: (o: { number: string; name: string; link: string }): Msg => ({
    template: 'order_delivered', subject: `Order ${o.number} was delivered`,
    text: `Hi ${o.name},\n\nYour order ${o.number} has been delivered. Your invoice and warranty are in your account: ${o.link}\n\nDVINE H2O`,
  }),
  orderCancelled: (o: { number: string; name: string }): Msg => ({
    template: 'order_cancelled', subject: `Order ${o.number} was cancelled`,
    text: `Hi ${o.name},\n\nYour order ${o.number} has been cancelled. If you paid, your refund has been started and will reach your original payment method.\n\nDVINE H2O`,
  }),
  enquiryReceived: (e: { ref: string; name: string; what: string }): Msg => ({
    template: 'enquiry_received', subject: `We've received your request (${e.ref})`,
    text: `Hi ${e.name},\n\nThanks for getting in touch about ${e.what}. Your reference is ${e.ref}. Our team will contact you shortly.\n\nDVINE H2O`,
  }),
  waterTestBooked: (w: { ref: string; name: string; when: string; link: string }): Msg => ({
    template: 'water_test_booked', subject: `Water test request ${w.ref}`,
    text: `Hi ${w.name},\n\nYour water test request ${w.ref} for ${w.when} has been received. We'll confirm your collection slot shortly.\n\nView booking: ${w.link}\n\nDVINE H2O`,
  }),
  ticketOpened: (t: { number: string; name: string }): Msg => ({
    template: 'ticket_opened', subject: `Service request ${t.number}`,
    text: `Hi ${t.name},\n\nWe've logged your service request ${t.number}. A DVINE engineer will be in touch.\n\nDVINE H2O`,
  }),
};

export async function notify(to: { email?: string | null; phone?: string | null }, msg: Msg) {
  if (to.email) await sendEmail(to.email, msg).catch(() => {});
  if (to.phone) await sendWhatsApp(to.phone, msg).catch(() => {});
}

async function sendEmail(to: string, msg: Msg) {
  const [row] = await db.insert(notifications).values({ channel: 'email', to, template: msg.template, subject: msg.subject, body: msg.text }).returning();
  if (!process.env.SMTP_HOST) { await db.update(notifications).set({ status: 'logged' }).where(eq(notifications.id, row.id)); return; }
  try {
    const nodemailer = (await import('nodemailer')).default;
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await t.sendMail({ from: process.env.MAIL_FROM ?? 'DVINE H2O <care@dvineh2o.com>', to, subject: msg.subject, text: msg.text });
    await db.update(notifications).set({ status: 'sent' }).where(eq(notifications.id, row.id));
  } catch (e) {
    await db.update(notifications).set({ status: 'failed', error: String(e) }).where(eq(notifications.id, row.id));
  }
}

async function sendWhatsApp(phone: string, msg: Msg) {
  const to = phone.startsWith('91') ? phone : `91${phone}`;
  const [row] = await db.insert(notifications).values({ channel: 'whatsapp', to, template: msg.template, subject: msg.subject, body: msg.text }).returning();
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) { await db.update(notifications).set({ status: 'logged' }).where(eq(notifications.id, row.id)); return; }
  try {
    // Plain text works inside the 24h service window; outside it Meta requires approved templates (configure per template name).
    const r = await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: msg.text } }),
    });
    await db.update(notifications).set(r.ok ? { status: 'sent' } : { status: 'failed', error: await r.text() }).where(eq(notifications.id, row.id));
  } catch (e) {
    await db.update(notifications).set({ status: 'failed', error: String(e) }).where(eq(notifications.id, row.id));
  }
}

export const links = {
  order: (number: string, token: string) => `${site()}/order/${number}?t=${token}`,
  waterTest: (ref: string, token: string) => `${site()}/water-testing/booking/${ref}?t=${token}`,
  account: () => `${site()}/account`,
};
