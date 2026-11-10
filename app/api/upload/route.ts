import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getEmployee } from '@/lib/auth';
import { db } from '@/lib/supabase';

export const runtime = 'nodejs';

// Employee uploads ONE file (already compressed by the browser) to a private bucket.
// Files are auto-deleted after 7 days by /api/cron/cleanup.
export async function POST(req: Request) {
  if (!(await getEmployee())) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const f = (await req.formData()).get('file');
  if (!(f instanceof File) || f.size === 0) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (f.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 4 MB)' }, { status: 413 });
  const ext = f.type === 'image/png' ? 'png' : f.type === 'application/pdf' ? 'pdf' : f.type.startsWith('image/') ? 'jpg' : '';
  if (!ext) return NextResponse.json({ error: 'Only images or PDF allowed' }, { status: 415 });
  const path = `uploads/${randomUUID()}.${ext}`;
  const { error } = await db().storage.from('customer-docs').upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path });
}
