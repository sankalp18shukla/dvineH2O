/** Signed session cookie (JWT). Edge-safe: used by middleware and server code. */
import { SignJWT, jwtVerify } from 'jose';

export type Session =
  | { kind: 'customer'; sub: number; name: string }
  | { kind: 'staff'; sub: number; name: string; role: StaffRole };
export type StaffRole = 'admin' | 'operations' | 'support';

export const CUSTOMER_COOKIE = 'dvine_session';
export const STAFF_COOKIE = 'dvine_staff';

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET must be set (min 16 chars)');
    return new TextEncoder().encode('dev-only-insecure-secret-change-me');
  }
  return new TextEncoder().encode(s);
};

export async function signSession(s: Session, days = 30) {
  return new SignJWT({ ...s, sub: String(s.sub) } as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${days}d`).sign(secret());
}

export async function readSession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { ...(payload as Record<string, unknown>), sub: Number(payload.sub) } as Session;
  } catch { return null; }
}

/** Role permissions for the admin dashboard. */
export const PERMISSIONS = {
  overview: ['admin', 'operations', 'support'],
  orders: ['admin', 'operations', 'support'],
  ordersWrite: ['admin', 'operations'],
  products: ['admin', 'operations'],
  inventory: ['admin', 'operations'],
  customers: ['admin', 'operations', 'support'],
  enquiries: ['admin', 'operations', 'support'],
  payments: ['admin', 'operations'],
  refunds: ['admin'],
  service: ['admin', 'operations', 'support'],
  marketing: ['admin'],
  reports: ['admin', 'operations'],
  audit: ['admin'],
  settings: ['admin'],
} satisfies Record<string, StaffRole[]>;
export type Permission = keyof typeof PERMISSIONS;
export const can = (role: StaffRole, p: Permission) => (PERMISSIONS[p] as StaffRole[]).includes(role);
