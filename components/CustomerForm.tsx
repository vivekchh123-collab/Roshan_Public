'use client';
import { useEffect, useRef, useState } from 'react';
import { CameraIcon, UploadIcon } from './Icons';
import { useApp } from './Providers';
import { compressImage, stampPhoto } from '@/lib/image';

type Loc = { lat: number; lng: number; accuracy: number; when: Date };
type DocKey = 'pan' | 'aadhaar' | 'bill' | 'bank';

function FilePick({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File | null) => void }) {
  const { tx } = useApp();
  const cam = useRef<HTMLInputElement>(null);
  const up = useRef<HTMLInputElement>(null);
  const h = (e: React.ChangeEvent<HTMLInputElement>) => { onFile(e.target.files?.[0] ?? null); e.target.value = ''; };
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <p className="text-sm font-bold">{label}</p>
      <div className="mt-2 flex gap-2">
        <button type="button" className="btn-outline flex-1" onClick={() => cam.current?.click()}><CameraIcon width={18} height={18} /> {tx('Take photo', 'फोटो लें')}</button>
        <button type="button" className="btn-outline flex-1" onClick={() => up.current?.click()}><UploadIcon width={18} height={18} /> {tx('Upload', 'अपलोड')}</button>
      </div>
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={h} />
      <input ref={up} type="file" accept="image/*" hidden onChange={h} />
      {file && <p className="mt-2 truncate text-xs text-green-600">✓ {file.name}</p>}
    </div>
  );
}

