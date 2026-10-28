/** Money helpers. All amounts are integer paise. */
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Whole rupees when the amount is whole; paise are shown whenever they exist, so totals always add up on screen. */
export const formatINR = (paise: number, exact = false) => ((exact || Math.round(paise || 0) % 100 !== 0) ? inr2 : inr).format((paise || 0) / 100);
export const toPaise = (rupees: number | string) => Math.round(Number(rupees) * 100);
export const toRupees = (paise: number) => (paise || 0) / 100;
