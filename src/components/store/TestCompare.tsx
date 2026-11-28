import { Gloss, Term } from '../ui/Term';
import { Icon } from '../ui/Icon';
import { formatINR } from '@/lib/money';
import bands from './Bands.module.css';

type Opt = { id: number; name: string; summary: string | null; parameters: string[]; collectionMethod: string; turnaround: string; price: number };

const price = (o: Opt) => (o.price ? formatINR(o.price) : 'Free today');
const Params = ({ o }: { o: Opt }) => (
  <ul className="flex flex-wrap gap-x-4 gap-y-2 font-sans text-[15px]">
    {o.parameters.map(x => <li key={x} className="flex items-center gap-2"><span className="size-1.5 shrink-0 bg-deep-current" aria-hidden="true" /><Term>{x}</Term></li>)}
  </ul>
);
/** The test's head: a rippling icon chip (as the page's other tiles), its number in Garamond, name and line. */
const Head = ({ o, i }: { o: Opt; i: number }) => (
  <>
    <div className="flex items-center justify-between gap-4">
      <span className={`${bands.chip} ${bands.chipTone}`} style={{ ['--d' as string]: `${i * -1.6}s` }}><Icon name={i ? 'filter' : 'drop'} className="size-6" strokeWidth={1.4} /></span>
      <span className={`${bands.tileN} font-serif text-[26px] text-deep-current italic`}>Test 0{i + 1}</span>
    </div>
    <h3 className="mt-5 font-sans text-[24px] leading-tight font-bold tracking-[-0.03em] lg:text-[28px]">{o.name}</h3>
    {o.summary && <p className="mt-2 max-w-md text-[17px] leading-snug text-ink/70"><Gloss text={o.summary} /></p>}
  </>
);

/**
 * The tests side by side, so people choose in ten seconds (website update brief): each test heads its column as a
 * ruled tile, and the rows run under both (price, how it is done, report, parameters). From tablet width it is one
 * table; on phones each test is its own tile with the same rows. Every parameter name opens its definition.
 */
export function TestCompare({ options }: { options: Opt[] }) {
  if (!options.length) return null;
  const rows: [string, (o: Opt) => React.ReactNode][] = [
    ['Price', o => <span className="inline-block bg-voltage px-2.5 py-0.5 font-sans text-[20px] font-bold">{price(o)}</span>],
    ['How it is done', o => o.collectionMethod],
    ['Report', o => o.turnaround],
    ['Parameters', o => <><p className="mb-3 font-serif text-[18px] italic text-deep-current">{o.parameters.length} parameters</p><Params o={o} /></>],
  ];
  return (
    <>
      {/* tablet and up: one table, the tests as ruled tiles across the top */}
      <div className="hidden md:block" data-reveal>
        <table className="w-full table-fixed border-collapse font-sans text-[16px]">
          <colgroup><col className="w-[17%]" />{options.map(o => <col key={o.id} />)}</colgroup>
          <thead>
            <tr>
              <th scope="col" className="align-bottom"><span className="sr-only">Detail</span></th>
              {options.map((o, i) => (
                <th key={o.id} scope="col" className="px-5 pb-8 text-left align-top font-normal">
                  <div className={`${bands.tile} ${bands.callout} group`}><Head o={o} i={i} /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, cell]) => (
              <tr key={label} className="border-t border-line">
                <th scope="row" className="py-5 pr-4 text-left align-top font-sans text-[12px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</th>
                {options.map(o => <td key={o.id} className="px-5 py-5 align-top">{cell(o)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* phones: a ruled tile per test */}
      <div className="grid grid-cols-1 gap-14 md:hidden" data-rise>
        {options.map((o, i) => (
          <article key={o.id} className={`${bands.tile} ${bands.callout} group`}>
            <Head o={o} i={i} />
            <dl className="mt-6 grid font-sans text-[15.5px]">
              {rows.map(([label, cell]) => (
                <div key={label} className={`border-t border-line py-4 ${label === 'Parameters' ? '' : 'flex items-baseline justify-between gap-4'}`}>
                  <dt className="text-[12px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</dt>
                  <dd className={label === 'Parameters' ? 'mt-3' : 'text-right font-medium'}>{cell(o)}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
