/**
 * Submits the website's WhatsApp message templates (src/lib/whatsapp-templates.ts) to Meta for approval.
 *
 *   npm run whatsapp:templates              submit every template the account doesn't have yet
 *   npm run whatsapp:templates -- --status  list each template and Meta's decision (APPROVED / PENDING / REJECTED)
 *   npm run whatsapp:templates -- --dry     print what would be submitted, without calling Meta
 *
 * Needs WHATSAPP_TOKEN (a permanent System User token with whatsapp_business_management) and WHATSAPP_WABA_ID
 * (the WhatsApp Business Account ID, in WhatsApp Manager › Account tools, or Meta Business Settings › Accounts ›
 * WhatsApp accounts). Buttons link to NEXT_PUBLIC_SITE_URL, so set the live domain before submitting.
 */
import './env';
import { WA_TEMPLATES, WA_FOOTER, type WaTemplate } from '../src/lib/whatsapp-templates';

const args = new Set(process.argv.slice(2));
const token = process.env.WHATSAPP_TOKEN;
const waba = process.env.WHATSAPP_WABA_ID;
const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
const lang = process.env.WHATSAPP_TEMPLATE_LANG || 'en';
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

function components(t: WaTemplate) {
  const c: Record<string, unknown>[] = [
    { type: 'BODY', text: t.body, example: { body_text: [t.example] } },
    { type: 'FOOTER', text: WA_FOOTER },
  ];
  if (t.button) c.push({ type: 'BUTTONS', buttons: [{ type: 'URL', text: t.button.text, url: `${site}/{{1}}`, example: [`${site}/${t.button.example}`] }] });
  return c;
}

async function graph(path: string, init?: RequestInit) {
  const r = await fetch(`https://graph.facebook.com/${version}/${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init?.headers } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.error?.error_user_msg || body?.error?.message || `HTTP ${r.status}`);
  return body;
}

async function existing() {
  const out = new Map<string, { status: string; category: string; reason?: string }>();
  let next: string | null = `${waba}/message_templates?fields=name,status,category,language,rejected_reason&limit=200`;
  while (next) {
    const page: { data: { name: string; status: string; category: string; language: string; rejected_reason?: string }[]; paging?: { next?: string } } = await graph(next);
    for (const t of page.data) if (t.language === lang) out.set(t.name, { status: t.status, category: t.category, reason: t.rejected_reason });
    next = page.paging?.next ? page.paging.next.replace(/^https:\/\/graph\.facebook\.com\/v[\d.]+\//, '') : null;
  }
  return out;
}

async function main() {
  const list = Object.values(WA_TEMPLATES) as WaTemplate[];
  if (args.has('--dry')) {
    for (const t of list) console.log(JSON.stringify({ name: t.name, language: lang, category: t.category, components: components(t) }, null, 2));
    return;
  }
  if (!token || !waba) { console.error('Set WHATSAPP_TOKEN and WHATSAPP_WABA_ID in .env.local first.'); process.exit(1); }
  if (!/^https:\/\//.test(site) || /localhost/.test(site)) { console.error(`NEXT_PUBLIC_SITE_URL is "${site}". Set it to the live https:// domain: template buttons link there.`); process.exit(1); }

  const have = await existing();
  if (args.has('--status')) {
    for (const t of list) {
      const h = have.get(t.name);
      console.log(`${t.name.padEnd(26)} ${h ? h.status.padEnd(10) : 'MISSING   '} ${h?.category ?? ''}${h?.reason && h.reason !== 'NONE' ? `  (${h.reason})` : ''}`);
    }
    return;
  }
  let made = 0;
  for (const t of list) {
    if (have.has(t.name)) { console.log(`✓ ${t.name} already exists (${have.get(t.name)!.status})`); continue; }
    try {
      const r = await graph(`${waba}/message_templates`, { method: 'POST', body: JSON.stringify({ name: t.name, language: lang, category: t.category, components: components(t) }) });
      console.log(`+ ${t.name} submitted: ${r.status ?? 'PENDING'}${r.category && r.category !== t.category ? ` (Meta filed it as ${r.category})` : ''}`);
      made++;
    } catch (e) { console.error(`✗ ${t.name}: ${(e as Error).message}`); }
  }
  console.log(made ? `\n${made} submitted. Check approval with: npm run whatsapp:templates -- --status` : '\nNothing new to submit.');
}

main().catch(e => { console.error(e); process.exit(1); });
