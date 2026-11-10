'use client';
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from '@/components/Icons';
import { useApp } from '@/components/Providers';

const PEOPLE = [
  { name: 'Deep Roshan', phones: ['7376721717', '8765170277'] },
  { name: 'Prakash Roshan', phones: ['8115448044'] },
];

export default function Contact() {
  const { tx } = useApp();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-brand-navy dark:text-white">{tx('Contact Us', 'संपर्क करें')}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        {tx(
          'For product inquiries, solar quotations, subsidy guidance or service requests, please reach out to our team. We respond promptly during business hours.',
          'प्रोडक्ट जानकारी, सोलर कोटेशन, सब्सिडी मार्गदर्शन या सर्विस अनुरोध के लिए कृपया हमारी टीम से संपर्क करें। हम कार्य-समय में शीघ्र उत्तर देते हैं।'
        )}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {PEOPLE.map((p) => (
          <div key={p.name} className="card">
            <p className="font-bold">{p.name}</p>
            {p.phones.map((ph) => (
              <a key={ph} href={`tel:+91${ph}`} className="mt-2 flex items-center gap-2 font-semibold text-brand-blue">
                <PhoneIcon width={18} height={18} /> {ph}
              </a>
            ))}
          </div>
        ))}
        <div className="card sm:col-span-2">
          <a href="mailto:roshantubessolar@gmail.com" className="flex items-center gap-2 font-semibold text-brand-blue">
            <MailIcon width={18} height={18} /> roshantubessolar@gmail.com
          </a>
          <p className="mt-2 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <PinIcon width={18} height={18} className="mt-0.5 shrink-0" /> Roshan Tubes, Maharajganj, Ghazipur, Uttar Pradesh
          </p>
        </div>
      </div>

      <a
        href="https://wa.me/917376721717?text=Hello%20Roshan%20Tubes%2C%20I%20would%20like%20to%20inquire%20about%20solar."
        target="_blank" rel="noopener noreferrer"
        className="btn mt-5 !bg-green-600"
      >
        <WhatsAppIcon width={20} height={20} /> {tx('Chat on WhatsApp: 7376721717', 'WhatsApp पर चैट करें: 7376721717')}
      </a>
    </div>
  );
}
