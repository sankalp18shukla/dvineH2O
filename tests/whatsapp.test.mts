/**
 * Offline test of the WhatsApp templates: every template follows Meta's rules, and every message the site sends
 * fills its template with the right number of variables and a working button link.
 *   npx tsx --conditions=react-server tests/whatsapp.test.mts
 */
import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_SITE_URL = 'https://dvineh2o.com';
const { WA_TEMPLATES, waParam } = await import('../src/lib/whatsapp-templates.ts');
const { templates, whatsappPayload, links } = await import('../src/lib/notify.ts');

let n = 0;
const ok = (name: string, fn: () => void) => { fn(); n++; console.log(`✓ ${name}`); };

const vars = (body: string) => [...body.matchAll(/\{\{(\d+)\}\}/g)].map(m => Number(m[1]));
for (const [key, t] of Object.entries(WA_TEMPLATES)) {
  ok(`template ${key} follows Meta's rules`, () => {
    const v = vars(t.body);
    assert.deepEqual(v, v.map((_, i) => i + 1), 'variables numbered 1, 2, 3… in order');
    assert.equal(t.example.length, v.length, 'one example per variable');
    assert.ok(!/^\s*\{\{/.test(t.body) && !/\}\}[\s.]*$/.test(t.body), 'body neither starts nor ends with a variable');
    assert.ok(!/\}\}\s*\{\{/.test(t.body), 'no two variables side by side');
    assert.match(t.name, /^[a-z0-9_]{1,512}$/, 'lowercase name with underscores');
    assert.ok(t.body.length <= 1024, 'body within 1,024 characters');
    if ('button' in t) assert.ok(t.button.text.length <= 25, 'button text within 25 characters');
  });
}

const msgs = {
  orderConfirmed: templates.orderConfirmed({ number: 'DV-26-000123', name: 'Priya', total: '₹14,999', link: links.order('DV-26-000123', 'tok') }),
  orderShipped: templates.orderShipped({ number: 'DV-26-000123', name: 'Priya', courier: null, awb: null, link: links.order('DV-26-000123', 'tok') }),
  orderDelivered: templates.orderDelivered({ number: 'DV-26-000123', name: 'Priya', link: links.order('DV-26-000123', 'tok') }),
  orderCancelled: templates.orderCancelled({ number: 'DV-26-000123', name: 'Priya' }),
  enquiryReceived: templates.enquiryReceived({ ref: 'EQ-26-00042', name: 'Priya', what: 'your water report' }),
  waterTestBooked: templates.waterTestBooked({ ref: 'WT-26-00007', name: 'Priya', when: '2026-11-28, Morning', link: links.waterTest('WT-26-00007', 'tok') }),
  waterReportReady: templates.waterReportReady({ ref: 'WT-26-00007', name: 'Priya', link: links.waterTest('WT-26-00007', 'tok') }),
  reportReviewReady: templates.reportReviewReady({ ref: 'EQ-26-00042', name: 'Priya', link: links.reportReview('EQ-26-00042', 'tok') }),
  paymentLink: templates.paymentLink({ number: 'DV-26-000124', name: 'Rahul', total: '₹2,45,000', what: 'TitanForce 111', link: links.pay('DV-26-000124', 'tok'), until: '28 Nov' }),
  ticketOpened: templates.ticketOpened({ number: 'SR-26-00003', name: 'Priya' }),
  referralPending: templates.referralPending({ name: 'Anita', friend: 'Priya', reward: '₹1,000', link: links.referrals() }),
  referralReward: templates.referralReward({ name: 'Anita', code: 'THANKS-7K2Q9A', reward: '₹1,000', until: '21 May 2027', link: links.referrals() }),
};

for (const [k, m] of Object.entries(msgs)) {
  ok(`message ${k} fills its template`, () => {
    assert.ok(m.wa, 'customer messages go on WhatsApp');
    const t = WA_TEMPLATES[m.wa!.key];
    assert.equal(m.wa!.params.length, vars(t.body).length, 'variable count matches the template');
    const p = whatsappPayload('919876543210', m) as { type: string; template: { name: string; components: { type: string; parameters: { text: string }[] }[] } };
    assert.equal(p.type, 'template');
    assert.equal(p.template.name, t.name);
    const button = p.template.components.find(c => c.type === 'button');
    if ('button' in t) {
      assert.ok(button, 'button parameter present');
      const suffix = button!.parameters[0].text;
      assert.ok(suffix && !suffix.startsWith('/') && !suffix.startsWith('http'), `button suffix is a site path: ${suffix}`);
      assert.equal(`https://dvineh2o.com/${suffix}`, m.link!.href, 'button opens the same page as the email');
    } else assert.equal(button, undefined);
  });
}

ok('team alert stays email-only', () => assert.equal(templates.ticketForTeam({ number: 'SR-1', name: 'x', contact: 'y', issue: 'z', link: 'https://dvineh2o.com/admin' }).wa, undefined));
ok('variables are cleaned for Meta', () => {
  assert.equal(waParam('a\nb\tc'), 'a b c');
  assert.equal(waParam('a      b'), 'a   b');
  assert.equal(waParam(''), '-');
  assert.equal(waParam(null), '-');
});
ok('shipped message without courier details still reads well', () => assert.deepEqual(msgs.orderShipped.wa!.params.slice(2), ['our courier partner', 'on your order page']));

console.log(`\n${n} checks passed`);
process.exit(0);
