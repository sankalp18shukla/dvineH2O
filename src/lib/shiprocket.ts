/** Shiprocket integration: push order, assign AWB, track. Falls back to manual shipments when not configured. */
type Order = {
  number: string; createdAt: Date; contactName: string; contactEmail: string; contactPhone: string;
  shippingAddress: { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string };
  total: number; discount: number; shipping: number;
  items: { name: string; sku: string; qty: number; unitPrice: number; hsn: string | null; taxRate: number }[];
};

export const shiprocketEnabled = () => !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
const BASE = 'https://apiv2.shiprocket.in/v1/external';
let cached: { token: string; at: number } | null = null;

async function token() {
  if (cached && Date.now() - cached.at < 1000 * 60 * 60 * 24 * 8) return cached.token; // tokens last 10 days
  const r = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }) });
  const b = await r.json(); if (!r.ok || !b.token) throw new Error(b.message ?? 'Shiprocket login failed');
  cached = { token: b.token, at: Date.now() }; return b.token as string;
}
async function sr<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { ...init, headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }, cache: 'no-store' });
  const b = await r.json(); if (!r.ok) throw new Error(b.message ?? `Shiprocket error ${r.status}`);
  return b as T;
}

export async function pushOrder(o: Order, dims: { length: number; breadth: number; height: number; weight: number }) {
  const a = o.shippingAddress;
  const res = await sr<{ order_id: number; shipment_id: number }>('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify({
      order_id: o.number, order_date: o.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION ?? 'Primary',
      billing_customer_name: a.name, billing_last_name: '', billing_address: a.line1, billing_address_2: a.line2 ?? '',
      billing_city: a.city, billing_pincode: a.pincode, billing_state: a.state, billing_country: 'India',
      billing_email: o.contactEmail, billing_phone: a.phone, shipping_is_billing: true,
      order_items: o.items.map(i => ({ name: i.name, sku: i.sku, units: i.qty, selling_price: (i.unitPrice / 100).toFixed(2), hsn: i.hsn ?? '', tax: i.taxRate / 100 })),
      payment_method: 'Prepaid', shipping_charges: o.shipping / 100, total_discount: o.discount / 100, sub_total: o.total / 100,
      length: dims.length, breadth: dims.breadth, height: dims.height, weight: dims.weight,
    }),
  });
  return res;
}

export async function assignAwb(shipmentId: string) {
  const r = await sr<{ response?: { data?: { awb_code?: string; courier_name?: string } } }>('/courier/assign/awb', { method: 'POST', body: JSON.stringify({ shipment_id: shipmentId }) });
  return { awb: r.response?.data?.awb_code ?? null, courier: r.response?.data?.courier_name ?? null };
}

export async function trackAwb(awb: string) {
  const r = await sr<{ tracking_data?: { shipment_status?: number; shipment_track_activities?: { date: string; activity: string; location: string }[]; track_url?: string } }>(`/courier/track/awb/${awb}`);
  return r.tracking_data;
}

export const trackingUrl = (awb: string) => `https://shiprocket.co/tracking/${awb}`;

/** Shiprocket status text → our shipment status. */
export function mapStatus(s: string): 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'rto' | 'exception' {
  const v = s.toLowerCase();
  if (v.includes('deliver') && !v.includes('undeliver') && !v.includes('out for')) return 'delivered';
  if (v.includes('rto')) return 'rto';
  if (v.includes('undeliver') || v.includes('lost') || v.includes('damage') || v.includes('cancel')) return 'exception';
  if (v.includes('delay')) return 'delayed';
  if (v.includes('pick') || v.includes('transit') || v.includes('shipped') || v.includes('out for')) return 'in_transit';
  return 'pending';
}
