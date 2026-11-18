import 'server-only';
import { desc, eq, gt, inArray, isNotNull, and } from 'drizzle-orm';
import { db } from './db';
import { enquiries, orders, reviews, serviceTickets } from './db/schema';
import { can } from './session';
import type { StaffSession } from './auth';
import { formOf } from './form-responses';
import { INTEREST_LABEL } from './enquiries';
import { formatINR } from './money';

/** One row in the admin notification bell. `at` is epoch ms. */
export type AdminNote = { id: string; icon: string; title: string; sub: string; href: string; at: number };

/** Cookie holding when this browser last opened the bell (epoch ms). Per device, not a secret. */
export const SEEN_COOKIE = 'dv_admin_seen';

const WINDOW_DAYS = 30;

/** The latest things that came in from the website: form responses, paid orders, service requests, reviews. */
export async function adminNotes(s: Pick<StaffSession, 'role'>, limit = 20): Promise<AdminNote[]> {
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);
  const [es, os, ts, rs] = await Promise.all([
    can(s.role, 'enquiries') ? db.query.enquiries.findMany({ where: gt(enquiries.createdAt, since), orderBy: desc(enquiries.createdAt), limit }) : [],
    can(s.role, 'orders') ? db.query.orders.findMany({ where: and(isNotNull(orders.placedAt), gt(orders.placedAt, since)), orderBy: desc(orders.placedAt), limit: 10 }) : [],
    can(s.role, 'service') ? db.query.serviceTickets.findMany({ where: and(gt(serviceTickets.createdAt, since), inArray(serviceTickets.status, ['open', 'assigned', 'in_progress'])), orderBy: desc(serviceTickets.createdAt), limit: 10 }) : [],
    can(s.role, 'marketing') ? db.query.reviews.findMany({ where: and(eq(reviews.status, 'pending'), gt(reviews.createdAt, since)), orderBy: desc(reviews.createdAt), limit: 10 }) : [],
  ]).catch(() => [[], [], [], []] as const);

  const notes: AdminNote[] = [
    ...es.map(e => {
      const f = formOf(e.type);
      const who = [e.name, e.company, e.productInterest !== 'not_sure' ? INTEREST_LABEL[e.productInterest] : null, e.city].filter(Boolean).join(' · ');
      return { id: `e${e.id}`, icon: f.icon, title: f.one, sub: who, href: `/admin/enquiries/${e.id}`, at: e.createdAt.getTime() };
    }),
    ...os.map(o => ({ id: `o${o.id}`, icon: 'bag', title: `New order ${o.number}`, sub: `${o.contactName} · ${formatINR(o.total)}`, href: `/admin/orders/${o.id}`, at: o.placedAt!.getTime() })),
    ...ts.map(t => ({ id: `t${t.id}`, icon: 'wrench', title: `Service request ${t.number}`, sub: `${t.name} · ${t.issue}`, href: `/admin/service?ticket=${t.id}`, at: t.createdAt.getTime() })),
    ...rs.map(r => ({ id: `r${r.id}`, icon: 'star', title: `Review to approve · ${r.rating}★`, sub: r.title ?? 'New product review', href: '/admin/reviews', at: r.createdAt.getTime() })),
  ];
  return notes.sort((a, b) => b.at - a.at).slice(0, limit);
}
