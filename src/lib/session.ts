/**
 * Staff roles and what each may do in the admin dashboard. Edge-safe (no server imports).
 * Sessions themselves are Supabase Auth sessions (see src/lib/auth.ts and src/middleware.ts).
 * A role is stored only in dvine.staff — never in Supabase user_metadata, which users can edit.
 */
export type StaffRole = 'admin' | 'operations' | 'support';

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
  content: ['admin', 'operations'],
  reports: ['admin', 'operations'],
  audit: ['admin'],
  settings: ['admin'],
} satisfies Record<string, StaffRole[]>;
export type Permission = keyof typeof PERMISSIONS;
export const can = (role: StaffRole, p: Permission) => (PERMISSIONS[p] as StaffRole[]).includes(role);
