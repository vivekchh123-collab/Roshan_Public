import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export async function POST(req: Request) {
  const sub = await req.json().catch(() => null);
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || !p256dh || !auth)
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  await db().from('push_subscriptions').upsert({ endpoint, p256dh, auth }, { onConflict: 'endpoint' });
  return NextResponse.json({ ok: true });
}
