import { requireStaff } from '@/lib/auth';
import { sheetsEmail, sheetUrl } from '@/lib/google-sheets';
import { FEEDS, getLinks, type Feed, type SheetLink } from '@/lib/sheet-sync';
import { PageHead, Panel } from '@/components/admin/ui';
import { AdminForm, AdminError } from '@/components/admin/AdminForm';
import { Icon } from '@/components/admin/AdminIcon';
import { ago, feedAnchor } from '@/components/admin/SheetButton';
import { CopyButton } from '@/components/CopyButton';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { linkAll, linkSheet, syncSheet, unlinkSheet } from '@/app/actions/sheets';

export const metadata = { title: 'Google Sheets' };

type Sheet = { id: string; title: string };

function SheetPicker({ sheets, id }: { sheets: Sheet[]; id: string }) {
  return (
    <>
      <div className="field">
        <label className="label text-[12px]" htmlFor={`${id}-link`}>Google Sheet link</label>
        <input id={`${id}-link`} name="link" className="input min-h-10 text-sm" placeholder="https://docs.google.com/spreadsheets/d/…" autoComplete="off" />
        <AdminError name="link" />
      </div>
      {sheets.length > 0 && (
        <div className="field">
          <label className="label text-[12px]" htmlFor={`${id}-existing`}>Or a sheet you’ve already linked</label>
          <select id={`${id}-existing`} name="existing" className="input min-h-10 text-sm" defaultValue=""><option value="">Choose</option>{sheets.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        </div>
      )}
    </>
  );
}

function Row({ f, link, sheets }: { f: Feed; link?: SheetLink; sheets: Sheet[] }) {
  const id = feedAnchor(f.key);
  const head = (
    <div className="flex min-w-0 gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#F1F4F9] text-[#52607E]"><Icon name={f.icon} className="size-[18px]" /></span>
      <div className="min-w-0">
        <p className="font-sans text-[14px] font-semibold text-ink">{f.label}</p>
        <p className="font-sans text-[12.5px] text-muted">{f.group === 'forms' ? `Sent from: ${f.about}` : f.about}</p>
        {link && (
          <p className="mt-1 font-sans text-[12.5px] text-[#3B4766]">
            <a href={sheetUrl(link.spreadsheetId, link.tabId)} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1 text-[12.5px]"><Icon name="sheet" className="size-3.5" />{link.title} › {link.tab}</a>
            <span className="text-muted"> · {f.direction === 'in' ? 'Read' : 'Synced'} {ago(link.lastSyncAt)}{link.rows != null ? ` · ${link.rows} row${link.rows === 1 ? '' : 's'}` : ''}</span>
          </p>
        )}
        {link?.lastError && <p className="mt-1 flex gap-1.5 font-sans text-[12.5px] text-[#B42318]"><Icon name="alert" className="mt-px size-3.5 shrink-0" />{link.lastError}</p>}
        {link?.note && !link.lastError && <p className="mt-1 font-sans text-[12.5px] text-[#7A4B00]">{link.note}</p>}
      </div>
    </div>
  );

  if (link) return (
    <li id={id} className="grid scroll-mt-24 grid-cols-1 gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      {head}
      <div className="flex flex-wrap gap-2 md:justify-end">
        <a href={sheetUrl(link.spreadsheetId, link.tabId)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><Icon name="external" className="size-4" />Open</a>
        <AdminForm action={syncSheet} className="contents"><input type="hidden" name="feed" value={f.key} /><SubmitButton className="btn btn-outline btn-sm" pendingLabel="Syncing…"><Icon name="refresh" className="size-4" />{f.direction === 'in' ? 'Read sheet now' : 'Sync now'}</SubmitButton></AdminForm>
        <AdminForm action={unlinkSheet} className="contents" confirm={`Unlink ${f.label} from “${link.title}”? The sheet keeps its rows; new entries stop going to it.`}><input type="hidden" name="feed" value={f.key} /><SubmitButton className="btn btn-ghost btn-sm text-[#B42318]" pendingLabel="Unlinking…"><Icon name="unlink" className="size-4" />Unlink</SubmitButton></AdminForm>
      </div>
    </li>
  );

  return (
    <li id={id} className="scroll-mt-24 py-4 first:pt-0 last:pb-0">
      <details className="group">
        <summary className="grid cursor-pointer list-none grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center [&::-webkit-details-marker]:hidden">
          {head}
          <span className="btn btn-outline btn-sm justify-self-start md:justify-self-end"><Icon name="link" className="size-4" /><span className="group-open:hidden">Link a sheet</span><span className="hidden group-open:inline">Close</span></span>
        </summary>
        <AdminForm action={linkSheet} className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-line bg-[#F8FAFD] p-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-end">
          <input type="hidden" name="feed" value={f.key} />
          <SheetPicker sheets={sheets} id={id} />
          <div className="field">
            <label className="label text-[12px]" htmlFor={`${id}-tab`}>Tab name</label>
            <input id={`${id}-tab`} name="tab" className="input min-h-10 text-sm" defaultValue={f.tab} maxLength={90} />
          </div>
          {f.direction === 'in'
            ? <p className="font-sans text-[12.5px] text-muted md:col-span-2">Columns: <b className="font-semibold text-ink">{f.header.join(' · ')}</b>, with Yes or No in the last three. If the tab is empty, it’s filled with the website’s current list. If it already has pincodes, the website switches to the sheet’s list.</p>
            : <p className="font-sans text-[12.5px] text-muted md:col-span-2">The tab is created if it doesn’t exist, and every response so far is copied in. You can add your own columns to the right of the website’s columns.</p>}
          <SubmitButton className="btn btn-primary btn-sm justify-self-start" pendingLabel="Linking…">Link sheet</SubmitButton>
        </AdminForm>
      </details>
    </li>
  );
}

export default async function SheetsPage() {
  await requireStaff('settings');
  const links = await getLinks();
  const email = sheetsEmail();
  const sheets: Sheet[] = [...new Map([...links.values()].map(l => [l.spreadsheetId, { id: l.spreadsheetId, title: l.title }])).values()];
  const open = FEEDS.filter(f => !links.has(f.key));
  const openOut = open.filter(f => f.direction === 'out');
  const failing = [...links.values()].filter(l => l.lastError).length;
  const groups: [Feed['group'], string][] = [['forms', 'Form responses'], ['records', 'Orders, service and customers'], ['lists', 'Lists the website reads from a sheet']];

  return (
    <>
      <PageHead title="Google Sheets"
        sub={`${links.size} of ${FEEDS.length} linked${failing ? ` · ${failing} need attention` : ''}. Responses reach the sheet within seconds of being sent, and stage or status changes follow.`}
        actions={links.size > 0 ? <AdminForm action={syncSheet} className="contents"><input type="hidden" name="feed" value="all" /><SubmitButton className="btn btn-outline btn-sm" pendingLabel="Syncing…"><Icon name="refresh" className="size-4" />Sync all now</SubmitButton></AdminForm> : undefined} />

      <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="How to link a sheet">
        {[
          ['1', 'Make a Google Sheet', 'Use one spreadsheet for everything, or a separate one for each form. Each list gets its own tab.'],
          ['2', 'Share it with the website', email ? <>Click <b className="font-semibold text-ink">Share</b> in the sheet and add this address as an <b className="font-semibold text-ink">Editor</b>:</> : <>Click <b className="font-semibold text-ink">Share</b> in the sheet and add the website’s Google address as an <b className="font-semibold text-ink">Editor</b>.</>],
          ['3', 'Paste the link here', 'Next to the form it’s for, or once below for everything. Everything sent so far is copied in straight away.'],
        ].map(([n, h, p]) => (
          <div key={n as string} className="rounded-xl border border-line bg-white p-4 font-sans">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-ink"><span className="grid size-6 place-items-center rounded-full bg-[#EAF2FE] text-[12px] text-deep-current">{n}</span>{h}</p>
            <p className="mt-1.5 text-[13px] text-muted">{p}</p>
            {n === '2' && email && <div className="mt-2 flex flex-wrap items-center gap-2"><code className="max-w-full truncate rounded-md bg-[#F1F4F9] px-2 py-1 text-[12px] text-ink">{email}</code><CopyButton text={email} label="Copy" /></div>}
          </div>
        ))}
      </section>

      {openOut.length > 1 && (
        <Panel title="Link everything to one sheet" className="mb-6">
          <AdminForm action={linkAll} className={`grid grid-cols-1 gap-3 md:items-end ${sheets.length ? 'md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto]' : 'md:grid-cols-[minmax(0,1fr)_auto]'}`}>
            <SheetPicker sheets={sheets} id="all" />
            <SubmitButton className="btn btn-primary btn-sm justify-self-start" pendingLabel="Linking…">Link {openOut.length} lists</SubmitButton>
            {open.some(f => f.direction === 'in') && (
              <label className="col-span-full flex items-center gap-2 font-sans text-[13px] text-[#3B4766]"><input type="checkbox" name="pincodes" className="size-4 accent-[#0B57D0]" />Also manage serviceable pincodes from this sheet</label>
            )}
            <p className="col-span-full font-sans text-[12.5px] text-muted">Adds one tab per form and record list that isn’t linked yet: {openOut.map(f => f.tab).join(', ')}.</p>
          </AdminForm>
        </Panel>
      )}

      <div className="grid gap-6">
        {groups.map(([g, title]) => (
          <Panel key={g} title={title}>
            <ul className="divide-y divide-line">{FEEDS.filter(f => f.group === g).map(f => <Row key={f.key} f={f} link={links.get(f.key)} sheets={sheets} />)}</ul>
          </Panel>
        ))}
      </div>
    </>
  );
}
