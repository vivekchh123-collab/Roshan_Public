'use client';
import { useApp } from '@/components/Providers';

export default function About() {
  const { tx } = useApp();
  const promises = [
    ['10+ Years of Trust', 'A legacy of dedicated and honest customer service in the region since 2015.',
      '10+ सालों का अटूट भरोसा', 'साल 2015 से क्षेत्र के ग्राहकों की ईमानदारी से सेवा करने का लंबा अनुभव।'],
    ['5 Years of Free Service', 'We provide a 100% guarantee of free maintenance for 5 years when you install a solar system with us.',
      '5 साल की मुफ़्त सर्विस', 'रोशन ट्यूब्स से सोलर सिस्टम लगवाने पर आपको 5 साल की मुफ़्त सर्विस की 100% गारंटी मिलती है, ताकि आप मेंटेनेंस की चिंता भूल जाएं।'],
    ['Timely Maintenance', 'Our expert team conducts an automatic, free service visit every 4 months to ensure your system performs flawlessly without any interruptions.',
      'समय पर मेंटेनेंस', 'आपके सिस्टम की परफॉरमेंस हमेशा सर्वश्रेष्ठ बनी रहे, इसके लिए हमारी एक्सपर्ट टीम हर 4 महीने पर आपके घर आकर मुफ़्त जांच (ऑटोमैटिक फ्री सर्विस विजिट) करेगी।'],
    ['Complete Subsidy Support', 'As an authorized vendor, we make the government subsidy process completely transparent and hassle-free for you.',
      'सरकारी सब्सिडी में पूरी मदद', 'अधिकृत वेंडर होने के नाते, हम आपके लिए सरकारी सब्सिडी की पूरी प्रक्रिया को पारदर्शी और बेहद आसान बनाते हैं।'],
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-brand-navy dark:text-white">{tx('About Us', 'हमारे बारे में')}</h1>
      <p className="mt-2 text-lg font-semibold text-brand-red">{tx('“Illuminating Homes, Illuminating the Future”', '“घर भी रोशन, भविष्य भी रोशन”')}</p>

      <p className="mt-4 leading-relaxed">
        {tx(
          'Located in Maharajganj, Ghazipur (Uttar Pradesh), Roshan Tubes is a trusted and leading name in electrical, hardware, and clean energy solutions. Since 2015, we have been committed to delivering high-quality products and exceptional service to thousands of satisfied customers over our 10+ years of honest operation.',
          'महाराजगंज, गाजीपुर (उत्तर प्रदेश) में स्थित, रोशन ट्यूब्स इलेक्ट्रिकल, हार्डवेयर और नवीकरणीय ऊर्जा (Clean Energy) समाधानों के क्षेत्र में एक विश्वसनीय और अग्रणी नाम है। साल 2015 से हम लगातार उच्च गुणवत्ता वाले इलेक्ट्रिकल और हार्डवेयर प्रोडक्ट्स की बिक्री एवं बेहतरीन सेवाएं प्रदान करते आ रहे हैं, और पिछले 10+ सालों में हमने हज़ारों ग्राहकों का अटूट भरोसा जीता है।'
        )}
      </p>
      <p className="mt-4 leading-relaxed">
        {tx(
          'Understanding the modern need for clean energy, we are registered as an Authorized Vendor under the Government of India\'s ambitious “PM Surya Ghar: Muft Bijli Yojana.” Our primary objective is to connect every household with solar energy, making them self-reliant and providing 100% freedom from heavy electricity bills.',
          'समय के साथ आधुनिक और स्वच्छ ऊर्जा की जरूरतों को समझते हुए, हम भारत सरकार की महत्वाकांक्षी ‘पीएम सूर्य घर: मुफ्त बिजली योजना’ के अंतर्गत एक अधिकृत वेंडर (Authorized Vendor) के रूप में पंजीकृत हैं। हमारा मुख्य उद्देश्य हर घर को सौर ऊर्जा से जोड़कर आत्मनिर्भर बनाना और आपको बिजली के भारी बिलों से 100% आज़ादी दिलाना है।'
        )}
      </p>

      <h2 className="mt-8 text-xl font-extrabold">{tx('Our Promise & Speciality', 'हमारा वादा (Our Promise)')}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {promises.map(([te, de, th, dh]) => (
          <li key={te} className="card">
            <p className="font-bold text-brand-blue">{tx(te, th)}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{tx(de, dh)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
