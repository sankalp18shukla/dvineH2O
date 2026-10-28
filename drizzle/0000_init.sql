CREATE TABLE `addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`type` text DEFAULT 'shipping' NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`line1` text NOT NULL,
	`line2` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`pincode` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_id` integer,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`detail` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cart_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cart_id` integer NOT NULL,
	`product_id` integer,
	`action` text NOT NULL,
	`qty` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cart_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`qty` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cart_item_unique` ON `cart_items` (`cart_id`,`product_id`);--> statement-breakpoint
CREATE TABLE `carts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`customer_id` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`coupon_code` text,
	`checkout_started_at` integer,
	`last_activity_at` integer NOT NULL,
	`converted_order_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `carts_token_unique` ON `carts` (`token`);--> statement-breakpoint
CREATE TABLE `counters` (
	`key` text PRIMARY KEY NOT NULL,
	`value` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`type` text NOT NULL,
	`value` integer NOT NULL,
	`min_order` integer DEFAULT 0 NOT NULL,
	`max_discount` integer,
	`applies_to` text,
	`starts_at` integer,
	`ends_at` integer,
	`usage_limit` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`owner_customer_id` integer,
	`note` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`city` text,
	`state` text,
	`pincode` text,
	`gstin` text,
	`password_hash` text,
	`consent_terms_at` integer,
	`consent_privacy_at` integer,
	`consent_marketing` integer DEFAULT false NOT NULL,
	`referral_code` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_referral_code_unique` ON `customers` (`referral_code`);--> statement-breakpoint
CREATE INDEX `customers_email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `customers_phone_idx` ON `customers` (`phone`);--> statement-breakpoint
CREATE TABLE `enquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ref` text NOT NULL,
	`customer_id` integer,
	`type` text NOT NULL,
	`product_interest` text DEFAULT 'not_sure' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`company` text,
	`city` text,
	`pincode` text,
	`message` text,
	`data` text,
	`preferred_at` text,
	`quote_value` integer,
	`quote_status` text DEFAULT 'none' NOT NULL,
	`outcome_product` text,
	`outcome_ref` text,
	`source` text,
	`assigned_to` integer,
	`consent` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enquiries_ref_unique` ON `enquiries` (`ref`);--> statement-breakpoint
CREATE INDEX `enquiries_type_idx` ON `enquiries` (`type`);--> statement-breakpoint
CREATE INDEX `enquiries_status_idx` ON `enquiries` (`status`);--> statement-breakpoint
CREATE TABLE `enquiry_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enquiry_id` integer NOT NULL,
	`staff_id` integer,
	`note` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `installations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`scheduled_at` integer,
	`completed_at` integer,
	`technician` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`kind` text DEFAULT 'invoice' NOT NULL,
	`number` text NOT NULL,
	`fy` text NOT NULL,
	`seq` integer NOT NULL,
	`ref_invoice_id` integer,
	`seller_gstin` text,
	`buyer_gstin` text,
	`place_of_supply` text NOT NULL,
	`taxable` integer NOT NULL,
	`cgst` integer DEFAULT 0 NOT NULL,
	`sgst` integer DEFAULT 0 NOT NULL,
	`igst` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_number_unique` ON `invoices` (`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_fy_seq` ON `invoices` (`kind`,`fy`,`seq`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`channel` text NOT NULL,
	`to` text NOT NULL,
	`template` text NOT NULL,
	`subject` text,
	`body` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`error` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`actor` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order_exceptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`type` text NOT NULL,
	`note` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`hsn` text,
	`qty` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`tax_rate` integer NOT NULL,
	`tax_amount` integer NOT NULL,
	`line_total` integer NOT NULL,
	`serials` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` text NOT NULL,
	`access_token` text NOT NULL,
	`customer_id` integer NOT NULL,
	`cart_id` integer,
	`status` text DEFAULT 'pending_payment' NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`contact_name` text NOT NULL,
	`contact_email` text NOT NULL,
	`contact_phone` text NOT NULL,
	`shipping_address` text NOT NULL,
	`billing_address` text NOT NULL,
	`delivery_option` text DEFAULT 'standard' NOT NULL,
	`subtotal` integer NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`shipping` integer DEFAULT 0 NOT NULL,
	`tax_total` integer NOT NULL,
	`total` integer NOT NULL,
	`coupon_code` text,
	`referral_code` text,
	`customer_note` text,
	`internal_note` text,
	`placed_at` integer,
	`cancelled_at` integer,
	`cancel_reason` text,
	`cancelled_by` text,
	`reservation_expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_number_unique` ON `orders` (`number`);--> statement-breakpoint
CREATE INDEX `orders_customer_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purpose` text DEFAULT 'order' NOT NULL,
	`order_id` integer,
	`water_test_id` integer,
	`gateway` text NOT NULL,
	`gateway_order_id` text,
	`gateway_payment_id` text,
	`amount` integer NOT NULL,
	`method` text,
	`status` text DEFAULT 'created' NOT NULL,
	`attempt` integer DEFAULT 1 NOT NULL,
	`error_code` text,
	`error_description` text,
	`failure_stage` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payments_gw_order_idx` ON `payments` (`gateway_order_id`);--> statement-breakpoint
CREATE TABLE `pincodes` (
	`pincode` text PRIMARY KEY NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`serviceable` integer DEFAULT true NOT NULL,
	`installation` integer DEFAULT true NOT NULL,
	`water_testing` integer DEFAULT false NOT NULL,
	`delivery_days` integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sku` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`sale_mode` text DEFAULT 'cart' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`mrp` integer DEFAULT 0 NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`price_confirmed` integer DEFAULT false NOT NULL,
	`gst_rate` integer DEFAULT 1800 NOT NULL,
	`hsn` text,
	`quote_note` text,
	`on_hand` integer DEFAULT 0 NOT NULL,
	`reserved` integer DEFAULT 0 NOT NULL,
	`reorder_level` integer DEFAULT 5 NOT NULL,
	`build_to_order` integer DEFAULT false NOT NULL,
	`track_serials` integer DEFAULT false NOT NULL,
	`requires_installation` integer DEFAULT false NOT NULL,
	`warranty_months` integer DEFAULT 12 NOT NULL,
	`max_per_order` integer DEFAULT 10 NOT NULL,
	`tagline` text,
	`description` text,
	`specs` text,
	`box_contents` text,
	`images` text,
	`brochure_url` text,
	`manual_url` text,
	`video_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`referrer_id` integer NOT NULL,
	`referred_customer_id` integer,
	`order_id` integer,
	`code` text NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reward_coupon_code` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`referrer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referred_customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`payment_id` integer,
	`amount` integer NOT NULL,
	`gateway_refund_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reason` text,
	`initiated_by` integer,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`initiated_by`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `report_uploads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enquiry_id` integer,
	`file_name` text NOT NULL,
	`stored_path` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`test_date` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `returns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`order_item_id` integer,
	`qty` integer DEFAULT 1 NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`order_id` integer,
	`rating` integer NOT NULL,
	`title` text,
	`body` text NOT NULL,
	`media` text,
	`verified` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `serial_units` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`serial` text NOT NULL,
	`status` text DEFAULT 'in_stock' NOT NULL,
	`order_item_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `serial_units_serial_unique` ON `serial_units` (`serial`);--> statement-breakpoint
CREATE TABLE `service_tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` text NOT NULL,
	`customer_id` integer,
	`product_id` integer,
	`warranty_id` integer,
	`order_id` integer,
	`name` text,
	`phone` text,
	`email` text,
	`issue` text NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`assigned_to` integer,
	`resolved_at` integer,
	`action_taken` text,
	`parts_used` text,
	`rating` integer,
	`feedback` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warranty_id`) REFERENCES `warranties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_tickets_number_unique` ON `service_tickets` (`number`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`provider` text DEFAULT 'manual' NOT NULL,
	`provider_order_id` text,
	`provider_shipment_id` text,
	`courier` text,
	`awb` text,
	`tracking_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`dispatched_at` integer,
	`expected_at` integer,
	`delivered_at` integer,
	`events` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'support' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_email_unique` ON `staff` (`email`);--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`type` text NOT NULL,
	`qty` integer NOT NULL,
	`on_hand_after` integer,
	`reserved_after` integer,
	`reference` text,
	`note` text,
	`staff_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_product_idx` ON `stock_movements` (`product_id`);--> statement-breakpoint
CREATE TABLE `test_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`summary` text,
	`parameters` text NOT NULL,
	`collection_method` text NOT NULL,
	`turnaround` text NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `warranties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`order_item_id` integer,
	`product_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`serial` text,
	`purchase_date` integer NOT NULL,
	`installation_date` integer,
	`expires_at` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `water_tests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ref` text NOT NULL,
	`access_token` text NOT NULL,
	`customer_id` integer,
	`enquiry_id` integer,
	`test_option_id` integer,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`pincode` text NOT NULL,
	`water_source` text,
	`sample_type` text,
	`preferred_date` text,
	`slot` text,
	`status` text DEFAULT 'requested' NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`report_path` text,
	`product_interest` text,
	`recommended_product` text,
	`converted_order_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`test_option_id`) REFERENCES `test_options`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `water_tests_ref_unique` ON `water_tests` (`ref`);