import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { enquiries } from '@/lib/db/schema';
import { botReply, type ChatMsg } from '@/lib/chatbot';
import { createEnquiry } from '@/lib/enquiries';
import { randomToken } from '@/lib/numbering';
import { phone as phoneSchema } from '@/lib/validators';

type ChatData = { chatToken: string; transcript: ChatMsg[]; live: boolean; lastSeenAgent?: number };
const now = () => new Date().toISOString();

const body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('ask'), text: z.string().trim().min(1).max(600) }),
  z.object({ action: z.literal('handover'), name: z.string().trim().min(2).max(80), phone: z.string(), transcript: z.array(z.object({ from: z.enum(['user', 'bot', 'agent']), text: z.string().max(2000), at: z.string() })).max(60), page: z.string().max(200).optional() }),
  z.object({ action: z.literal('send'), ref: z.string(), token: z.string(), text: z.string().trim().min(1).max(1000) }),
]);

async function load(ref: string, token: string) {
  const e = await db.query.enquiries.findFirst({ where: eq(enquiries.ref, ref) });
  const d = e?.data as ChatData | undefined;
  if (!e || e.type !== 'chat' || !d || d.chatToken !== token) return null;
  return { e, d };
}

export async function POST(req: Request) {
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const b = p.data;
  if (b.action === 'ask') return NextResponse.json({ reply: { ...botReply(b.text), at: now() } });

  if (b.action === 'handover') {
    const ph = phoneSchema.safeParse(b.phone);
    if (!ph.success) return NextResponse.json({ error: 'Enter a valid 10-digit mobile number' }, { status: 422 });
    const token = randomToken();
    const transcript: ChatMsg[] = [...b.transcript, { from: 'bot', text: 'Thanks. Someone from our team will reply here shortly. If you close this window we’ll call you on the number you shared.', at: now() }];
    const e = await createEnquiry({ type: 'chat', name: b.name, phone: ph.data, message: b.transcript.filter(m => m.from === 'user').map(m => m.text).join('\n').slice(0, 2000), data: { chatToken: token, transcript, live: true }, source: b.page ?? 'chat', consent: true }, { silent: true });
    return NextResponse.json({ ref: e.ref, token, transcript });
  }

  const s = await load(b.ref, b.token);
  if (!s) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  const transcript = [...s.d.transcript, { from: 'user' as const, text: b.text, at: now() }].slice(-200);
  await db.update(enquiries).set({ data: { ...s.d, transcript }, status: s.e.status === 'closed' ? 'new' : s.e.status }).where(eq(enquiries.id, s.e.id));
  return NextResponse.json({ transcript });
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const s = await load(u.searchParams.get('ref') ?? '', u.searchParams.get('token') ?? '');
  if (!s) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  return NextResponse.json({ transcript: s.d.transcript, closed: s.e.status === 'closed' });
}
