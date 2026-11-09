'use client';
/* eslint-disable @next/next/no-img-element -- previews of uploaded and hosted media */
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { MediaItem } from '@/lib/site-content';
import { Label } from './fields';

type Accept = 'image' | 'video' | 'both';
type LibFile = { src: string; name: string; type: 'image' | 'video'; size?: number };
const TOAST = 'dvine-admin-toast';
const toast = (ok: boolean, message: string) => window.dispatchEvent(new CustomEvent(TOAST, { detail: { ok, message } }));
const isVideo = (src: string) => /\.(mp4|webm|mov)(\?|$)/i.test(src);

/** Uploads one file to the media library with progress. Resolves to the stored file. */
export function uploadMedia(file: File, onProgress: (p: number) => void): Promise<LibFile> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('POST', '/api/admin/media');
    x.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total);
    x.onload = () => {
      let r: { error?: string } & LibFile;
      try { r = JSON.parse(x.responseText); } catch { return reject(new Error('The upload failed.')); }
      if (x.status >= 400 || r.error) reject(new Error(r.error ?? 'The upload failed.')); else resolve(r);
    };
    x.onerror = () => reject(new Error('The upload failed. Check your connection.'));
    const fd = new FormData(); fd.append('file', file); x.send(fd);
  });
}

/**
 * Photo or video for a promotion: drop a file onto it, click to upload, pick from the library (uploads and the
 * site's own photos), or paste a hosted link. Shows a live preview with replace / remove.
 */
export function MediaField({ label, value, onChange, accept = 'both', siteImages = [], hint, compact = false }: {
  label: string; value: MediaItem | null; onChange: (m: MediaItem | null) => void; accept?: Accept; siteImages?: string[]; hint?: string; compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [lib, setLib] = useState(false);
  const [url, setUrl] = useState(false);

  const take = async (file?: File | null) => {
    if (!file) return;
    const video = file.type.startsWith('video');
    if (accept === 'image' && video) return toast(false, 'This spot takes a photo, not a video.');
    if (accept === 'video' && !video) return toast(false, 'This spot takes a video.');
    setProgress(0);
    try {
      const r = await uploadMedia(file, setProgress);
      onChange({ type: r.type, src: r.src, poster: value?.poster ?? '', alt: value?.alt || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') });
      toast(true, `${r.type === 'video' ? 'Video' : 'Photo'} uploaded.`);
    } catch (e) { toast(false, e instanceof Error ? e.message : 'The upload failed.'); }
    finally { setProgress(null); }
  };
  const types = accept === 'image' ? 'image/*' : accept === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*,video/mp4,video/webm,video/quicktime';
  const what = accept === 'image' ? 'a photo' : accept === 'video' ? 'a video' : 'a photo or video';

  const drop = {
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setOver(true); } },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => { if (!e.dataTransfer.files.length) return; e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); },
  };

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <input ref={input} type="file" accept={types} className="sr-only" tabIndex={-1} onChange={e => { take(e.target.files?.[0]); e.target.value = ''; }} />
      {value?.src ? (
        <div {...drop} className={`group relative overflow-hidden rounded-2xl border bg-[#0B1B4D] ${over ? 'border-deep-current ring-4 ring-deep-current/20' : 'border-line'}`}>
          <div className={`relative ${compact ? 'aspect-[16/9]' : 'aspect-[16/8]'}`}>
            {value.type === 'video'
              ? <video src={value.src} poster={value.poster || undefined} className="absolute inset-0 size-full object-cover" muted loop playsInline autoPlay />
              : <img src={value.src} alt="" className="absolute inset-0 size-full object-contain" />}
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 font-sans text-[11px] font-semibold text-white backdrop-blur"><Icon name={value.type === 'video' ? 'video' : 'image'} className="size-3.5" />{value.type === 'video' ? 'Video' : 'Photo'}</span>
            {over && <div className="absolute inset-0 grid place-items-center bg-deep-current/70 font-sans text-sm font-semibold text-white">Drop to replace</div>}
            {progress !== null && <Progress p={progress} />}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 bg-white p-2">
            <Btn icon="upload" onClick={() => input.current?.click()}>Replace</Btn>
            <Btn icon="image" onClick={() => setLib(true)}>Library</Btn>
            <Btn icon="external" onClick={() => setUrl(u => !u)}>Link</Btn>
            <span className="flex-1" />
            <Btn icon="trash" danger onClick={() => onChange(null)}>Remove</Btn>
          </div>
        </div>
      ) : (
        <div {...drop} role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
          className={`relative grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed px-4 text-center transition ${compact ? 'py-6' : 'py-9'} ${over ? 'border-deep-current bg-[#E9F1FE]' : 'border-[#C9D2E3] bg-[#F8FAFD] hover:border-deep-current/60 hover:bg-[#F1F5FD]'}`}>
          <div className="font-sans">
            <span className="mx-auto mb-2 grid size-11 place-items-center rounded-full bg-white text-deep-current shadow-[0_2px_8px_rgb(4_22_74/.1)]"><Icon name={accept === 'video' ? 'video' : 'upload'} /></span>
            <p className="text-[14px] font-semibold">Drag {what} here, or click to upload</p>
            <p className="mt-0.5 text-[12px] text-muted">{accept !== 'video' && 'JPG, PNG, WebP up to 15 MB'}{accept === 'both' && ' · '}{accept !== 'image' && 'MP4 or WebM up to 150 MB'}</p>
            <div className="mt-3 flex justify-center gap-2" onClick={e => e.stopPropagation()}>
              <Btn icon="image" onClick={() => setLib(true)}>Choose from library</Btn>
              <Btn icon="external" onClick={() => setUrl(u => !u)}>Paste a link</Btn>
            </div>
          </div>
          {progress !== null && <Progress p={progress} />}
        </div>
      )}
      {url && <UrlInput accept={accept} onDone={src => { if (src) onChange({ type: isVideo(src) ? 'video' : 'image', src, poster: value?.poster ?? '', alt: value?.alt ?? '' }); setUrl(false); }} />}
      {value?.src && (
        <div className={`mt-2 grid gap-2 ${value.type === 'video' ? 'sm:grid-cols-2' : ''}`}>
          <input value={value.alt} maxLength={200} onChange={e => onChange({ ...value, alt: e.target.value })} placeholder={value.type === 'video' ? 'Describe the video (for screen readers)' : 'Describe the photo (for screen readers and Google)'}
            aria-label="Description" className="w-full rounded-lg border border-line bg-white px-3 py-2 font-sans text-[13px] focus:border-deep-current focus:outline-none" />
          {value.type === 'video' && <PosterInput value={value.poster} onChange={poster => onChange({ ...value, poster })} />}
        </div>
      )}
      {lib && <Library accept={accept} siteImages={siteImages} onClose={() => setLib(false)} onPick={f => { onChange({ type: f.type, src: f.src, poster: value?.poster ?? '', alt: value?.alt ?? '' }); setLib(false); }} />}
    </div>
  );
}

