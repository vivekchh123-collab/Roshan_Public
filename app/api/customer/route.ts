import { NextResponse } from 'next/server';
import { getEmployee } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { sendWhatsApp } from '@/lib/whatsapp';
import { notifyOwner } from '@/lib/notify';

export const runtime = 'nodejs';

const DOC_LABEL: Record<string, string> = {
  site: 'GPS-tagged site photo',
  pan: 'PAN card',
  aadhaar: 'Aadhaar card',
  bill: 'Electricity bill',
  bank: 'Bank passbook',
};

export async function POST(req: Request) {
  const emp = await getEmployee();
  if (!emp) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const name = String(b.name || '').trim().slice(0, 100);
  const mobile = String(b.mobile || '').replace(/\D/g, '');
  const location = String(b.location || '').trim().slice(0, 300);
  const lat = Number(b.lat), lng = Number(b.lng);
  const interested = b.interested === true;
  const reason = String(b.reason || '').trim().slice(0, 500);
  const callback = b.callback ? new Date(String(b.callback)) : null;
  const files: Record<string, string> = typeof b.files === 'object' && b.files ? b.files : {};

  if (!name || mobile.length !== 10) return NextResponse.json({ error: 'Enter customer name and a 10-digit mobile number.' }, { status: 400 });
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: 'Please capture the current location.' }, { status: 400 });
  if (!interested && (!reason || !callback || isNaN(+callback))) return NextResponse.json({ error: 'Enter the reason and preferred callback date/time.' }, { status: 400 });

  const sb = db();
  const { data: row, error } = await sb
    .from('customers')
    .insert({
      name, mobile, location, lat, lng,
      status: interested ? 'pending' : 'not_interested',
      employee_id: emp.id, employee_name: emp.displayName,
      reason: interested ? null : reason,
      callback_at: interested ? null : callback!.toISOString(),
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 7-day links for uploaded documents (files are deleted automatically after 7 days)
  const lines: string[] = [];
  const missing: string[] = [];
  if (interested) {
    for (const k of Object.keys(DOC_LABEL)) {
      const p = files[k];
      if (typeof p === 'string' && p.startsWith('uploads/')) {
        const { data } = await sb.storage.from('customer-docs').createSignedUrl(p, 7 * 24 * 3600);
        if (data?.signedUrl) { lines.push(`• ${DOC_LABEL[k]}: ${data.signedUrl}`); continue; }
      }
      missing.push(DOC_LABEL[k]);
    }
  }

  const when = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const maps = `https://maps.google.com/?q=${lat},${lng}`;
  const head = interested ? '✅ NEW INTERESTED CUSTOMER' : '❌ CUSTOMER NOT INTERESTED';
  let text = `${head}\nName: ${name}\nMobile: ${mobile}\nLocation: ${location || '-'}\nMap: ${maps}\nEmployee: ${emp.displayName}${emp.mobile ? ` (${emp.mobile})` : ''}\nTime: ${when}`;
  if (interested) {
    text += `\n\nDocuments (links valid 7 days):\n${lines.join('\n') || '—'}`;
    if (missing.length) text += `\n\nNot yet received: ${missing.join(', ')}`;
  } else {
    text += `\n\nReason: ${reason}\nPreferred callback: ${callback!.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
  }

  const n = await notifyOwner(head, text);
  // Optional (paid WhatsApp API only): copy of a not-interested note to the employee's own number
  if (!interested && emp.mobile && process.env.WHATSAPP_TOKEN) await sendWhatsApp(emp.mobile, text);

  return NextResponse.json({ ok: true, id: row.id, notified: n.ok, text });
}
