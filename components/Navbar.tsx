'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SignOutButton, useUser } from '@clerk/nextjs';
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from './Icons';
import NotificationBell from './NotificationBell';
import { useApp } from './Providers';

const OWNER_URL = process.env.NEXT_PUBLIC_OWNER_URL || '#';

export default function Navbar() {
  const { lang, setLang, theme, toggleTheme, tx } = useApp();
  const { isSignedIn, user } = useUser();
  const [open, setOpen] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    if (!isSignedIn) { setIsEmployee(false); return; }
    fetch('/api/me').then((r) => (r.ok ? r.json() : { allowed: false })).then((j) => setIsEmployee(!!j.allowed)).catch(() => {});
  }, [isSignedIn]);

  const links = [
    { href: '/', en: 'Home', hi: 'होम' },
    { href: '/about', en: 'About', hi: 'हमारे बारे में' },
    { href: '/services', en: 'Services', hi: 'सेवाएँ' },
    { href: '/contact', en: 'Contact Us', hi: 'संपर्क करें' },
    { href: '/careers', en: 'Careers', hi: 'करियर' },
    ...(isEmployee ? [{ href: '/customer', en: 'Customer Detail', hi: 'ग्राहक विवरण' }] : []),
    { href: '/plans', en: 'Plans', hi: 'प्लान' },
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-3">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <img src="/logo.png" alt="Roshan Tubes logo" className="h-9 w-9 rounded-full object-cover" />
            <span className="text-lg font-extrabold tracking-tight text-brand-navy dark:text-white">Roshan Tubes</span>
          </Link>
          <div className="flex items-center gap-1">
            {/* Language: A = English, अ = Hindi */}
            <div className="flex overflow-hidden rounded-lg border border-slate-300 text-sm font-bold dark:border-slate-700" role="group" aria-label="Language">
              <button onClick={() => setLang('en')} className={`px-2.5 py-1 ${lang === 'en' ? 'bg-brand-blue text-white' : ''}`} aria-pressed={lang === 'en'}>A</button>
              <button onClick={() => setLang('hi')} className={`px-2.5 py-1 ${lang === 'hi' ? 'bg-brand-blue text-white' : ''}`} aria-pressed={lang === 'hi'}>अ</button>
            </div>
            <button onClick={toggleTheme} aria-label="Toggle dark mode" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <NotificationBell />
            <button onClick={() => setOpen(true)} aria-label="Menu" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><MenuIcon /></button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <nav className="absolute right-0 top-0 flex h-full w-72 flex-col bg-white p-4 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-extrabold">{tx('Menu', 'मेन्यू')}</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu"><CloseIcon /></button>
            </div>
            <ul className="space-y-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">
                    {tx(l.en, l.hi)}
                  </Link>
                </li>
              ))}
              <li>
                <a href={OWNER_URL} className="block rounded-xl px-3 py-3 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">
                  {tx('Owner Registration', 'ओनर रजिस्ट्रेशन')}
                </a>
              </li>
            </ul>

            {/* Employee login / sign up (bottom of the menu) */}
            <div className="mt-auto border-t border-slate-200 pt-3 dark:border-slate-800">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{tx('For employees only', 'केवल कर्मचारियों के लिए')}</p>
              {isSignedIn ? (
                <>
                  <p className="truncate px-3 pb-2 text-xs text-slate-500">{user?.primaryEmailAddress?.emailAddress}</p>
                  <SignOutButton redirectUrl="/">
                    <button onClick={() => setOpen(false)} className="btn w-full !bg-brand-red">{tx('Logout', 'लॉग आउट')}</button>
                  </SignOutButton>
                </>
              ) : (
                <div className="space-y-1">
                  <Link href="/sign-in" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">{tx('Login (employees)', 'लॉगिन (कर्मचारी)')}</Link>
                  <Link href="/sign-up" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">{tx('Sign up', 'साइन अप')}</Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
