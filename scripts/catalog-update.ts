/**
 * Writes the website update brief's database changes (src/lib/catalog-update.ts) to the live database:
 * the feature_order column (migration 20261126000001), new prices and spec tables, the two water tests,
 * the first articles and the three homepage blog tiles; and from the client's 27 Nov 2026 update: Crystal's 12-month
 * machine warranty, manual links, Titan's studio photos, the Odisha pincode list and the Titan warranty lines in posts.
 *
 * Run it when the matching code is deployed, not before: prices and specs show on the live site at once.
 *
 *   npm run catalog:update            shows what would change
 *   npm run catalog:update -- --apply writes it
 */
import './env';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { COVER_UPDATES, FEATURED_SLUGS, NEW_POSTS, PINCODE_ROWS, POST_FIXES, PRODUCT_FIELDS, PRODUCT_UPDATES, TEST_UPDATES } from '../src/lib/catalog-update';

const url = process.env.DATABASE_ADMIN_URL;
if (!url) { console.error('Set DATABASE_ADMIN_URL in .env.local'); process.exit(1); }
const apply = process.argv.includes('--apply');
const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {}, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require' });
const rupees = (paise: number | string) => `₹${(Number(paise) / 100).toLocaleString('en-IN')}`;

async function main() {
  console.log(apply ? 'Writing the catalogue update…\n' : 'Dry run (add --apply to write):\n');
  await sql.begin(async tx => {
    // 1 · homepage blog order column
    const MIG = '20261126000001';
    const [done] = await tx`select 1 from supabase_migrations.schema_migrations where version = ${MIG}`;
    if (!done) {
      console.log(`· migration ${MIG}_post_feature_order`);
      if (apply) {
        const body = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations', `${MIG}_post_feature_order.sql`), 'utf8');
        await tx.unsafe(body);
        await tx`insert into supabase_migrations.schema_migrations (version, name, statements) values (${MIG}, 'post_feature_order', ${[body]})`;
      }
    }

    // 2 · products
    for (const [slug, u] of Object.entries(PRODUCT_UPDATES)) {
      const [p] = await tx`select id, mrp, price from dvine.products where slug = ${slug}`;
      if (!p) { console.log(`! no product ${slug}`); continue; }
      const price = u.price !== undefined ? ` price ${rupees(p.price)} → ${rupees(u.price)}, MRP ${rupees(p.mrp)} → ${rupees(u.mrp ?? p.mrp)};` : '';
      console.log(`· ${slug}:${price} ${u.specs?.length ?? 0} spec rows${u.boxContents ? ', box contents' : ''}`);
      if (!apply) continue;
      if (u.price !== undefined) await tx`update dvine.products set mrp = ${u.mrp!}, price = ${u.price} where id = ${p.id}`;
      if (u.specs) await tx`update dvine.products set specs = ${tx.json(u.specs)} where id = ${p.id}`;
      if (u.boxContents) await tx`update dvine.products set box_contents = ${tx.json(u.boxContents)} where id = ${p.id}`;
    }

    // 2b · warranty months, manuals, Titan gallery
    for (const [slug, f] of Object.entries(PRODUCT_FIELDS)) {
      const [p] = await tx`select id, warranty_months, manual_url from dvine.products where slug = ${slug}`;
      if (!p) continue;
      console.log(`· ${slug}:${f.warrantyMonths !== undefined ? ` warranty ${p.warranty_months} → ${f.warrantyMonths} months;` : ''}${f.manualUrl ? ` manual ${p.manual_url ?? 'none'} → ${f.manualUrl};` : ''}${f.images ? ` ${f.images.length} gallery photos` : ''}`);
      if (!apply) continue;
      if (f.warrantyMonths !== undefined) await tx`update dvine.products set warranty_months = ${f.warrantyMonths} where id = ${p.id}`;
      if (f.manualUrl) await tx`update dvine.products set manual_url = ${f.manualUrl} where id = ${p.id}`;
      if (f.images) await tx`update dvine.products set images = ${tx.json(f.images)} where id = ${p.id}`;
    }

    // 2c · pincodes: the client's Odisha list in, the placeholder metro samples switched off (not deleted)
    const [{ n: outside }] = await tx`select count(*)::int as n from dvine.pincodes where state <> 'Odisha' and (serviceable or installation or water_testing)`;
    console.log(`· pincodes: ${PINCODE_ROWS.length} in Odisha upserted; ${outside} outside Odisha switched off`);
    if (apply) {
      for (let i = 0; i < PINCODE_ROWS.length; i += 200) {
        const rows = PINCODE_ROWS.slice(i, i + 200).map(r => ({ pincode: r.pincode, city: r.city, state: r.state, serviceable: r.serviceable, installation: r.installation, water_testing: r.waterTesting, delivery_days: r.deliveryDays }));
        await tx`insert into dvine.pincodes ${tx(rows)} on conflict (pincode) do update set city = excluded.city, state = excluded.state,
          serviceable = excluded.serviceable, installation = excluded.installation, water_testing = excluded.water_testing, delivery_days = excluded.delivery_days`;
      }
      await tx`update dvine.pincodes set serviceable = false, installation = false, water_testing = false where state <> 'Odisha'`;
    }

    // 3 · water tests (Standard is switched off, not deleted: old bookings still point at it)
    for (const t of TEST_UPDATES) {
      const [row] = await tx`select id, price, active from dvine.test_options where name = ${t.name}`;
      if (!row) { console.log(`! no test "${t.name}"`); continue; }
      console.log(`· ${t.name}: ${t.active ? `on${t.price !== undefined ? `, ${t.price ? rupees(t.price) : 'free'}` : ''}` : 'switched off'}`);
      if (!apply) continue;
      await tx`update dvine.test_options set active = ${t.active} where id = ${row.id}`;
      if (t.parameters) await tx`update dvine.test_options set summary = ${t.summary ?? null}, parameters = ${tx.json(t.parameters)}, collection_method = ${t.collectionMethod!}, turnaround = ${t.turnaround!}, price = ${t.price ?? 0} where id = ${row.id}`;
    }

    // 4 · articles (skipped if the slug already exists, so staff edits are never overwritten)
    for (const n of NEW_POSTS) {
      const [row] = await tx`select id from dvine.posts where slug = ${n.slug}`;
      console.log(`· post ${n.slug}: ${row ? 'already there' : 'new, published'}`);
      if (row || !apply) continue;
      await tx`insert into dvine.posts (slug, title, excerpt, category, product, cover_image, cover_alt, body, status, published_at)
        values (${n.slug}, ${n.title}, ${n.excerpt}, ${n.category}, ${n.product}, ${n.coverImage}, ${n.coverAlt}, ${n.body}, 'published', ${new Date(`${n.published}T04:30:00.000Z`)})`;
    }

    // 4b · exact-text fixes in published posts (Titan warranty / service area)
    for (const f of POST_FIXES) {
      const hits = await tx`select id, slug from dvine.posts where position(${f.from} in body) > 0`;
      if (hits.length) console.log(`· post text: "${f.from.slice(0, 50)}…" in ${hits.map(h => h.slug).join(', ')}`);
      if (apply) for (const h of hits) await tx`update dvine.posts set body = replace(body, ${f.from}, ${f.to}) where id = ${h.id}`;
    }

    // 4c · new blog covers (only where the old cover is still set)
    for (const c of COVER_UPDATES) {
      const [row] = await tx`select id, cover_image from dvine.posts where slug = ${c.slug}`;
      if (!row) { console.log(`! no post ${c.slug}`); continue; }
      if (row.cover_image !== c.from) { console.log(`· cover ${c.slug}: kept (${row.cover_image ?? 'none'})`); continue; }
      console.log(`· cover ${c.slug}: ${c.from} → ${c.to}`);
      if (apply) await tx`update dvine.posts set cover_image = ${c.to}, cover_alt = ${c.alt} where id = ${row.id}`;
    }

    // 5 · homepage tiles, in order; slot 1 also leads the blog
    console.log(`· homepage tiles: ${FEATURED_SLUGS.join(', ')}`);
    if (apply) {
      await tx`update dvine.posts set featured = false, feature_order = 0 where featured or feature_order > 0`;
      for (const [i, slug] of FEATURED_SLUGS.entries()) await tx`update dvine.posts set featured = true, feature_order = ${i + 1} where slug = ${slug}`;
    }
  });
  console.log(apply ? '\n✓ done' : '\nNothing written.');
}

main().then(() => sql.end()).catch(async e => { console.error(e); await sql.end(); process.exit(1); });
