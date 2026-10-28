/**
 * DVINE H2O transaction database.
 * Follows "DVINE H2O — E-Commerce Database & Dashboard Requirements":
 * one SKU record per product, a single customer record across orders and enquiries,
 * and clean order / payment / inventory / shipping / warranty data.
 *
 * Money is stored as integer paise. Rates are stored in basis points (1800 = 18%).
 */
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

const id = () => integer('id').primaryKey({ autoIncrement: true });
const createdAt = () => integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date());
const updatedAt = () => integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date());
const ts = (name: string) => integer(name, { mode: 'timestamp_ms' });
const json = <T>(name: string) => text(name, { mode: 'json' }).$type<T>();

/* ───────────── Staff (admin dashboard users) ───────────── */
export const staff = sqliteTable('staff', {
  id: id(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'operations', 'support'] }).notNull().default('support'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt: ts('last_login_at'),
  createdAt: createdAt(),
});

/* ───────────── Customers (single profile across orders + enquiries) ───────────── */
export const customers = sqliteTable('customers', {
  id: id(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode'),
  gstin: text('gstin'),
  passwordHash: text('password_hash'), // null for guest-only customers
  consentTermsAt: ts('consent_terms_at'),
  consentPrivacyAt: ts('consent_privacy_at'),
  consentMarketing: integer('consent_marketing', { mode: 'boolean' }).notNull().default(false),
  referralCode: text('referral_code').unique(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, t => [index('customers_email_idx').on(t.email), index('customers_phone_idx').on(t.phone)]);

export type Address = { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string; gstin?: string };

export const addresses = sqliteTable('addresses', {
  id: id(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  type: text('type', { enum: ['shipping', 'billing'] }).notNull().default('shipping'),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  line1: text('line1').notNull(),
  line2: text('line2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  pincode: text('pincode').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
});

/* ───────────── Product master (3 SKUs) ───────────── */
export const products = sqliteTable('products', {
  id: id(),
  sku: text('sku').notNull().unique(),
  slug: text('slug').notNull().unique(),          // hyper | crystal | titan
  name: text('name').notNull(),                   // Hyper Hydrogen Water Bottle
  shortName: text('short_name').notNull(),        // Hyper
  saleMode: text('sale_mode', { enum: ['cart', 'enquiry'] }).notNull().default('cart'),
  status: text('status', { enum: ['active', 'draft', 'archived'] }).notNull().default('active'),
  mrp: integer('mrp').notNull().default(0),
  price: integer('price').notNull().default(0),   // selling price, GST inclusive
  priceConfirmed: integer('price_confirmed', { mode: 'boolean' }).notNull().default(false),
  gstRate: integer('gst_rate').notNull().default(1800),
  hsn: text('hsn'),
  quoteNote: text('quote_note'),                  // Titan: "Price on site assessment"
  onHand: integer('on_hand').notNull().default(0),
  reserved: integer('reserved').notNull().default(0),
  reorderLevel: integer('reorder_level').notNull().default(5),
  buildToOrder: integer('build_to_order', { mode: 'boolean' }).notNull().default(false),
  trackSerials: integer('track_serials', { mode: 'boolean' }).notNull().default(false),
  requiresInstallation: integer('requires_installation', { mode: 'boolean' }).notNull().default(false),
  warrantyMonths: integer('warranty_months').notNull().default(12),
  maxPerOrder: integer('max_per_order').notNull().default(10),
  tagline: text('tagline'),
  description: text('description'),
  specs: json<{ label: string; value: string }[]>('specs'),
  boxContents: json<string[]>('box_contents'),
  images: json<string[]>('images'),
  brochureUrl: text('brochure_url'),
  manualUrl: text('manual_url'),
  videoUrl: text('video_url'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const stockMovements = sqliteTable('stock_movements', {
  id: id(),
  productId: integer('product_id').notNull().references(() => products.id),
  type: text('type', { enum: ['inward', 'sale', 'return', 'adjustment', 'damage', 'reserve', 'release'] }).notNull(),
  qty: integer('qty').notNull(),                 // signed change to on-hand (reserve/release change reserved)
  onHandAfter: integer('on_hand_after'),
  reservedAfter: integer('reserved_after'),
  reference: text('reference'),
  note: text('note'),
  staffId: integer('staff_id').references(() => staff.id),
  createdAt: createdAt(),
}, t => [index('stock_product_idx').on(t.productId)]);

export const serialUnits = sqliteTable('serial_units', {
  id: id(),
  productId: integer('product_id').notNull().references(() => products.id),
  serial: text('serial').notNull().unique(),
  status: text('status', { enum: ['in_stock', 'allocated', 'sold', 'returned', 'damaged'] }).notNull().default('in_stock'),
  orderItemId: integer('order_item_id'),
  createdAt: createdAt(),
});

/* ───────────── Cart → checkout ───────────── */
export const carts = sqliteTable('carts', {
  id: id(),
  token: text('token').notNull().unique(),        // cookie value
  customerId: integer('customer_id').references(() => customers.id),
  status: text('status', { enum: ['active', 'checkout', 'converted', 'abandoned'] }).notNull().default('active'),
  couponCode: text('coupon_code'),
  checkoutStartedAt: ts('checkout_started_at'),
  lastActivityAt: integer('last_activity_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  convertedOrderId: integer('converted_order_id'),
  createdAt: createdAt(),
});

export const cartItems = sqliteTable('cart_items', {
  id: id(),
  cartId: integer('cart_id').notNull().references(() => carts.id),
  productId: integer('product_id').notNull().references(() => products.id),
  qty: integer('qty').notNull(),
  unitPrice: integer('unit_price').notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, t => [uniqueIndex('cart_item_unique').on(t.cartId, t.productId)]);

export const cartEvents = sqliteTable('cart_events', {
  id: id(),
  cartId: integer('cart_id').notNull().references(() => carts.id),
  productId: integer('product_id'),
  action: text('action', { enum: ['add', 'remove', 'update', 'coupon', 'checkout_start'] }).notNull(),
  qty: integer('qty'),
  createdAt: createdAt(),
});

/* ───────────── Orders ───────────── */
export const ORDER_STATUSES = ['pending_payment', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'] as const;
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'] as const;

export const orders = sqliteTable('orders', {
  id: id(),
  number: text('number').notNull().unique(),       // DV-26-000123
  accessToken: text('access_token').notNull(),     // lets a guest view their confirmation
  customerId: integer('customer_id').notNull().references(() => customers.id),
  cartId: integer('cart_id'),
  status: text('status', { enum: ORDER_STATUSES }).notNull().default('pending_payment'),
  paymentStatus: text('payment_status', { enum: PAYMENT_STATUSES }).notNull().default('pending'),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone').notNull(),
  shippingAddress: json<Address>('shipping_address').notNull(),
  billingAddress: json<Address>('billing_address').notNull(),
  deliveryOption: text('delivery_option').notNull().default('standard'),
  subtotal: integer('subtotal').notNull(),        // sum of line totals before discount (GST incl.)
  discount: integer('discount').notNull().default(0),
  shipping: integer('shipping').notNull().default(0),
  taxTotal: integer('tax_total').notNull(),       // GST contained in the total
  total: integer('total').notNull(),
  couponCode: text('coupon_code'),
  referralCode: text('referral_code'),
  customerNote: text('customer_note'),
  internalNote: text('internal_note'),
  placedAt: ts('placed_at'),                      // payment confirmed
  cancelledAt: ts('cancelled_at'),
  cancelReason: text('cancel_reason'),
  cancelledBy: text('cancelled_by'),
  reservationExpiresAt: ts('reservation_expires_at'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, t => [index('orders_customer_idx').on(t.customerId), index('orders_status_idx').on(t.status)]);

export const orderItems = sqliteTable('order_items', {
  id: id(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  sku: text('sku').notNull(),
  name: text('name').notNull(),                  // snapshot
  hsn: text('hsn'),
  qty: integer('qty').notNull(),
  unitPrice: integer('unit_price').notNull(),
  discount: integer('discount').notNull().default(0),
  taxRate: integer('tax_rate').notNull(),
  taxAmount: integer('tax_amount').notNull(),
  lineTotal: integer('line_total').notNull(),     // after discount, GST incl.
  serials: json<string[]>('serials'),
});

export const orderEvents = sqliteTable('order_events', {
  id: id(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  status: text('status').notNull(),
  note: text('note'),
  actor: text('actor'),                           // customer | system | staff:<id>
  createdAt: createdAt(),
});

/* ───────────── Payments, refunds ───────────── */
export const payments = sqliteTable('payments', {
  id: id(),
  purpose: text('purpose', { enum: ['order', 'water_test'] }).notNull().default('order'),
  orderId: integer('order_id').references(() => orders.id),
  waterTestId: integer('water_test_id'),
  gateway: text('gateway', { enum: ['razorpay', 'test'] }).notNull(),
  gatewayOrderId: text('gateway_order_id'),
  gatewayPaymentId: text('gateway_payment_id'),
  amount: integer('amount').notNull(),
  method: text('method'),
  status: text('status', { enum: ['created', 'pending', 'success', 'failed'] }).notNull().default('created'),
  attempt: integer('attempt').notNull().default(1),
  errorCode: text('error_code'),
  errorDescription: text('error_description'),
  failureStage: text('failure_stage'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, t => [index('payments_gw_order_idx').on(t.gatewayOrderId)]);

export const refunds = sqliteTable('refunds', {
  id: id(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  paymentId: integer('payment_id').references(() => payments.id),
  amount: integer('amount').notNull(),
  gatewayRefundId: text('gateway_refund_id'),
  status: text('status', { enum: ['pending', 'processed', 'failed'] }).notNull().default('pending'),
  reason: text('reason'),
  initiatedBy: integer('initiated_by').references(() => staff.id),
  initiatedAt: createdAt(),
  completedAt: ts('completed_at'),
});

/* ───────────── Shipping, cancellations, returns, exceptions ───────────── */
export const shipments = sqliteTable('shipments', {
  id: id(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  provider: text('provider', { enum: ['shiprocket', 'manual'] }).notNull().default('manual'),
  providerOrderId: text('provider_order_id'),
  providerShipmentId: text('provider_shipment_id'),
  courier: text('courier'),
  awb: text('awb'),
  trackingUrl: text('tracking_url'),
  status: text('status', { enum: ['pending', 'in_transit', 'delivered', 'delayed', 'rto', 'exception'] }).notNull().default('pending'),
  dispatchedAt: ts('dispatched_at'),
  expectedAt: ts('expected_at'),
  deliveredAt: ts('delivered_at'),
  events: json<{ at: string; status: string; location?: string }[]>('events'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const returns = sqliteTable('returns', {
  id: id(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  orderItemId: integer('order_item_id').references(() => orderItems.id),
  qty: integer('qty').notNull().default(1),
  reason: text('reason').notNull(),
  status: text('status', { enum: ['requested', 'approved', 'received', 'rejected', 'refunded'] }).notNull().default('requested'),
  note: text('note'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const orderExceptions = sqliteTable('order_exceptions', {
  id: id(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  type: text('type', { enum: ['delivery_failure', 'damaged', 'address_issue', 'other'] }).notNull(),
  note: text('note'),
  status: text('status', { enum: ['open', 'resolved'] }).notNull().default('open'),
  createdAt: createdAt(),
  resolvedAt: ts('resolved_at'),
});

/* ───────────── Invoices (GST) ───────────── */
export const invoices = sqliteTable('invoices', {
  id: id(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  kind: text('kind', { enum: ['invoice', 'credit_note'] }).notNull().default('invoice'),
  number: text('number').notNull().unique(),      // DVH/2026-27/0001
  fy: text('fy').notNull(),
  seq: integer('seq').notNull(),
  refInvoiceId: integer('ref_invoice_id'),
  sellerGstin: text('seller_gstin'),
  buyerGstin: text('buyer_gstin'),
  placeOfSupply: text('place_of_supply').notNull(),
  taxable: integer('taxable').notNull(),
  cgst: integer('cgst').notNull().default(0),
  sgst: integer('sgst').notNull().default(0),
  igst: integer('igst').notNull().default(0),
  total: integer('total').notNull(),
  issuedAt: createdAt(),
}, t => [uniqueIndex('invoice_fy_seq').on(t.kind, t.fy, t.seq)]);

/* ───────────── Referrals ───────────── */
export const referrals = sqliteTable('referrals', {
  id: id(),
  referrerId: integer('referrer_id').notNull().references(() => customers.id),
  referredCustomerId: integer('referred_customer_id').references(() => customers.id),
  orderId: integer('order_id').references(() => orders.id),
  code: text('code').notNull(),
  discount: integer('discount').notNull().default(0),          // what the friend saved
  status: text('status', { enum: ['pending', 'qualified', 'rewarded', 'void'] }).notNull().default('pending'),
  rewardCouponCode: text('reward_coupon_code'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ───────────── Coupons, serviceability ───────────── */
export const coupons = sqliteTable('coupons', {
  id: id(),
  code: text('code').notNull().unique(),
  type: text('type', { enum: ['percent', 'flat'] }).notNull(),
  value: integer('value').notNull(),             // percent (e.g. 10) or paise
  minOrder: integer('min_order').notNull().default(0),
  maxDiscount: integer('max_discount'),
  appliesTo: json<string[]>('applies_to'),       // product slugs; null = all cart products
  startsAt: ts('starts_at'),
  endsAt: ts('ends_at'),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  ownerCustomerId: integer('owner_customer_id'),               // referral reward coupons are personal
  note: text('note'),
  createdAt: createdAt(),
});

export const pincodes = sqliteTable('pincodes', {
  pincode: text('pincode').primaryKey(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  serviceable: integer('serviceable', { mode: 'boolean' }).notNull().default(true),
  installation: integer('installation', { mode: 'boolean' }).notNull().default(true),
  waterTesting: integer('water_testing', { mode: 'boolean' }).notNull().default(false),
  deliveryDays: integer('delivery_days').notNull().default(5),
});

/* ───────────── Enquiries (CRM) ───────────── */
export const ENQUIRY_TYPES = ['product', 'demo', 'water_test', 'consultation', 'distributorship', 'bulk', 'support', 'general', 'chat'] as const;
export const ENQUIRY_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost', 'closed'] as const;
export const INTERESTS = ['hyper', 'crystal', 'titan', 'multiple', 'not_sure'] as const;

export const enquiries = sqliteTable('enquiries', {
  id: id(),
  ref: text('ref').notNull().unique(),           // EQ-26-00042
  customerId: integer('customer_id').references(() => customers.id),
  type: text('type', { enum: ENQUIRY_TYPES }).notNull(),
  productInterest: text('product_interest', { enum: INTERESTS }).notNull().default('not_sure'),
  status: text('status', { enum: ENQUIRY_STATUSES }).notNull().default('new'),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  city: text('city'),
  pincode: text('pincode'),
  message: text('message'),
  data: json<Record<string, unknown>>('data'),  // form-specific fields, chat transcript, etc.
  preferredAt: text('preferred_at'),
  quoteValue: integer('quote_value'),
  quoteStatus: text('quote_status', { enum: ['none', 'draft', 'sent', 'accepted', 'declined'] }).notNull().default('none'),
  outcomeProduct: text('outcome_product'),
  outcomeRef: text('outcome_ref'),               // order number / quote reference
  source: text('source'),                        // page the form was sent from
  assignedTo: integer('assigned_to').references(() => staff.id),
  consent: integer('consent', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, t => [index('enquiries_type_idx').on(t.type), index('enquiries_status_idx').on(t.status)]);

export const enquiryNotes = sqliteTable('enquiry_notes', {
  id: id(),
  enquiryId: integer('enquiry_id').notNull().references(() => enquiries.id),
  staffId: integer('staff_id').references(() => staff.id),
  note: text('note').notNull(),
  createdAt: createdAt(),
});

/* ───────────── Water testing ───────────── */
export const testOptions = sqliteTable('test_options', {
  id: id(),
  name: text('name').notNull(),
  summary: text('summary'),
  parameters: json<string[]>('parameters').notNull(),
  collectionMethod: text('collection_method').notNull(),
  turnaround: text('turnaround').notNull(),
  price: integer('price').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  sort: integer('sort').notNull().default(0),
});

export const waterTests = sqliteTable('water_tests', {
  id: id(),
  ref: text('ref').notNull().unique(),           // WT-26-00012
  accessToken: text('access_token').notNull(),
  customerId: integer('customer_id').references(() => customers.id),
  enquiryId: integer('enquiry_id').references(() => enquiries.id),
  testOptionId: integer('test_option_id').references(() => testOptions.id),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address').notNull(),
  city: text('city').notNull(),
  pincode: text('pincode').notNull(),
  waterSource: text('water_source'),
  sampleType: text('sample_type'),               // source | treated
  preferredDate: text('preferred_date'),
  slot: text('slot'),
  status: text('status', { enum: ['requested', 'confirmed', 'collected', 'report_ready', 'completed', 'cancelled'] }).notNull().default('requested'),
  price: integer('price').notNull().default(0),
  paymentStatus: text('payment_status', { enum: ['not_required', 'pending', 'paid', 'refunded'] }).notNull().default('pending'),
  reportPath: text('report_path'),
  productInterest: text('product_interest', { enum: INTERESTS }),
  recommendedProduct: text('recommended_product'),
  convertedOrderId: integer('converted_order_id'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const reportUploads = sqliteTable('report_uploads', {
  id: id(),
  enquiryId: integer('enquiry_id').references(() => enquiries.id),
  fileName: text('file_name').notNull(),
  storedPath: text('stored_path').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  testDate: text('test_date'),
  createdAt: createdAt(),
});

/* ───────────── Post-purchase: installation, warranty, service, reviews ───────────── */
export const installations = sqliteTable('installations', {
  id: id(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  status: text('status', { enum: ['pending', 'scheduled', 'completed', 'cancelled'] }).notNull().default('pending'),
  scheduledAt: ts('scheduled_at'),
  completedAt: ts('completed_at'),
  technician: text('technician'),
  notes: text('notes'),
  createdAt: createdAt(),
});

export const warranties = sqliteTable('warranties', {
  id: id(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  orderItemId: integer('order_item_id').references(() => orderItems.id),
  productId: integer('product_id').notNull().references(() => products.id),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  serial: text('serial'),
  purchaseDate: ts('purchase_date').notNull(),
  installationDate: ts('installation_date'),
  expiresAt: ts('expires_at').notNull(),
  status: text('status', { enum: ['active', 'expired', 'void'] }).notNull().default('active'),
  createdAt: createdAt(),
});

export const serviceTickets = sqliteTable('service_tickets', {
  id: id(),
  number: text('number').notNull().unique(),      // SR-26-00031
  customerId: integer('customer_id').references(() => customers.id),
  productId: integer('product_id').references(() => products.id),
  warrantyId: integer('warranty_id').references(() => warranties.id),
  orderId: integer('order_id').references(() => orders.id),
  name: text('name'),
  phone: text('phone'),
  email: text('email'),
  issue: text('issue').notNull(),
  priority: text('priority', { enum: ['low', 'normal', 'high', 'urgent'] }).notNull().default('normal'),
  status: text('status', { enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed'] }).notNull().default('open'),
  assignedTo: integer('assigned_to').references(() => staff.id),
  resolvedAt: ts('resolved_at'),
  actionTaken: text('action_taken'),
  partsUsed: text('parts_used'),
  rating: integer('rating'),
  feedback: text('feedback'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const reviews = sqliteTable('reviews', {
  id: id(),
  productId: integer('product_id').notNull().references(() => products.id),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  orderId: integer('order_id').references(() => orders.id),
  rating: integer('rating').notNull(),
  title: text('title'),
  body: text('body').notNull(),
  media: json<string[]>('media'),
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  createdAt: createdAt(),
});

/* ───────────── System ───────────── */
export const auditLogs = sqliteTable('audit_logs', {
  id: id(),
  staffId: integer('staff_id').references(() => staff.id),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  detail: json<Record<string, unknown>>('detail'),
  createdAt: createdAt(),
});

export const notifications = sqliteTable('notifications', {
  id: id(),
  channel: text('channel', { enum: ['email', 'whatsapp'] }).notNull(),
  to: text('to').notNull(),
  template: text('template').notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  status: text('status', { enum: ['queued', 'sent', 'failed', 'logged'] }).notNull().default('queued'),
  error: text('error'),
  createdAt: createdAt(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: json<unknown>('value').notNull(),
});

export const counters = sqliteTable('counters', {
  key: text('key').primaryKey(),                 // e.g. order:26, invoice:2026-27
  value: integer('value').notNull().default(0),
});

/* ───────────── Relations (for relational queries) ───────────── */
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  payments: many(payments),
  shipments: many(shipments),
  invoices: many(invoices),
  events: many(orderEvents),
  refunds: many(refunds),
  returns: many(returns),
  exceptions: many(orderExceptions),
  installations: many(installations),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
export const paymentsRelations = relations(payments, ({ one }) => ({ order: one(orders, { fields: [payments.orderId], references: [orders.id] }) }));
export const shipmentsRelations = relations(shipments, ({ one }) => ({ order: one(orders, { fields: [shipments.orderId], references: [orders.id] }) }));
export const invoicesRelations = relations(invoices, ({ one }) => ({ order: one(orders, { fields: [invoices.orderId], references: [orders.id] }) }));
export const orderEventsRelations = relations(orderEvents, ({ one }) => ({ order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }) }));
export const refundsRelations = relations(refunds, ({ one }) => ({ order: one(orders, { fields: [refunds.orderId], references: [orders.id] }) }));
export const returnsRelations = relations(returns, ({ one }) => ({ order: one(orders, { fields: [returns.orderId], references: [orders.id] }) }));
export const exceptionsRelations = relations(orderExceptions, ({ one }) => ({ order: one(orders, { fields: [orderExceptions.orderId], references: [orders.id] }) }));
export const installationsRelations = relations(installations, ({ one }) => ({ order: one(orders, { fields: [installations.orderId], references: [orders.id] }) }));
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders), enquiries: many(enquiries), addresses: many(addresses), warranties: many(warranties), tickets: many(serviceTickets),
}));
export const addressesRelations = relations(addresses, ({ one }) => ({ customer: one(customers, { fields: [addresses.customerId], references: [customers.id] }) }));
export const enquiriesRelations = relations(enquiries, ({ one, many }) => ({
  customer: one(customers, { fields: [enquiries.customerId], references: [customers.id] }),
  notes: many(enquiryNotes),
  assignee: one(staff, { fields: [enquiries.assignedTo], references: [staff.id] }),
}));
export const enquiryNotesRelations = relations(enquiryNotes, ({ one }) => ({ enquiry: one(enquiries, { fields: [enquiryNotes.enquiryId], references: [enquiries.id] }) }));
export const warrantiesRelations = relations(warranties, ({ one }) => ({
  product: one(products, { fields: [warranties.productId], references: [products.id] }),
  customer: one(customers, { fields: [warranties.customerId], references: [customers.id] }),
  order: one(orders, { fields: [warranties.orderId], references: [orders.id] }),
}));
export const ticketsRelations = relations(serviceTickets, ({ one }) => ({
  customer: one(customers, { fields: [serviceTickets.customerId], references: [customers.id] }),
  product: one(products, { fields: [serviceTickets.productId], references: [products.id] }),
  assignee: one(staff, { fields: [serviceTickets.assignedTo], references: [staff.id] }),
}));
export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  customer: one(customers, { fields: [reviews.customerId], references: [customers.id] }),
}));
export const waterTestsRelations = relations(waterTests, ({ one }) => ({
  option: one(testOptions, { fields: [waterTests.testOptionId], references: [testOptions.id] }),
  customer: one(customers, { fields: [waterTests.customerId], references: [customers.id] }),
}));
export const cartsRelations = relations(carts, ({ many }) => ({ items: many(cartItems) }));
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));
export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, { fields: [stockMovements.productId], references: [products.id] }),
  staff: one(staff, { fields: [stockMovements.staffId], references: [staff.id] }),
}));
export const auditRelations = relations(auditLogs, ({ one }) => ({ staff: one(staff, { fields: [auditLogs.staffId], references: [staff.id] }) }));
export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(customers, { fields: [referrals.referrerId], references: [customers.id] }),
  order: one(orders, { fields: [referrals.orderId], references: [orders.id] }),
}));
