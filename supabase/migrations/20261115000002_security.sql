-- ════════════════════════════════════════════════════════════════════════════
-- DVINE H2O · database security
--
-- Layers, outermost first:
--   1. `dvine` is not an exposed API schema → no PostgREST / GraphQL access at all.
--   2. anon, authenticated and service_role have no privileges on it (explicitly revoked).
--   3. Row Level Security is enabled on every table; only `dvine_app` has policies.
--   4. `dvine_app` (the role the website connects as) gets the minimum DML it needs:
--        · no TRUNCATE, no DDL, no access to the auth or storage schemas
--        · DELETE only where the app genuinely deletes (cart lines, addresses, drafts, rate limits)
--        · ledger tables are append-only: audit log, invoices / credit notes, order history, stock history
--   5. Triggers guard money: a paid order's amounts can't change, a successful payment stays successful,
--      refunds can't exceed the payment, and GST documents can never be edited or deleted — by anyone.
-- ════════════════════════════════════════════════════════════════════════════

/* ───────────── 1–2. Lock the schema away from the API roles ───────────── */
revoke all on schema dvine from public;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on schema dvine from %I', r);
      execute format('revoke all on all tables in schema dvine from %I', r);
      execute format('revoke all on all sequences in schema dvine from %I', r);
      execute format('revoke all on all functions in schema dvine from %I', r);
    end if;
  end loop;
end $$;
revoke all on all functions in schema dvine from public;
alter default privileges in schema dvine revoke all on tables from public;
alter default privileges in schema dvine revoke all on functions from public;

/* ───────────── 4. The application role ─────────────
   Created without a password. `npm run db:migrate` gives it one from DATABASE_APP_PASSWORD,
   or run:  alter role dvine_app with login password '<long random password>';            */
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'dvine_app') then
    create role dvine_app nologin noinherit nocreatedb nocreaterole noreplication;
  end if;
end $$;
alter role dvine_app set search_path = dvine, public;
alter role dvine_app set statement_timeout = '15s';
alter role dvine_app set idle_in_transaction_session_timeout = '30s';

grant usage on schema dvine to dvine_app;
grant select, insert, update on all tables in schema dvine to dvine_app;
grant usage, select on all sequences in schema dvine to dvine_app;
grant execute on function dvine.touch_updated_at() to dvine_app;

-- only what the app deletes
grant delete on dvine.cart_items, dvine.addresses, dvine.settings, dvine.rate_limits to dvine_app;

-- append-only ledgers: insert + read, never rewrite
revoke update on dvine.audit_logs, dvine.invoices, dvine.order_events, dvine.stock_movements, dvine.enquiry_notes from dvine_app;

/* ───────────── 3. Row Level Security ───────────── */
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'dvine' loop
    execute format('alter table dvine.%I enable row level security', t);
    execute format('drop policy if exists app_read on dvine.%I', t);
    execute format('drop policy if exists app_insert on dvine.%I', t);
    execute format('drop policy if exists app_update on dvine.%I', t);
    execute format('drop policy if exists app_delete on dvine.%I', t);
    execute format('create policy app_read on dvine.%I for select to dvine_app using (true)', t);
    execute format('create policy app_insert on dvine.%I for insert to dvine_app with check (true)', t);
    if t not in ('audit_logs', 'invoices', 'order_events', 'stock_movements', 'enquiry_notes') then
      execute format('create policy app_update on dvine.%I for update to dvine_app using (true) with check (true)', t);
    end if;
    if t in ('cart_items', 'addresses', 'settings', 'rate_limits') then
      execute format('create policy app_delete on dvine.%I for delete to dvine_app using (true)', t);
    end if;
  end loop;
end $$;

/* ───────────── 5. Integrity triggers (apply to every role, including the owner) ───────────── */

-- GST invoices, credit notes and the audit trail are permanent records.
create or replace function dvine.forbid_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception '% rows are permanent records and cannot be %', tg_table_name, lower(tg_op)
    using errcode = 'insufficient_privilege';
end $$;

create trigger invoices_immutable before update or delete on dvine.invoices
  for each row execute function dvine.forbid_change();
create trigger audit_logs_immutable before update or delete on dvine.audit_logs
  for each row execute function dvine.forbid_change();
create trigger order_events_immutable before update or delete on dvine.order_events
  for each row execute function dvine.forbid_change();
