import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export const runtime = 'nodejs';

// Runs daily (vercel.json). Deletes uploaded customer documents older than 7 days.
export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const bucket = db().storage.from('customer-docs');
  const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
  let removed = 0;
  for (;;) {
    const { data } = await bucket.list('uploads', { limit: 500, sortBy: { column: 'created_at', order: 'asc' } });
    const old = (data ?? []).filter((f) => f.created_at && new Date(f.created_at).getTime() < cutoff).map((f) => `uploads/${f.name}`);
    if (old.length === 0) break;
    await bucket.remove(old);
    removed += old.length;
    if (old.length < 500) break;
  }
  return NextResponse.json({ removed });
}
