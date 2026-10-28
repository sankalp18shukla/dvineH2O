import type { Metadata } from 'next';
import { inArray, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { enquiries, orders, reviews, serviceTickets, returns } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { can, type Permission } from '@/lib/session';
import { logoutStaff } from '@/app/actions/auth';
import { Sidebar, type NavItem } from '@/components/admin/Sidebar';
import { Toaster } from '@/components/admin/AdminForm';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · DVINE Admin' }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireStaff();
  const [toShip, newEnq, openTickets, pendingReviews, openReturns] = await Promise.all([
    db.$count(orders, inArray(orders.status, ['confirmed', 'processing'])),
    db.$count(enquiries, eq(enquiries.status, 'new')),
    db.$count(serviceTickets, inArray(serviceTickets.status, ['open'])),
    db.$count(reviews, eq(reviews.status, 'pending')),
    db.$count(returns, eq(returns.status, 'requested')),
  ]);
  const all: (NavItem & { p: Permission })[] = [
    { href: '/admin', label: 'Overview', icon: 'dashboard', p: 'overview' },
    { href: '/admin/orders', label: 'Orders', icon: 'box', p: 'orders', badge: toShip + openReturns },
    { href: '/admin/products', label: 'Products', icon: 'tag', p: 'products' },
    { href: '/admin/inventory', label: 'Inventory', icon: 'inbox', p: 'inventory' },
    { href: '/admin/customers', label: 'Customers', icon: 'users', p: 'customers' },
    { href: '/admin/enquiries', label: 'Enquiries & CRM', icon: 'chat', p: 'enquiries', badge: newEnq },
    { href: '/admin/water-tests', label: 'Water tests', icon: 'drop', p: 'enquiries' },
    { href: '/admin/payments', label: 'Payments & refunds', icon: 'card', p: 'payments' },
    { href: '/admin/service', label: 'Warranty & service', icon: 'wrench', p: 'service', badge: openTickets },
    { href: '/admin/reviews', label: 'Reviews', icon: 'star', p: 'marketing', badge: pendingReviews },
    { href: '/admin/marketing', label: 'Coupons & referrals', icon: 'gift', p: 'marketing' },
    { href: '/admin/reports', label: 'Reports & export', icon: 'chart', p: 'reports' },
    { href: '/admin/notifications', label: 'Notifications', icon: 'bell', p: 'settings' },
    { href: '/admin/audit', label: 'Audit log', icon: 'history', p: 'audit' },
    { href: '/admin/settings', label: 'Settings', icon: 'settings', p: 'settings' },
  ];
  const items = all.filter(i => can(s.role, i.p)).map(({ p: _p, ...i }) => i);
  return (
    <div className="min-h-screen bg-[#F3F5FA] lg:flex">
      <Sidebar items={items} staff={{ name: s.name, role: s.role }} logout={logoutStaff} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      <Toaster />
    </div>
  );
}
