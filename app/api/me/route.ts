import { NextResponse } from 'next/server';
import { getEmployee } from '@/lib/auth';

export async function GET() {
  const e = await getEmployee();
  return NextResponse.json({ allowed: !!e });
}
