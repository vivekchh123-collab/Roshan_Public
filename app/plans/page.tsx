import { db } from '@/lib/supabase';
import PlansView from '@/components/PlansView';
import type { Brand, Plan } from '@/lib/types';

export const revalidate = 30;

export default async function PlansPage() {
  const sb = db();
  const [{ data: brands }, { data: plans }] = await Promise.all([
    sb.from('plan_brands').select('*').order('sort'),
    sb.from('plans').select('*').order('sort'),
  ]);
  return <PlansView brands={(brands ?? []) as Brand[]} plans={(plans ?? []) as Plan[]} />;
}
