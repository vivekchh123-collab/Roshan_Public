import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data } = await db().from('notifications').select('id,title,body,created_at').order('created_at', { ascending: false }).limit(20);
  return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'no-store' } });
}