export default function CustomerForm({ employeeName }: { employeeName: string }) {
  const { tx } = useApp();
  const [raw, setRaw] = useState<File | null>(null);
  const [loc, setLoc] = useState<Loc | null>(null);
  const [address, setAddress] = useState('');
  const [stamped, setStamped] = useState<Blob | null>(null);
  const [preview, setPreview] = useState('');
  const [locBusy, setLocBusy] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [interested, setInterested] = useState<boolean | null>(null);
  const [docs, setDocs] = useState<Record<DocKey, File | null>>({ pan: null, aadhaar: null, bill: null, bank: null });
  const [reason, setReason] = useState('');
  const [callback, setCallback] = useState('');
  const [busy, setBusy] = useState(false);
  const [waText, setWaText] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const photoCam = useRef<HTMLInputElement>(null);
  const photoUp = useRef<HTMLInputElement>(null);

  // Re-draw the GPS strip whenever the photo or location changes
  useEffect(() => {
    let url = '';
    (async () => {
      if (!raw || !loc) { setStamped(null); setPreview(''); return; }
      const blob = await stampPhoto(raw, { employee: employeeName, address, lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy, when: loc.when });
      setStamped(blob);
      url = URL.createObjectURL(blob);
      setPreview(url);
    })().catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [raw, loc, address, employeeName]);

  function getLocation() {
    if (!navigator.geolocation) { setMsg({ ok: false, text: tx('Location is not supported on this device.', 'इस डिवाइस पर लोकेशन उपलब्ध नहीं है।') }); return; }
    setLocBusy(true);
    setMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const l = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, when: new Date() };
        setLoc(l);
        try {
          const r = await fetch(`/api/geocode?lat=${l.lat}&lng=${l.lng}`);
          const j = await r.json();
          setAddress(j.address || `${l.lat.toFixed(6)}, ${l.lng.toFixed(6)}`);
        } catch { setAddress(`${l.lat.toFixed(6)}, ${l.lng.toFixed(6)}`); }
        setLocBusy(false);
      },
      (e) => {
        setLocBusy(false);
        setMsg({ ok: false, text: e.code === 1 ? tx('Location permission was denied. Allow it in browser settings.', 'लोकेशन की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें।') : tx('Could not get location. Try again outdoors.', 'लोकेशन नहीं मिली। खुले में दोबारा कोशिश करें।') });
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  async function upload(blob: Blob, filename: string) {
    const fd = new FormData();
    fd.append('file', blob, filename);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Upload failed');
    return j.path as string;
  }

  async function submit() {
    setMsg(null);
    setWaText('');
    if (!name.trim() || !/^\d{10}$/.test(mobile)) { setMsg({ ok: false, text: tx('Enter customer name and a 10-digit mobile number.', 'ग्राहक का नाम और 10 अंकों का मोबाइल नंबर लिखें।') }); return; }
    if (!loc) { setMsg({ ok: false, text: tx('Tap "Get current location" first.', 'पहले "वर्तमान लोकेशन लें" दबाएँ।') }); return; }
    if (interested === null) { setMsg({ ok: false, text: tx('Choose Interested or Not interested.', 'इच्छुक या अनिच्छुक चुनें।') }); return; }
    if (interested && !stamped) { setMsg({ ok: false, text: tx('Add the site photo (it gets the GPS strip).', 'साइट फोटो जोड़ें (उस पर GPS स्ट्रिप लगेगी)।') }); return; }
    if (!interested && (!reason.trim() || !callback)) { setMsg({ ok: false, text: tx('Enter the reason and callback date/time.', 'कारण और कॉलबैक तारीख/समय लिखें।') }); return; }

    setBusy(true);
    try {
      const files: Record<string, string> = {};
      if (interested) {
        files.site = await upload(stamped!, 'site.jpg');
        for (const k of Object.keys(docs) as DocKey[]) {
          const f = docs[k];
          if (f) files[k] = await upload(await compressImage(f), `${k}.jpg`);
        }
      }
      const r = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, mobile, location: address, lat: loc.lat, lng: loc.lng, interested, reason,
          callback: callback ? new Date(callback).toISOString() : null, files,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Failed');
      setMsg({ ok: true, text: j.notified ? tx('Saved and the owner has been alerted.', 'सेव हो गया और ओनर को अलर्ट भेज दिया गया।') : tx('Saved. The alert could not be sent — tap the WhatsApp button below.', 'सेव हो गया। अलर्ट नहीं जा सका — नीचे WhatsApp बटन दबाएँ।') });
      setWaText(j.text || '');
      setRaw(null); setLoc(null); setAddress(''); setName(''); setMobile(''); setInterested(null);
      setDocs({ pan: null, aadhaar: null, bill: null, bank: null }); setReason(''); setCallback('');
    } catch (e) {
      setMsg({ ok: false, text: String((e as Error).message || e) });
    } finally {
      setBusy(false);
    }
  }

  const docLabels: Record<DocKey, [string, string]> = {
    pan: ['PAN card photo', 'पैन कार्ड फोटो'],
    aadhaar: ['Aadhaar photo', 'आधार फोटो'],
    bill: ['Electricity bill connection photo', 'बिजली बिल कनेक्शन फोटो'],
    bank: ['Bank passbook photo', 'बैंक पासबुक फोटो'],
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white">{tx('Customer Detail', 'ग्राहक विवरण')}</h1>
      <p className="text-sm text-slate-500">{tx('Logged in as', 'लॉगिन:')} {employeeName}</p>

      <section className="card mt-4 space-y-3">
        <p className="font-bold">1. {tx('Site photo with GPS', 'GPS के साथ साइट फोटो')}</p>
        <div className="flex gap-2">
          <button type="button" className="btn-outline flex-1" onClick={() => photoCam.current?.click()}><CameraIcon width={18} height={18} /> {tx('Take photo', 'फोटो लें')}</button>
          <button type="button" className="btn-outline flex-1" onClick={() => photoUp.current?.click()}><UploadIcon width={18} height={18} /> {tx('Upload photo', 'फोटो अपलोड')}</button>
        </div>
        <input ref={photoCam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { setRaw(e.target.files?.[0] ?? null); e.target.value = ''; }} />
        <input ref={photoUp} type="file" accept="image/*" hidden onChange={(e) => { setRaw(e.target.files?.[0] ?? null); e.target.value = ''; }} />
        <button type="button" className="btn w-full" onClick={getLocation} disabled={locBusy}>
          {locBusy ? tx('Getting location…', 'लोकेशन ले रहे हैं…') : loc ? tx('Refresh location', 'लोकेशन दोबारा लें') : tx('Get current location', 'वर्तमान लोकेशन लें')}
        </button>
        {loc && <p className="text-xs text-slate-500">📍 {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)} (±{Math.round(loc.accuracy)} m)</p>}
        {preview && <img src={preview} alt="Stamped site" className="w-full rounded-xl" />}
        {raw && !loc && <p className="text-xs text-amber-600">{tx('Tap "Get current location" to add the GPS strip to the photo.', 'फोटो पर GPS स्ट्रिप जोड़ने के लिए "वर्तमान लोकेशन लें" दबाएँ।')}</p>}
      </section>

      <section className="card mt-4 space-y-3">
        <p className="font-bold">2. {tx('Customer', 'ग्राहक')}</p>
        <div><label className="label">{tx('Name of customer', 'ग्राहक का नाम')}</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">{tx('Mobile number', 'मोबाइल नंबर')}</label><input className="input" inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} /></div>
        <div><label className="label">{tx('Location (auto from current location)', 'लोकेशन (वर्तमान लोकेशन से अपने-आप)')}</label><textarea className="input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder={tx('Fills after you tap Get current location', 'लोकेशन लेने के बाद भर जाएगा')} /></div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setInterested(true)} className={`rounded-xl border px-3 py-3 font-bold ${interested === true ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>👍 {tx('Interested', 'इच्छुक')}</button>
          <button type="button" onClick={() => setInterested(false)} className={`rounded-xl border px-3 py-3 font-bold ${interested === false ? 'border-brand-red bg-brand-red text-white' : 'border-slate-300 dark:border-slate-700'}`}>👎 {tx('Not interested', 'अनिच्छुक')}</button>
        </div>
      </section>

      {interested === true && (
        <section className="card mt-4 space-y-3">
          <p className="font-bold">3. {tx('Documents (add what you have)', 'दस्तावेज़ (जो उपलब्ध हों जोड़ें)')}</p>
          {(Object.keys(docLabels) as DocKey[]).map((k) => (
            <FilePick key={k} label={tx(...docLabels[k])} file={docs[k]} onFile={(f) => setDocs((d) => ({ ...d, [k]: f }))} />
          ))}
          <p className="text-xs text-slate-500">{tx('The GPS-tagged site photo from step 1 is sent automatically.', 'चरण 1 की GPS-टैग साइट फोटो अपने-आप भेजी जाती है।')}</p>
        </section>
      )}

      {interested === false && (
        <section className="card mt-4 space-y-3">
          <p className="font-bold">3. {tx('Why not interested?', 'अनिच्छुक क्यों?')}</p>
          <div><label className="label">{tx('Reason', 'कारण')}</label><textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <div><label className="label">{tx('Preferred callback date & time', 'पसंदीदा कॉलबैक तारीख और समय')}</label><input type="datetime-local" className="input" value={callback} onChange={(e) => setCallback(e.target.value)} /></div>
        </section>
      )}

      {msg && <p className={`mt-4 rounded-xl p-3 text-sm font-semibold ${msg.ok ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-brand-red dark:bg-red-950'}`}>{msg.text}</p>}
      {waText && (
        <a
          href={`https://wa.me/917376721717?text=${encodeURIComponent(waText)}`}
          target="_blank" rel="noopener noreferrer"
          className="btn mt-3 w-full !bg-green-600"
        >
          {tx('Also send on WhatsApp (free) — tap Send', 'WhatsApp पर भी भेजें (मुफ़्त) — Send दबाएँ')}
        </a>
      )}
      <button className="btn mt-4 w-full" onClick={submit} disabled={busy}>{busy ? tx('Submitting…', 'सबमिट हो रहा है…') : tx('Submit', 'सबमिट करें')}</button>
    </div>
  );
}
