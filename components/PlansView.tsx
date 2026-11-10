'use client';
import { useState } from 'react';
import { useApp } from './Providers';
import type { Brand, Plan } from '@/lib/types';

const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function PlansView({ brands, plans }: { brands: Brand[]; plans: Plan[] }) {
  const { tx } = useApp();
  const [slug, setSlug] = useState<string | null>(null);
  const [cat, setCat] = useState<'on-grid' | 'hybrid'>('on-grid');
  const brand = brands.find((b) => b.slug === slug);

  if (!brand) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-brand-navy dark:text-white">{tx('Solar Plans', 'सोलर प्लान')}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">{tx('Choose a brand to see packages, subsidy and the amount you pay.', 'पैकेज, सब्सिडी और आपके द्वारा देय राशि देखने के लिए ब्रांड चुनें।')}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {brands.map((b) => (
            <button key={b.id} disabled={b.coming_soon} onClick={() => setSlug(b.slug)} className="card overflow-hidden p-0 text-left transition hover:shadow-md disabled:opacity-70">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-brand-blue to-brand-navy">
                {b.image_url && <img src={b.image_url} alt={b.name} className="h-full w-full object-cover" />}
                {b.coming_soon && (
                  <span className="absolute right-2 top-2 rounded-full bg-brand-sun px-3 py-1 text-xs font-bold text-black">{tx('Coming soon', 'जल्द आ रहा है')}</span>
                )}
              </div>
              <div className="p-4">
                <p className="text-lg font-extrabold">{b.name}</p>
                {b.tag && <p className="text-sm font-semibold text-brand-red">{b.tag}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const rows = plans.filter((p) => p.brand_id === brand.id && p.category === cat);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <button onClick={() => setSlug(null)} className="mb-3 text-sm font-semibold text-brand-blue">← {tx('All brands', 'सभी ब्रांड')}</button>
      <h1 className="text-3xl font-extrabold text-brand-navy dark:text-white">{brand.name}</h1>
      {brand.tag && <p className="font-semibold text-brand-red">{brand.tag}</p>}
      {brand.note && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">{brand.note}</p>}

      <div className="mt-4 inline-flex overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
        {(['on-grid', 'hybrid'] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`px-5 py-2 text-sm font-bold ${cat === c ? 'bg-brand-blue text-white' : ''}`}>
            {c === 'on-grid' ? tx('On-Grid', 'ऑन-ग्रिड') : tx('Hybrid', 'हाइब्रिड')}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {rows.length === 0 && <p className="text-slate-500">{tx('No plans listed yet.', 'अभी कोई प्लान उपलब्ध नहीं है।')}</p>}
        {rows.map((p) => (
          <div key={p.id} className="card">
            <p className="font-extrabold">{p.title}</p>
            {p.details && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{p.details}</p>}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                <p className="text-[11px] uppercase text-slate-500">{p.per_kw_price ? tx('Price', 'कीमत') : tx('Total cost', 'कुल लागत')}</p>
                <p className="font-bold">{p.per_kw_price ? `${inr(p.per_kw_price)} ${tx('per kW', 'प्रति kW')}` : p.total_cost != null ? inr(p.total_cost) : '—'}</p>
              </div>
              <div className="rounded-xl bg-green-50 p-2 dark:bg-green-950">
                <p className="text-[11px] uppercase text-green-700 dark:text-green-300">{tx('Subsidy', 'सब्सिडी')}</p>
                <p className="font-bold text-green-700 dark:text-green-300">{inr(p.subsidy)}</p>
              </div>
              <div className="rounded-xl bg-brand-blue p-2 text-white">
                <p className="text-[11px] uppercase opacity-80">{tx('You pay', 'आप देंगे')}</p>
                <p className="font-bold">{p.net_cost != null ? inr(p.net_cost) : tx('Price × kW − subsidy', 'कीमत × kW − सब्सिडी')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">{tx('Prices and subsidy are indicative and subject to confirmation at the time of quotation.', 'कीमत और सब्सिडी सांकेतिक हैं और कोटेशन के समय पुष्टि के अधीन हैं।')}</p>
    </div>
  );
}
