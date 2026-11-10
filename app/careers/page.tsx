import { db } from '@/lib/supabase';
import CareersForm from '@/components/CareersForm';

export const revalidate = 30;

export default async function Careers() {
  const { data } = await db().from('settings').select('key,value').in('key', ['careers_technical', 'careers_field']);
  const get = (k: string) => (data?.find((d) => d.key === k)?.value ?? true) === true;
  return <CareersForm technical={get('careers_technical')} field={get('careers_field')} />;
}
