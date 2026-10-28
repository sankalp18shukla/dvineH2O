const TONE: Record<string, string> = {
  // order
  pending_payment: 'bg-[#FFF4D6] text-[#7A4B00]', confirmed: 'bg-[#E3EEFF] text-[#0B3FA8]', processing: 'bg-[#E3EEFF] text-[#0B3FA8]',
  packed: 'bg-[#E8E4FF] text-[#3A1DB3]', shipped: 'bg-[#DDF7F4] text-[#055E55]', delivered: 'bg-[#DFF5E3] text-[#1B6B2C]',
  cancelled: 'bg-[#F1F2F5] text-[#505A70]', returned: 'bg-[#FFE6EE] text-[#9C0A3F]',
  // payment
  pending: 'bg-[#FFF4D6] text-[#7A4B00]', paid: 'bg-[#DFF5E3] text-[#1B6B2C]', success: 'bg-[#DFF5E3] text-[#1B6B2C]', failed: 'bg-[#FFE3E3] text-[#A1101B]',
  refunded: 'bg-[#F1F2F5] text-[#505A70]', partially_refunded: 'bg-[#FFF4D6] text-[#7A4B00]', created: 'bg-[#F1F2F5] text-[#505A70]', processed: 'bg-[#DFF5E3] text-[#1B6B2C]',
  // crm / service
  new: 'bg-[#FFE6EE] text-[#9C0A3F]', contacted: 'bg-[#E3EEFF] text-[#0B3FA8]', qualified: 'bg-[#E8E4FF] text-[#3A1DB3]', converted: 'bg-[#DFF5E3] text-[#1B6B2C]',
  lost: 'bg-[#F1F2F5] text-[#505A70]', closed: 'bg-[#F1F2F5] text-[#505A70]', open: 'bg-[#FFE6EE] text-[#9C0A3F]', assigned: 'bg-[#E3EEFF] text-[#0B3FA8]',
  in_progress: 'bg-[#E8E4FF] text-[#3A1DB3]', resolved: 'bg-[#DFF5E3] text-[#1B6B2C]', requested: 'bg-[#FFE6EE] text-[#9C0A3F]', collected: 'bg-[#E8E4FF] text-[#3A1DB3]',
  report_ready: 'bg-[#DDF7F4] text-[#055E55]', completed: 'bg-[#DFF5E3] text-[#1B6B2C]', scheduled: 'bg-[#E3EEFF] text-[#0B3FA8]', active: 'bg-[#DFF5E3] text-[#1B6B2C]',
  expired: 'bg-[#F1F2F5] text-[#505A70]', void: 'bg-[#F1F2F5] text-[#505A70]', approved: 'bg-[#DFF5E3] text-[#1B6B2C]', rejected: 'bg-[#F1F2F5] text-[#505A70]',
  in_transit: 'bg-[#DDF7F4] text-[#055E55]', delayed: 'bg-[#FFF4D6] text-[#7A4B00]', rto: 'bg-[#FFE3E3] text-[#A1101B]', exception: 'bg-[#FFE3E3] text-[#A1101B]',
  low_stock: 'bg-[#FFF4D6] text-[#7A4B00]', out_of_stock: 'bg-[#FFE3E3] text-[#A1101B]', in_stock: 'bg-[#DFF5E3] text-[#1B6B2C]', build_to_order: 'bg-[#E3EEFF] text-[#0B3FA8]',
  not_required: 'bg-[#F1F2F5] text-[#505A70]', received: 'bg-[#E8E4FF] text-[#3A1DB3]', rewarded: 'bg-[#DFF5E3] text-[#1B6B2C]', qualified_ref: 'bg-[#E3EEFF] text-[#0B3FA8]',
  logged: 'bg-[#F1F2F5] text-[#505A70]', sent: 'bg-[#DFF5E3] text-[#1B6B2C]', queued: 'bg-[#FFF4D6] text-[#7A4B00]', draft: 'bg-[#F1F2F5] text-[#505A70]',
  accepted: 'bg-[#DFF5E3] text-[#1B6B2C]', declined: 'bg-[#F1F2F5] text-[#505A70]', none: 'bg-[#F1F2F5] text-[#505A70]',
};

export const humanize = (s: string) => ({ pending_payment: 'Pending payment', partially_refunded: 'Partly refunded', report_ready: 'Report ready', in_progress: 'In progress', in_transit: 'In transit', rto: 'Return to origin', low_stock: 'Low stock', out_of_stock: 'Out of stock', in_stock: 'In stock', build_to_order: 'Build to order', not_required: 'No payment' } as Record<string, string>)[s] ?? (s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '));

export function Status({ value, label }: { value: string; label?: string }) {
  return <span className={`badge ${TONE[value] ?? 'bg-[#F1F2F5] text-[#505A70]'}`}>{label ?? humanize(value)}</span>;
}
