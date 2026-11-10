'use client';
import { useApp } from '@/components/Providers';

const SERVICES: [string, string, string, string][] = [
  ['On-Grid Solar Systems', 'Grid-connected rooftop solar with net metering that cuts your monthly electricity bill.',
    'ऑन-ग्रिड सोलर सिस्टम', 'नेट मीटरिंग के साथ ग्रिड-कनेक्टेड रूफटॉप सोलर, जो आपका मासिक बिजली बिल घटाता है।'],
  ['Off-Grid Solar Systems', 'Stand-alone solar with batteries for homes and shops with unreliable or no grid supply.',
    'ऑफ-ग्रिड सोलर सिस्टम', 'बैटरी के साथ स्वतंत्र सोलर सिस्टम — जहाँ बिजली अनियमित या उपलब्ध नहीं है।'],
  ['Hybrid Solar Systems', 'Solar plus battery backup plus grid: savings during the day and power during outages.',
    'हाइब्रिड सोलर सिस्टम', 'सोलर + बैटरी बैकअप + ग्रिड: दिन में बचत और कटौती में भी बिजली।'],
  ['Battery & Inverter Solutions', 'Tubular and lithium-ion batteries with reliable inverters from trusted brands.',
    'बैटरी और इन्वर्टर समाधान', 'भरोसेमंद ब्रांड के इन्वर्टर के साथ ट्यूबलर और लिथियम-आयन बैटरी।'],
  ['AMC (Annual Maintenance Contract) & Service Support', 'Scheduled maintenance and prompt service so your system keeps performing at its best.',
    'AMC (वार्षिक रखरखाव अनुबंध) और सर्विस सपोर्ट', 'समय-समय पर रखरखाव और त्वरित सेवा, ताकि आपका सिस्टम हमेशा बेहतर चले।'],
  ['Complimentary Site Visits', 'Our team visits your site to assess roof space, load and the right system size at no cost.',
    'निःशुल्क साइट विज़िट', 'हमारी टीम आपकी छत, लोड और सही सिस्टम साइज़ का मुफ़्त आकलन करती है।'],
  ['Free Expert Consultation & Guidance', 'Honest, practical advice on capacity, brands, budget and subsidy before you decide.',
    'निःशुल्क विशेषज्ञ परामर्श और मार्गदर्शन', 'क्षमता, ब्रांड, बजट और सब्सिडी पर निर्णय से पहले ईमानदार और व्यावहारिक सलाह।'],
  ['Complete Registration Assistance', 'End-to-end help with PM Surya Ghar registration, documents, net metering and subsidy.',
    'संपूर्ण पंजीकरण सहायता', 'पीएम सूर्य घर रजिस्ट्रेशन, दस्तावेज़, नेट मीटरिंग और सब्सिडी में शुरू से अंत तक मदद।'],
];

export default function Services() {
  const { tx } = useApp();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-brand-navy dark:text-white">{tx('Our Services', 'हमारी सेवाएँ')}</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {SERVICES.map(([te, de, th, dh]) => (
          <div key={te} className="card">
            <p className="font-bold text-brand-blue">{tx(te, th)}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{tx(de, dh)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
