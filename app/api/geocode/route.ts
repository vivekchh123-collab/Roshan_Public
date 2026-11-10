import { NextResponse } from 'next/server';
import { getEmployee } from '@/lib/auth';

// Reverse geocoding (coordinates -> readable address) for the employee's current location.
export async function GET(req: Request) {
  if (!(await getEmployee())) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get('lat'));
  const lng = Number(u.searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: 'Bad coordinates' }, { status: 400 });
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&accept-language=en`, {
      headers: { 'User-Agent': 'RoshanTubes/1.0 (roshantubessolar@gmail.com)' },
    });
    const j = await r.json();
    return NextResponse.json({ address: (j.display_name as string) || '' });
  } catch {
    return NextResponse.json({ address: '' });
  }
}
