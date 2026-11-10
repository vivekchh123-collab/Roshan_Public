import { db } from '@/lib/supabase';
import AdCarousel from '@/components/AdCarousel';
import AnnouncementBar from '@/components/AnnouncementBar';
import type { Announcement } from '@/lib/types';

export const revalidate = 30;

export default async function Home() {
  const sb = db();
  const [{ data: ann }, { data: ads }] = await Promise.all([
    sb.from('settings').select('value').eq('key', 'announcement').maybeSingle(),
    sb.from('ads').select('image_url').order('sort').order('created_at'),
  ]);
  const text: Announcement = (ann?.value as Announcement) ?? {
    en: 'Welcome to the Roshan Tubes family',
    hi: 'रोशन ट्यूब्स परिवार में आपका स्वागत है',
  };
  return (
    <>
      <AnnouncementBar text={text} />
      <AdCarousel images={(ads ?? []).map((a) => a.image_url)} />
    </>
  );
}
