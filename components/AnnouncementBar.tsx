'use client';
import { useApp } from './Providers';
import type { Announcement } from '@/lib/types';

export default function AnnouncementBar({ text }: { text: Announcement }) {
  const { lang } = useApp();
  const msg = (lang === 'hi' ? text.hi : text.en) || text.en || text.hi;
  if (!msg) return null;
  return (
    <div className="h-8 overflow-hidden bg-brand-blue text-white" role="status">
      <div className="flex h-full items-center whitespace-nowrap text-sm font-semibold animate-marquee">{msg}</div>
    </div>
  );
}
