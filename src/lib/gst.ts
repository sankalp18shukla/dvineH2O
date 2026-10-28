/** GST helpers. Selling prices are GST-inclusive (Indian retail convention). */

/** Split a GST-inclusive amount into taxable value + tax. rateBps 1800 = 18%. */
export function splitInclusive(amount: number, rateBps: number) {
  const taxable = Math.round((amount * 10000) / (10000 + rateBps));
  return { taxable, tax: amount - taxable };
}

/** Indian financial year label for a date, e.g. 2026-27. */
export function fiscalYear(d = new Date()) {
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
}

/** CGST+SGST for intra-state supply, IGST otherwise. */
export function gstSplit(tax: number, sellerState: string, buyerState: string) {
  const intra = !!sellerState && sellerState.trim().toLowerCase() === buyerState.trim().toLowerCase();
  if (intra) { const half = Math.floor(tax / 2); return { cgst: half, sgst: tax - half, igst: 0, intra }; }
  return { cgst: 0, sgst: 0, igst: tax, intra };
}

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];
