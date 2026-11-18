import type { EnquiryType } from './enquiries';

/**
 * How each website form is named in the admin (Form responses tabs, the notification bell).
 * Every form saves into dvine.enquiries with one of these types.
 */
export const FORMS: { type: EnquiryType; tab: string; one: string; from: string; icon: string }[] = [
  { type: 'consultation', tab: 'Titan & business quotes', one: 'Titan / business quote request', from: 'For business page', icon: 'building' },
  { type: 'distributorship', tab: 'Partner applications', one: 'Partner application', from: 'Become a partner page', icon: 'partner' },
  { type: 'demo', tab: 'Demo bookings', one: 'Demo booking', from: 'Book a demo page', icon: 'calendar' },
  { type: 'product', tab: 'Setup checks & questions', one: 'Product question', from: 'Crystal setup check, support', icon: 'chat' },
  { type: 'bulk', tab: 'Bulk & gifting', one: 'Bulk / gifting enquiry', from: 'For business page', icon: 'box' },
  { type: 'water_test', tab: 'Water tests', one: 'Water test booking', from: 'Water testing page', icon: 'drop' },
  { type: 'support', tab: 'Support requests', one: 'Support request', from: 'Support page', icon: 'support' },
  { type: 'chat', tab: 'Chat', one: 'Chat hand-over', from: 'Website chat', icon: 'responses' },
  { type: 'general', tab: 'General', one: 'General enquiry', from: 'Website', icon: 'mail' },
];

export const formOf = (type: string) => FORMS.find(f => f.type === type) ?? FORMS[FORMS.length - 1];
