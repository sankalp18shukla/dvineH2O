import { NextResponse } from 'next/server';
import { z } from 'zod';
import { botReply, ChatCtx } from '@/lib/chatbot';
import { limitRequest } from '@/lib/security';

const body = z.object({ text: z.string().trim().min(1).max(600), ctx: ChatCtx.optional() });

/**
 * The chat assistant (src/lib/chatbot.ts): one question in, one answer out, plus the context the widget sends
 * back with the next question. People are reached on WhatsApp, so nothing is stored here.
 */
export async function POST(req: Request) {
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  if (!(await limitRequest('chat'))) return NextResponse.json({ error: 'You’re sending messages too quickly. Please wait a moment.' }, { status: 429 });
  const { reply, ctx } = await botReply(p.data.text, p.data.ctx ?? { misses: 0 });
  return NextResponse.json({ reply: { from: 'bot', ...reply, at: new Date().toISOString() }, ctx });
}