create trigger stock_movements_immutable before update or delete on dvine.stock_movements
  for each row execute function dvine.forbid_change();

-- Financial history is never deleted.
create trigger orders_no_delete before delete on dvine.orders
  for each row execute function dvine.forbid_change();
create trigger order_items_no_delete before delete on dvine.order_items
  for each row execute function dvine.forbid_change();
create trigger payments_no_delete before delete on dvine.payments
  for each row execute function dvine.forbid_change();
create trigger refunds_no_delete before delete on dvine.refunds
  for each row execute function dvine.forbid_change();

-- Once an order is paid, what was charged is fixed.
create or replace function dvine.guard_order_amounts() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.payment_status <> 'pending' and old.payment_status <> 'failed' and (
       new.subtotal is distinct from old.subtotal or new.discount is distinct from old.discount
    or new.shipping is distinct from old.shipping or new.tax_total is distinct from old.tax_total
    or new.total is distinct from old.total or new.customer_id is distinct from old.customer_id
    or new.number is distinct from old.number) then
    raise exception 'Amounts of a paid order cannot be changed (order %)', old.number using errcode = 'check_violation';
  end if;
  if new.access_token is distinct from old.access_token then
    raise exception 'Order access tokens are fixed' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger orders_guard_amounts before update on dvine.orders
  for each row execute function dvine.guard_order_amounts();

-- Order lines are a snapshot of what was sold: only serial numbers may be filled in later.
create or replace function dvine.guard_order_items() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.order_id, new.product_id, new.sku, new.qty, new.unit_price, new.discount, new.tax_rate, new.tax_amount, new.line_total)
     is distinct from
     (old.order_id, old.product_id, old.sku, old.qty, old.unit_price, old.discount, old.tax_rate, old.tax_amount, old.line_total) then
    raise exception 'Order lines are a fixed record of the sale' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger order_items_guard before update on dvine.order_items
  for each row execute function dvine.guard_order_items();

-- A payment's amount, gateway and target never change, and a successful payment stays successful.
create or replace function dvine.guard_payments() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.amount, new.gateway, new.purpose, new.order_id, new.water_test_id, new.gateway_order_id)
     is distinct from (old.amount, old.gateway, old.purpose, old.order_id, old.water_test_id, old.gateway_order_id) then
    raise exception 'Payment % cannot be re-pointed or re-priced', old.id using errcode = 'check_violation';
  end if;
  if old.status = 'success' and new.status <> 'success' then
    raise exception 'A successful payment cannot be reversed here; issue a refund' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger payments_guard before update on dvine.payments
  for each row execute function dvine.guard_payments();

-- Refunds never exceed what was paid, and a refund's amount is fixed once recorded.
create or replace function dvine.guard_refunds() returns trigger
language plpgsql set search_path = '' as $$
declare paid bigint; refunded bigint;
begin
  if tg_op = 'UPDATE' and (new.amount, new.order_id, new.payment_id) is distinct from (old.amount, old.order_id, old.payment_id) then
    raise exception 'A refund''s amount is fixed once recorded' using errcode = 'check_violation';
  end if;
  if tg_op = 'INSERT' then
    select coalesce(sum(amount), 0) into paid from dvine.payments where order_id = new.order_id and status = 'success';
    select coalesce(sum(amount), 0) into refunded from dvine.refunds where order_id = new.order_id and status in ('pending', 'processed');
    if refunded + new.amount > paid then
      raise exception 'Refund of % exceeds the % still refundable', new.amount, paid - refunded using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
create trigger refunds_guard before insert or update on dvine.refunds
  for each row execute function dvine.guard_refunds();

-- Staff roles are only changed by an admin through the app; nobody may leave the shop without an active admin.
create or replace function dvine.keep_an_admin() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (old.role = 'admin' and old.active) and not (new.role = 'admin' and new.active) then
    if not exists (select 1 from dvine.staff where id <> old.id and role = 'admin' and active) then
      raise exception 'At least one active admin is required' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
create trigger staff_keep_an_admin before update on dvine.staff
  for each row execute function dvine.keep_an_admin();

grant execute on function dvine.forbid_change(), dvine.guard_order_amounts(), dvine.guard_order_items(),
  dvine.guard_payments(), dvine.guard_refunds(), dvine.keep_an_admin() to dvine_app;
