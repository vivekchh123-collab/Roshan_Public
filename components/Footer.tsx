'use client';
import Link from 'next/link';
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from './Icons';
import { useApp } from './Providers';

export default function Footer() {
  const { tx } = useApp();

  const pages = [
    ['/', 'Home', 'होम'], ['/about', 'About', 'हमारे बारे में'], ['/services', 'Services', 'सेवाएँ'],
    ['/contact', 'Contact Us', 'संपर्क'], ['/careers', 'Careers', 'करियर'], ['/plans', 'Plans', 'प्लान'],
  ];

  return (
    <footer className="mt-10 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Roshan Tubes logo" className="h-10 w-10 rounded-full object-cover" />
          <span className="text-xl font-extrabold text-brand-navy dark:text-white">Roshan Tubes</span>
        </div>
        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
          {tx('High-performance solar systems and measurable, reliable green energy delivering value for your home.',
              'उच्च-प्रदर्शन सोलर सिस्टम और भरोसेमंद, मापने योग्य ग्रीन एनर्जी — आपके घर के लिए वास्तविक मूल्य।')}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-slate-500"><FacebookIcon width={20} height={20} /> {tx('Coming soon', 'जल्द आ रहा है')}</span>
          <span className="flex items-center gap-1.5 text-slate-500"><InstagramIcon width={20} height={20} /> {tx('Coming soon', 'जल्द आ रहा है')}</span>
          <a href="https://wa.me/917376721717" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-semibold text-green-600">
            <WhatsAppIcon width={22} height={22} /> 7376721717
          </a>
        </div>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          {pages.map(([h, en, hi]) => (
            <li key={h}><Link href={h} className="hover:text-brand-blue">{tx(en, hi)}</Link></li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-3 text-xs text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-6 w-6 rounded-full object-cover" />
            © 2026 Roshan Tubes. All Rights Reserved.
          </span>
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/legal/terms" className="hover:underline">{tx('Terms', 'नियम')}</Link>
            <Link href="/legal/privacy" className="hover:underline">{tx('Privacy', 'गोपनीयता')}</Link>
            <Link href="/legal/security" className="hover:underline">{tx('Security', 'सुरक्षा')}</Link>
            <span>{tx('Feedback — coming soon', 'फीडबैक — जल्द आ रहा है')}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