function Progress({ p }: { p: number }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-white/80 backdrop-blur-sm">
      <div className="w-2/3 font-sans">
        <p className="mb-2 text-center text-[13px] font-semibold">Uploading… {Math.round(p * 100)}%</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#DDE4F0]"><div className="h-full rounded-full bg-deep-current transition-[width]" style={{ width: `${p * 100}%` }} /></div>
      </div>
    </div>
  );
}

function Btn({ icon, children, onClick, danger = false }: { icon: string; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-sans text-[12.5px] font-semibold transition ${danger ? 'border-transparent text-[#B3261E] hover:bg-[#FCE8E6]' : 'border-line bg-white text-ink hover:border-ink/30'}`}>
      <Icon name={icon} className="size-3.5" />{children}
    </button>
  );
}

function UrlInput({ accept, onDone }: { accept: Accept; onDone: (src: string) => void }) {
  const [v, setV] = useState('');
  return (
    <form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); onDone(v.trim()); }}>
      <input autoFocus value={v} onChange={e => setV(e.target.value)} placeholder={accept === 'video' ? 'https://…/video.mp4' : 'https://… or /images/…'} aria-label="Media link"
        className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 font-mono text-[12.5px] focus:border-deep-current focus:outline-none" />
      <button className="rounded-lg bg-ink px-3 font-sans text-[13px] font-semibold text-white">Use link</button>
      <button type="button" onClick={() => onDone('')} className="rounded-lg px-2 font-sans text-[13px] text-muted">Cancel</button>
    </form>
  );
}

function PosterInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={async e => {
        const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
        setBusy(true);
        try { onChange((await uploadMedia(f, () => {})).src); toast(true, 'Cover image uploaded.'); } catch (err) { toast(false, err instanceof Error ? err.message : 'The upload failed.'); }
        finally { setBusy(false); }
      }} />
      {value && <img src={value} alt="" className="h-9 w-14 rounded object-cover" />}
      <button type="button" onClick={() => input.current?.click()} className="flex-1 rounded-lg border border-dashed border-line px-3 py-2 text-left font-sans text-[12.5px] text-muted hover:border-ink/30">
        {busy ? 'Uploading…' : value ? 'Change cover image' : 'Add a cover image (shown while the video loads)'}
      </button>
      {value && <button type="button" onClick={() => onChange('')} className="font-sans text-[12px] text-muted hover:text-ink">Clear</button>}
    </div>
  );
}

/** Media library: everything uploaded so far, plus the photos already on the site. Files can be dropped in here too. */
function Library({ accept, siteImages, onClose, onPick }: { accept: Accept; siteImages: string[]; onClose: () => void; onPick: (f: LibFile) => void }) {
  const [files, setFiles] = useState<LibFile[] | null>(null);
  const [tab, setTab] = useState<'uploads' | 'site'>('uploads');
  const [progress, setProgress] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const load = () => fetch('/api/admin/media').then(r => r.json()).then(r => setFiles(r.files ?? [])).catch(() => setFiles([]));
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    load(); const k = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  const ok = (f: LibFile) => accept === 'both' || f.type === accept;
  const site: LibFile[] = siteImages.map(src => ({ src, name: src.split('/').pop()!, type: isVideo(src) ? 'video' : 'image' }));
  const list = (tab === 'uploads' ? files ?? [] : site).filter(ok);
  const add = async (file?: File) => {
    if (!file) return; setProgress(0);
    try { await uploadMedia(file, setProgress); await load(); setTab('uploads'); } catch (e) { toast(false, e instanceof Error ? e.message : 'The upload failed.'); }
    finally { setProgress(null); }
  };
  const remove = async (f: LibFile) => {
    if (!confirm(`Delete ${f.name} from the library? Anything still using it will lose the picture.`)) return;
    await fetch(`/api/admin/media?name=${encodeURIComponent(f.name)}`, { method: 'DELETE' }); load();
  };
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-stage-deep/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Media library" onClick={onClose}
      onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); add(e.dataTransfer.files[0]); }}>
      <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <h2 className="font-sans text-lg font-bold">Media library</h2>
          <div className="ml-2 inline-flex rounded-xl bg-[#EEF1F7] p-1">
            {(['uploads', 'site'] as const).map(t => <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-lg px-3 py-1 font-sans text-[13px] font-semibold ${tab === t ? 'bg-white shadow-sm' : 'text-muted'}`}>{t === 'uploads' ? 'Your uploads' : 'Site photos'}</button>)}
          </div>
          <span className="flex-1" />
          <input ref={input} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="sr-only" tabIndex={-1} onChange={e => { add(e.target.files?.[0]); e.target.value = ''; }} />
          <button type="button" onClick={() => input.current?.click()} className="btn btn-primary btn-sm min-h-9"><Icon name="upload" className="size-4" />Upload</button>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-[#EEF1F7]" aria-label="Close"><Icon name="close" /></button>
        </div>
        {progress !== null && <div className="h-1 bg-[#EEF1F7]"><div className="h-full bg-deep-current transition-[width]" style={{ width: `${progress * 100}%` }} /></div>}
        <div className="overflow-y-auto p-5">
          {tab === 'uploads' && files === null && <p className="py-10 text-center font-sans text-sm text-muted">Loading…</p>}
          {files !== null && list.length === 0 && <p className="py-12 text-center font-sans text-sm text-muted">{tab === 'uploads' ? 'Nothing uploaded yet. Drop files here or press Upload.' : 'No matching site photos.'}</p>}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {list.map(f => (
              <li key={f.src} className="group relative">
                <button type="button" onClick={() => onPick(f)} className="block w-full overflow-hidden rounded-xl border border-line bg-[#0B1B4D] text-left ring-deep-current transition hover:ring-2">
                  <div className="relative aspect-[4/3]">
                    {f.type === 'video' ? <video src={f.src} className="absolute inset-0 size-full object-cover" muted preload="metadata" /> : <img src={f.src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />}
                    {f.type === 'video' && <span className="absolute top-1.5 left-1.5 rounded-full bg-black/60 p-1 text-white"><Icon name="play" className="size-3" /></span>}
                  </div>
                  <p className="truncate bg-white px-2 py-1.5 font-sans text-[11.5px] text-muted">{f.name}</p>
                </button>
                {tab === 'uploads' && <button type="button" onClick={() => remove(f)} className="absolute top-1.5 right-1.5 hidden size-7 place-items-center rounded-full bg-white/90 text-[#B3261E] shadow group-hover:grid" aria-label={`Delete ${f.name}`}><Icon name="trash" className="size-3.5" /></button>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
