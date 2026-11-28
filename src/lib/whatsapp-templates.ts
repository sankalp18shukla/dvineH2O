/**
 * Every WhatsApp message the website sends, as a Meta message template.
 *
 * WhatsApp Business only lets a business start a conversation (order confirmed, report ready, reward issued…)
 * with a template that Meta has approved in advance. Free text only works within 24 hours of the customer's own
 * last message, so the site never relies on it.
 *
 * `npm run whatsapp:templates` submits any template below that the WhatsApp account doesn't have yet, and
 * `npm run whatsapp:templates -- --status` lists what Meta has approved. Approval usually takes minutes to a day.
 * Once a template is approved, messages that use it go out with no code change.
 *
 * Rules Meta enforces (keep them when editing): a body can't start or end with a {{n}} variable, two variables
 * can't sit side by side, and variables must be numbered in order. Changing an approved template's wording
 * means submitting it again under a new name (e.g. order_confirmed_v2) and updating `name` here.
 */

export type WaTemplate = {
  /** the template's name in WhatsApp Manager */
  name: string;
  category: 'UTILITY' | 'MARKETING';
  /** body with {{1}}, {{2}}… */
  body: string;
  /** sample values Meta's reviewers see, one per variable */
  example: string[];
  /** an optional "tap to open" button whose link is the site address plus a per-message path */
  button?: { text: string; example: string };
};

const FOOTER = 'DVINE H2O';

export const WA_TEMPLATES = {
  order_confirmed: {
    name: 'order_confirmed', category: 'UTILITY',
    body: 'Hi {{1}}, thank you for shopping with DVINE H2O. Your order {{2}} for {{3}} is confirmed. We will message you again when it ships.',
    example: ['Priya', 'DV-26-000123', '₹14,999'],
    button: { text: 'View order', example: 'order/DV-26-000123?t=sample' },
  },
  order_shipped: {
    name: 'order_shipped', category: 'UTILITY',
    body: 'Hi {{1}}, your DVINE H2O order {{2}} is on its way with {{3}}. Tracking number: {{4}}. You can follow it from your order page.',
    example: ['Priya', 'DV-26-000123', 'Blue Dart', '78901234567'],
    button: { text: 'Track order', example: 'order/DV-26-000123?t=sample' },
  },
  order_delivered: {
    name: 'order_delivered', category: 'UTILITY',
    body: 'Hi {{1}}, your DVINE H2O order {{2}} has been delivered. Your invoice and warranty details are on your order page.',
    example: ['Priya', 'DV-26-000123'],
    button: { text: 'View order', example: 'order/DV-26-000123?t=sample' },
  },
  order_cancelled: {
    name: 'order_cancelled', category: 'UTILITY',
    body: 'Hi {{1}}, your DVINE H2O order {{2}} has been cancelled. If you had paid, your refund has started and will reach your original payment method.',
    example: ['Priya', 'DV-26-000123'],
  },
  payment_link: {
    name: 'payment_link', category: 'UTILITY',
    body: 'Hi {{1}}, as agreed, here is the secure payment link for {{2}} ({{3}}, GST included). The link is valid until {{4}}, and your GST invoice is sent as soon as you pay.',
    example: ['Rahul', 'TitanForce 111', '₹2,45,000', '28 Nov 2026'],
    button: { text: 'Pay securely', example: 'checkout/pay/DV-26-000124?t=sample' },
  },
  enquiry_received: {
    name: 'enquiry_received', category: 'UTILITY',
    body: 'Hi {{1}}, thank you for contacting DVINE H2O about {{2}}. Your reference is {{3}}. Our team will get in touch with you shortly.',
    example: ['Priya', 'a water test', 'EQ-26-00042'],
  },
  water_test_booked: {
    name: 'water_test_booked', category: 'UTILITY',
    body: 'Hi {{1}}, your water test request {{2}} for {{3}} has been received. We will confirm your collection slot shortly.',
    example: ['Priya', 'WT-26-00007', '28 Nov 2026, Morning'],
    button: { text: 'View booking', example: 'water-testing/booking/WT-26-00007?t=sample' },
  },
  water_report_ready: {
    name: 'water_report_ready', category: 'UTILITY',
    body: 'Hi {{1}}, the lab report for your DVINE H2O water test {{2}} is ready. Tap below to open it.',
    example: ['Priya', 'WT-26-00007'],
    button: { text: 'Open report', example: 'water-testing/booking/WT-26-00007?t=sample' },
  },
  report_review_ready: {
    name: 'report_review_ready', category: 'UTILITY',
    body: 'Hi {{1}}, our team has reviewed the water report you shared with us (reference {{2}}). Tap below to read our notes.',
    example: ['Priya', 'EQ-26-00042'],
    button: { text: 'Read review', example: 'water-testing/review/EQ-26-00042?t=sample' },
  },
  ticket_opened: {
    name: 'service_request_opened', category: 'UTILITY',
    body: 'Hi {{1}}, we have logged your DVINE H2O service request {{2}}. A DVINE engineer will contact you soon.',
    example: ['Priya', 'SR-26-00003'],
  },
  referral_pending: {
    name: 'referral_order_placed', category: 'UTILITY',
    body: 'Hi {{1}}, {{2}} has just ordered from DVINE H2O with your referral code. Your {{3}} reward will be sent to you after their order is delivered.',
    example: ['Anita', 'Priya', '₹1,000'],
    button: { text: 'View my referrals', example: 'account/referrals' },
  },
  referral_reward: {
    name: 'referral_reward_issued', category: 'UTILITY',
    body: 'Hi {{1}}, thank you for referring a friend to DVINE H2O. Your reward code {{2}} gives you {{3}} off your next order and can be used until {{4}} while signed in to your account.',
    example: ['Anita', 'THANKS-7K2Q9A', '₹1,000', '21 May 2027'],
    button: { text: 'View my rewards', example: 'account/referrals' },
  },
} satisfies Record<string, WaTemplate>;

export type WaKey = keyof typeof WA_TEMPLATES;

export const WA_FOOTER = FOOTER;

/** Meta rejects variables with line breaks, tabs or long runs of spaces. */
export const waParam = (v: string | number | null | undefined) =>
  String(v ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {4,}/g, '   ').trim().slice(0, 300) || '-';
