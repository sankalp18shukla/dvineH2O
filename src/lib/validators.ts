import { z } from 'zod';
import { INDIAN_STATES } from './gst';

export const phone = z.string().trim().transform(s => s.replace(/[\s-]/g, '').replace(/^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))/, ''))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'));
export const email = z.string().trim().toLowerCase().email('Enter a valid email address');
export const pincode = z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode');
export const name = z.string().trim().min(2, 'Enter your name').max(80);
export const optional = (s: z.ZodTypeAny) => z.union([z.literal('').transform(() => undefined), s]).optional();
export const gstin = z.string().trim().toUpperCase().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'Enter a valid GSTIN');

export const address = z.object({
  name, phone,
  line1: z.string().trim().min(4, 'Enter your address').max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2, 'Enter your city').max(60),
  state: z.string().refine(s => INDIAN_STATES.includes(s), 'Choose a state'),
  pincode,
  gstin: optional(gstin),
});

/** FormData → plain object (repeated keys become arrays). */
export function formToObject(fd: FormData) {
  const o: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (v instanceof File) continue;
    if (k in o) o[k] = ([] as unknown[]).concat(o[k], v); else o[k] = v;
  }
  return o;
}

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string>; data?: Record<string, unknown> } | undefined;

export function zodErrors(e: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of e.issues) { const k = i.path.join('.'); if (!out[k]) out[k] = i.message; }
  return out;
}
