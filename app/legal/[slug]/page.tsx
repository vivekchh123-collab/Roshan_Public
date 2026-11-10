'use client';
import { useParams } from 'next/navigation';
import { useApp } from '@/components/Providers';

const DOCS: Record<string, { en: [string, string[]]; hi: [string, string[]] }> = {
  terms: {
    en: ['Terms of Use', [
      'Information on this website is provided for general guidance. Prices, subsidy amounts and product specifications may change; the final quotation is confirmed in writing by Roshan Tubes.',
      'Government subsidy under PM Surya Ghar: Muft Bijli Yojana is subject to the scheme rules and approval by the authorities. Roshan Tubes assists with the process but does not control approval or timing.',
      'Employee and owner areas are restricted to authorised users. Misuse may result in access being removed.',
    ]],
    hi: ['उपयोग की शर्तें', [
      'इस वेबसाइट की जानकारी सामान्य मार्गदर्शन के लिए है। कीमतें, सब्सिडी राशि और प्रोडक्ट विवरण बदल सकते हैं; अंतिम कोटेशन रोशन ट्यूब्स लिखित रूप में पुष्टि करेगा।',
      'पीएम सूर्य घर: मुफ्त बिजली योजना की सब्सिडी योजना के नियमों और अधिकारियों की मंज़ूरी पर निर्भर है। रोशन ट्यूब्स प्रक्रिया में सहायता करता है, पर मंज़ूरी या समय पर उसका नियंत्रण नहीं है।',
      'कर्मचारी और ओनर क्षेत्र केवल अधिकृत उपयोगकर्ताओं के लिए हैं। दुरुपयोग पर पहुँच हटाई जा सकती है।',
    ]],
  },
  privacy: {
    en: ['Privacy Policy', [
      'We collect only what is needed to serve you: your name, mobile number and site location when you or our field staff submit an inquiry; and details you send through the Careers form.',
      'Identity and bill documents shared for solar registration are used only for that purpose, are kept in temporary storage and are automatically deleted within 7 days. Career application details are sent to the owner by email and are not kept in our database.',
      'We do not sell your information. To ask for correction or removal, call or email us from the Contact Us page.',
    ]],
    hi: ['गोपनीयता नीति', [
      'हम केवल वही जानकारी लेते हैं जो आपकी सेवा के लिए ज़रूरी है: आपका नाम, मोबाइल नंबर और साइट की लोकेशन, तथा करियर फ़ॉर्म में दी गई जानकारी।',
      'सोलर रजिस्ट्रेशन के लिए दिए गए पहचान और बिल दस्तावेज़ केवल उसी उद्देश्य के लिए उपयोग होते हैं, अस्थायी स्टोरेज में रखे जाते हैं और 7 दिनों के भीतर अपने-आप हटा दिए जाते हैं। करियर आवेदन की जानकारी ओनर को ईमेल से भेजी जाती है और हमारे डेटाबेस में नहीं रखी जाती।',
      'हम आपकी जानकारी बेचते नहीं हैं। सुधार या हटाने के लिए संपर्क पेज से हमें कॉल या ईमेल करें।',
    ]],
  },
  security: {
    en: ['Security', [
      'Employee and owner logins are protected by verified email authentication, and only people approved by the owner can sign in.',
      'Documents are uploaded over encrypted connections and kept in private storage with time-limited links.',
      'If you notice anything suspicious, please contact us immediately at roshantubessolar@gmail.com.',
    ]],
    hi: ['सुरक्षा', [
      'कर्मचारी और ओनर लॉगिन सत्यापित ईमेल प्रमाणीकरण से सुरक्षित हैं, और केवल ओनर द्वारा अनुमत लोग ही लॉगिन कर सकते हैं।',
      'दस्तावेज़ एन्क्रिप्टेड कनेक्शन से अपलोड होते हैं और समय-सीमित लिंक के साथ निजी स्टोरेज में रखे जाते हैं।',
      'कुछ संदिग्ध लगे तो तुरंत roshantubessolar@gmail.com पर संपर्क करें।',
    ]],
  },
};

export default function Legal() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useApp();
  const doc = DOCS[slug];
  if (!doc) return <div className="p-8">Not found</div>;
  const [title, paras] = doc[lang];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-brand-navy dark:text-white">{title}</h1>
      <div className="mt-4 space-y-3 leading-relaxed">{paras.map((p, i) => <p key={i}>{p}</p>)}</div>
    </div>
  );
}
