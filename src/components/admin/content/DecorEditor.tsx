'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DecorVisual } from '@/components/store/DecorArt';
import { Icon } from '@/components/ui/Icon';
import { DECOR_PACKS, DecorSchema, newId, type DecorItem } from '@/lib/site-content';
import { uploadMedia } from './MediaField';
import { IconBtn, Range, Segmented, Toggle } from './fields';

const MIME = 'application/x-dvine-decor';
const toast = (ok: boolean, message: string) => window.dispatchEvent(new CustomEvent('dvine-admin-toast', { detail: { ok, message } }));
const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Place festive decorations on a slide or card by hand: drag stickers from the pack (or your own PNGs) onto the
 * preview, drag them around, pull the corner to resize, the top knob to rotate. `children` draws the preview and
 * calls `layer('back' | 'front')` where each layer belongs, so "behind the text" really sits behind it.
 */
export function DecorEditor({ items, onChange, children }: { items: DecorItem[]; onChange: (v: DecorItem[]) => void; children: (layer: (l: 'back' | 'front') => ReactNode) => ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const live = useRef(items); live.current = items;
  const selected = items.find(d => d.id === sel) ?? null;

  const patch = (id: string, p: Partial<DecorItem>) => onChange(live.current.map(d => (d.id === id ? { ...d, ...p } : d)));
  const add = (src: string, w = 12, x = 72, y = 30) => {
    if (items.length >= 16) return toast(false, 'Up to 16 decorations per slide.');
    const d = DecorSchema.parse({ id: newId(), src, w, x: r1(x), y: r1(y) });
    onChange([...live.current, d]); setSel(d.id);
  };
  const remove = (id: string) => { onChange(live.current.filter(d => d.id !== id)); setSel(null); };

  // keyboard: arrows nudge, Delete removes, Escape deselects
  useEffect(() => {
    if (!sel) return;
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,textarea,select')) return;
      const d = live.current.find(x => x.id === sel); if (!d) return;
      const step = e.shiftKey ? 5 : 0.5;
      const m: Record<string, Partial<DecorItem>> = { ArrowLeft: { x: d.x - step }, ArrowRight: { x: d.x + step }, ArrowUp: { y: d.y - step }, ArrowDown: { y: d.y + step } };
      if (m[e.key]) { e.preventDefault(); patch(sel, m[e.key]); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(sel); }
      else if (e.key === 'Escape') setSel(null);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  /** Pointer drag on the stage: move, resize (corner) or rotate (top knob). */
  const drag = (d: DecorItem, mode: 'move' | 'size' | 'turn') => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation(); setSel(d.id);
    const rect = stage.current!.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, o = { ...d };
    const cx = rect.left + rect.width * d.x / 100, cy = rect.top + rect.height * d.y / 100;
    const el = e.currentTarget as HTMLElement; el.setPointerCapture(e.pointerId);
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    const move = (ev: PointerEvent) => {
      if (mode === 'move') patch(d.id, { x: r1(clamp(o.x + (ev.clientX - sx) / rect.width * 100, -20, 120)), y: r1(clamp(o.y + (ev.clientY - sy) / rect.height * 100, -20, 120)) });
      else if (mode === 'size') patch(d.id, { w: r1(clamp(o.w + (ev.clientX - sx) * 2 / rect.width * 100, 2, 80)) });
      else { const a = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI + 90; patch(d.id, { rotate: Math.round(((a + 540) % 360) - 180) }); }
    };
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };

  const layer = (l: 'back' | 'front') => (
    <div className={`pointer-events-none absolute inset-0 ${l === 'front' ? 'z-[3]' : ''}`}>
      {items.filter(d => d.layer === l).map(d => {
        const on = d.id === sel;
        return (
          <div key={d.id} onPointerDown={drag(d, 'move')} title="Drag to move"
            className={`pointer-events-auto absolute cursor-move touch-none select-none ${on ? 'z-10 outline-2 outline-offset-2 outline-glacier outline-dashed' : 'hover:outline-1 hover:outline-white/70 hover:outline-dashed'}`}
            style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, translate: '-50% -50%', rotate: `${d.rotate}deg`, opacity: d.opacity }}>
            <DecorVisual src={d.src} />
            {on && <>
              <span onPointerDown={drag(d, 'size')} className="absolute -right-2.5 -bottom-2.5 size-4 cursor-nwse-resize rounded-sm border-2 border-white bg-deep-current shadow" title="Drag to resize" />
              <span onPointerDown={drag(d, 'turn')} className="absolute -top-7 left-1/2 size-4 -translate-x-1/2 cursor-grab rounded-full border-2 border-white bg-flash shadow" title="Drag to rotate" />
              <span className="absolute -top-3 left-1/2 h-3 w-px -translate-x-1/2 bg-white/80" />
            </>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="grid gap-3">
      <div ref={stage} className={`relative select-none ${over ? 'ring-4 ring-glacier/60' : ''} rounded-2xl`}
        onPointerDown={e => { if (e.target === e.currentTarget || !(e.target as HTMLElement).closest('[title="Drag to move"]')) setSel(null); }}
        onDragOver={e => { if (e.dataTransfer.types.includes(MIME) || e.dataTransfer.types.includes('Files')) { e.preventDefault(); setOver(true); } }}
        onDragLeave={() => setOver(false)}
        onDrop={async e => {
          e.preventDefault(); setOver(false);
          const r = stage.current!.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100;
          const raw = e.dataTransfer.getData(MIME);
          if (raw) { const { src, w } = JSON.parse(raw); add(src, w, x, y); return; }
          const f = e.dataTransfer.files[0];
          if (f) { setBusy(true); try { add((await uploadMedia(f, () => {})).src, 12, x, y); } catch (err) { toast(false, err instanceof Error ? err.message : 'The upload failed.'); } finally { setBusy(false); } }
        }}>
        {children(layer)}
        {busy && <div className="absolute inset-0 z-20 grid place-items-center rounded-2xl bg-white/60 font-sans text-sm font-semibold">Uploading…</div>}
      </div>

      {/* selected decoration */}
      {selected && (
        <div className="grid gap-4 rounded-2xl border border-deep-current/30 bg-[#F4F8FF] p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
            <span className="grid size-10 place-items-center rounded-lg bg-[#0B1B4D] p-1"><span className="block w-full"><DecorVisual src={selected.src} /></span></span>
            <p className="flex-1 font-sans text-[13.5px] font-semibold">Selected decoration <span className="font-normal text-muted">· arrow keys nudge, Delete removes</span></p>
            <IconBtn icon="copy" label="Duplicate" onClick={() => add(selected.src, selected.w, selected.x + 4, selected.y + 4)} />
            <IconBtn icon="trash" label="Remove" danger onClick={() => remove(selected.id)} />
          </div>
          <Range label="Size" value={selected.w} min={2} max={80} step={0.5} onChange={v => patch(selected.id, { w: v })} format={v => `${v}%`} />
          <Range label="Rotation" value={selected.rotate} min={-180} max={180} onChange={v => patch(selected.id, { rotate: v })} format={v => `${v}°`} />
          <Range label="Opacity" value={Math.round(selected.opacity * 100)} min={10} max={100} step={5} onChange={v => patch(selected.id, { opacity: v / 100 })} format={v => `${v}%`} />
          <Segmented label="Layer" value={selected.layer} onChange={v => patch(selected.id, { layer: v })} options={[{ value: 'front', label: 'In front of text' }, { value: 'back', label: 'Behind text' }]} />
          <Segmented label="Motion" value={selected.motion} onChange={v => patch(selected.id, { motion: v })}
            options={[{ value: 'float', label: 'Float' }, { value: 'sway', label: 'Sway' }, { value: 'twinkle', label: 'Twinkle' }, { value: 'spin', label: 'Spin' }, { value: 'none', label: 'Still' }]} />
          <div className="self-end"><Toggle checked={selected.mobile} onChange={v => patch(selected.id, { mobile: v })} label="Show on phones" sub="Turn off for large pieces that would crowd a small screen" /></div>
        </div>
      )}

      {/* the pack */}
      <div className="rounded-2xl border border-line bg-white p-3">
        <div className="mb-2 flex items-center gap-2 font-sans">
          <Icon name="sparkle" className="size-4 text-flash" /><p className="text-[13px] font-semibold">Decorations</p>
          <p className="text-[12px] text-muted">Drag onto the preview, or click to add · {items.length}/16</p>
          <span className="flex-1" />
          {items.length > 0 && <button type="button" onClick={() => { if (confirm('Remove every decoration from this one?')) { onChange([]); setSel(null); } }} className="font-sans text-[12px] text-muted hover:text-ink">Clear all</button>}
        </div>
        {DECOR_PACKS.map(pack => (
          <div key={pack.key}>
            <p className="mb-1.5 font-sans text-[11.5px] font-semibold uppercase tracking-wider text-muted">{pack.label}</p>
            <ul className="flex flex-wrap gap-2">
              {pack.items.map(it => (
                <li key={it.src}>
                  <button type="button" draggable onDragStart={e => { e.dataTransfer.setData(MIME, JSON.stringify({ src: it.src, w: it.w })); e.dataTransfer.effectAllowed = 'copy'; }}
                    onClick={() => add(it.src, it.w)} title={`${it.label}: drag onto the preview or click to add`}
                    className="group grid w-[76px] cursor-grab place-items-center gap-1 rounded-xl border border-line bg-[#0B1B4D] p-1.5 pb-1 transition hover:-translate-y-0.5 hover:border-glacier active:cursor-grabbing">
                    <span className="grid h-11 w-full place-items-center transition group-hover:scale-110"><span className="block w-full max-h-11 overflow-hidden"><DecorVisual src={it.src} /></span></span>
                    <span className="w-full truncate text-center font-sans text-[10.5px] font-medium text-white/80">{it.label}</span>
                  </button>
                </li>
              ))}
              <li>
                <input ref={file} type="file" accept="image/png,image/webp,image/gif" className="sr-only" tabIndex={-1} onChange={async e => {
                  const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
                  setBusy(true); try { add((await uploadMedia(f, () => {})).src); } catch (err) { toast(false, err instanceof Error ? err.message : 'The upload failed.'); } finally { setBusy(false); }
                }} />
                <button type="button" onClick={() => file.current?.click()} className="grid h-full min-h-[70px] w-[76px] place-items-center rounded-xl border-2 border-dashed border-[#C9D2E3] p-1.5 text-center font-sans text-[10.5px] font-semibold text-muted hover:border-deep-current hover:text-deep-current">
                  <span><Icon name="upload" className="mx-auto mb-1 size-4" />Your own PNG</span>
                </button>
              </li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
