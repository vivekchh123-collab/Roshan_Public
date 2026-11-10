import { currentUser } from '@clerk/nextjs/server';
import { db } from './supabase';

export type Employee = {
  id: string;
  name: string;
  mobile: string | null;
  email: string;
  displayName: string;
};

/** Returns the logged-in employee ONLY if the owner has allowed this verified email. */
export async function getEmployee(): Promise<Employee | null> {
  const u = await currentUser();
  if (!u) return null;
  const primary = u.primaryEmailAddress;
  const email = primary?.emailAddress?.toLowerCase();
  if (!email || primary?.verification?.status !== 'verified') return null;
  const { data } = await db()
    .from('employees')
    .select('id,name,mobile,email')
    .eq('email', email)
    .eq('allowed', true)
    .maybeSingle();
  if (!data) return null;
  return { ...data, displayName: u.fullName || data.name || email } as Employee;
}
