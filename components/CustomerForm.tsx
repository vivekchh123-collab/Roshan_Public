"use client";
import { useEffect, useRef, useState } from "react";
import { CameraIcon, UploadIcon } from "./Icons";
import { useApp } from "./Providers";
import { stampPhoto, detailsCardFile } from "@/lib/image";

type Loc = { lat: number; lng: number; accuracy: number; when: Date };
type DocKey = "pan" | "aadhaar_front" | "aadhaar_back" | "bill" | "bank";
type ShareResult = "shared" | "cancelled" | "unsupported";

const OWNER_WA = "917376721717";

// Opens the phone's share sheet with the real photos attached (choose WhatsApp -> owner chat -> Send).
// Must be called straight from a button tap. Falls back to opening the owner's WhatsApp chat with the text only.
function startShare(files: File[], text: string): Promise<ShareResult> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (navigator.share && nav.canShare?.({ files })) {
    return navigator.share({ files, text }).then(
      () => "shared" as const,
      (e: DOMException) =>
        e.name === "AbortError"
          ? ("cancelled" as const)
          : ("unsupported" as const),
    );
  }
  window.open(
    `https://wa.me/${OWNER_WA}?text=${encodeURIComponent(text)}`,
    "_blank",
  );
  return Promise.resolve("unsupported" as const);
}

function FilePick({
  label,
  file,
  onFile,
}: {
  label: string;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const { tx } = useApp();
  const cam = useRef<HTMLInputElement>(null);
  const up = useRef<HTMLInputElement>(null);
  const h = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  };
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <p className="text-sm font-bold">{label}</p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="btn-outline flex-1"
          onClick={() => cam.current?.click()}
        >
          <CameraIcon width={18} height={18} /> {tx("Take photo", "फोटो लें")}
        </button>
        <button
          type="button"
          className="btn-outline flex-1"
          onClick={() => up.current?.click()}
        >
          <UploadIcon width={18} height={18} /> {tx("Upload", "अपलोड")}
        </button>
      </div>
      <input
        ref={cam}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={h}
      />
      <input ref={up} type="file" accept="image/*" hidden onChange={h} />
      {file && (
        <p className="mt-2 truncate text-xs text-green-600">✓ {file.name}</p>
      )}
    </div>
  );
}

export default function CustomerForm({
  employeeName,
}: {
  employeeName: string;
}) {
  const { tx } = useApp();
  const [raw, setRaw] = useState<File | null>(null);
  const [loc, setLoc] = useState<Loc | null>(null);
  const [address, setAddress] = useState("");
  const [title, setTitle] = useState("");
  const [stamped, setStamped] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [locBusy, setLocBusy] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [interested, setInterested] = useState<boolean | null>(null);
  const [docs, setDocs] = useState<Record<DocKey, File | null>>({
    pan: null,
    aadhaar_front: null,
    aadhaar_back: null,
    bill: null,
    bank: null,
  });
  const [reason, setReason] = useState("");
  const [callback, setCallback] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ files: File[]; text: string } | null>(
    null,
  );
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const photoCam = useRef<HTMLInputElement>(null);
  const photoUp = useRef<HTMLInputElement>(null);

  // Re-draw the GPS strip whenever the photo or location changes
  useEffect(() => {
    let url = "";
    let cancelled = false;
    (async () => {
      if (!raw || !loc) {
        setStamped(null);
        setPreview("");
        return;
      }
      const blob = await stampPhoto(raw, {
        employee: employeeName,
        title,
        address,
        lat: loc.lat,
        lng: loc.lng,
        accuracy: loc.accuracy,
        when: loc.when,
      });
      if (cancelled) return;
      setStamped(blob);
      url = URL.createObjectURL(blob);
      setPreview(url);
    })().catch(() => {});
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [raw, loc, address, title, employeeName]);

  function getLocation() {
    if (!navigator.geolocation) {
      setMsg({
        ok: false,
        text: tx(
          "Location is not supported on this device.",
          "इस डिवाइस पर लोकेशन उपलब्ध नहीं है।",
        ),
      });
      return;
    }
    setLocBusy(true);
    setMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const l = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          when: new Date(),
        };
        setLoc(l);
        try {
          const r = await fetch(`/api/geocode?lat=${l.lat}&lng=${l.lng}`);
          const j = await r.json();
          setAddress(j.address || `${l.lat.toFixed(6)}, ${l.lng.toFixed(6)}`);
          setTitle(j.title || "");
        } catch {
          setAddress(`${l.lat.toFixed(6)}, ${l.lng.toFixed(6)}`);
          setTitle("");
        }
        setLocBusy(false);
      },
      (e) => {
        setLocBusy(false);
        setMsg({
          ok: false,
          text:
            e.code === 1
              ? tx(
                  "Location permission was denied. Allow it in browser settings.",
                  "लोकेशन की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें।",
                )
              : tx(
                  "Could not get location. Try again outdoors.",
                  "लोकेशन नहीं मिली। खुले में दोबारा कोशिश करें।",
                ),
        });
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  // ONE button: saves the text details to the owner website AND sends the real photos + details on WhatsApp.
  // Nothing before the share call is awaited, so the phone still treats it as a direct tap.
  async function sendOnWhatsApp() {
    setMsg(null);
    if (!name.trim() || !/^\d{10}$/.test(mobile)) {
      setMsg({
        ok: false,
        text: tx(
          "Enter customer name and a 10-digit mobile number.",
          "ग्राहक का नाम और 10 अंकों का मोबाइल नंबर लिखें।",
        ),
      });
      return;
    }
    if (!loc) {
      setMsg({
        ok: false,
        text: tx(
          'Tap "Get current location" first.',
          'पहले "वर्तमान लोकेशन लें" दबाएँ।',
        ),
      });
      return;
    }
    if (!stamped) {
      setMsg({
        ok: false,
        text: tx(
          "Add the site photo first (it gets the GPS strip).",
          "पहले साइट फोटो जोड़ें (उस पर GPS स्ट्रिप लगेगी)।",
        ),
      });
      return;
    }
    if (interested === null) {
      setMsg({
        ok: false,
        text: tx(
          "Choose Interested or Not interested.",
          "इच्छुक या अनिच्छुक चुनें।",
        ),
      });
      return;
    }
    if (!interested && (!reason.trim() || !callback)) {
      setMsg({
        ok: false,
        text: tx(
          "Enter the reason and callback date/time.",
          "कारण और कॉलबैक तारीख/समय लिखें।",
        ),
      });
      return;
    }

    // message for WhatsApp
    const ist = (d: Date) =>
      d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const text = [
      interested ? "✅ NEW INTERESTED CUSTOMER" : "❌ CUSTOMER NOT INTERESTED",
      `Name: ${name.trim()}`,
      `Mobile: ${mobile}`,
      `Location: ${address || "-"}`,
      `Map: https://maps.google.com/?q=${loc.lat},${loc.lng}`,
      `Employee: ${employeeName}`,
      `Time: ${ist(new Date())}`,
      ...(interested
        ? []
        : [
            "",
            `Reason: ${reason.trim()}`,
            `Preferred callback: ${ist(new Date(callback))}`,
          ]),
    ].join("\n");

    // the real photos (GPS site photo first, then the documents for Interested)
    const base = name.trim().replace(/[^A-Za-z0-9]+/g, "_") || "customer";
    // First picture = a details card (name, mobile, location...). WhatsApp can drop typed text when many photos are shared,
    // but a picture always arrives, so the details are guaranteed to reach the owner.
    const card = detailsCardFile(
      interested ? "✔ NEW INTERESTED CUSTOMER" : "✘ CUSTOMER NOT INTERESTED",
      interested ? "#15803d" : "#b91c1c",
      [
        ["Name", name.trim()],
        ["Mobile", mobile],
        ["Location", address || "-"],
        ["Employee", employeeName],
        ["Time", ist(new Date())],
        ...(interested
          ? []
          : ([
              ["Reason", reason.trim()],
              ["Callback", ist(new Date(callback))],
            ] as [string, string][])),
      ],
      `${base}-details.jpg`,
    );
    const files: File[] = [
      card,
      new File([stamped], `${base}-gps-site.jpg`, { type: "image/jpeg" }),
    ];
    if (interested) {
      for (const k of Object.keys(docs) as DocKey[]) {
        const f = docs[k];
        if (f)
          files.push(
            new File([f], `${base}-${k}.jpg`, { type: f.type || "image/jpeg" }),
          );
      }
    }

    // also copy the text, so it can be pasted in the chat if the phone's WhatsApp ignores it
    try {
      void navigator.clipboard?.writeText(text).catch(() => {});
    } catch {
      /* ignore */
    }

    setBusy(true);
    // 1) save the text details (no photos) so they appear on the owner website
    const savePromise = fetch("/api/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mobile,
        location: address,
        lat: loc.lat,
        lng: loc.lng,
        interested,
        reason,
        callback: callback ? new Date(callback).toISOString() : null,
      }),
    })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        return r.ok
          ? { ok: true as const }
          : { ok: false as const, error: String(j.error || "Failed") };
      })
      .catch((e) => ({ ok: false as const, error: String(e) }));
    // 2) at the same moment open WhatsApp with the photos attached
    const sharePromise = startShare(files, text);

    const [saved, shared] = await Promise.all([savePromise, sharePromise]);
    setBusy(false);

    if (!saved.ok) {
      setMsg({
        ok: false,
        text: tx(
          `Could not save to the owner website: ${saved.error}. Fix it and tap the button again.`,
          `ओनर वेबसाइट में सेव नहीं हुआ: ${saved.error}। ठीक करके बटन दोबारा दबाएँ।`,
        ),
      });
      return;
    }

    setLast({ files, text });
    setMsg({
      ok: shared === "shared",
      text:
        shared === "shared"
          ? tx(
              "Done. Saved on the owner website and sent on WhatsApp.",
              "हो गया। ओनर वेबसाइट में सेव हुआ और WhatsApp पर भेजा गया।",
            )
          : shared === "cancelled"
            ? tx(
                'Saved on the owner website, but WhatsApp was not sent. Tap "Send the last customer again on WhatsApp" below.',
                'ओनर वेबसाइट में सेव हो गया, पर WhatsApp नहीं भेजा। नीचे "पिछला ग्राहक WhatsApp पर दोबारा भेजें" दबाएँ।',
              )
            : tx(
                "Saved on the owner website. This phone cannot attach photos automatically, so WhatsApp opened with the details only. Please send the photos from your gallery in that chat.",
                "ओनर वेबसाइट में सेव हो गया। यह फोन फोटो अपने-आप नहीं जोड़ सकता, इसलिए WhatsApp में सिर्फ विवरण खुला है। उसी चैट में गैलरी से फोटो भेजें।",
              ),
    });
    setRaw(null);
    setLoc(null);
    setAddress("");
    setTitle("");
    setName("");
    setMobile("");
    setInterested(null);
    setDocs({
      pan: null,
      aadhaar_front: null,
      aadhaar_back: null,
      bill: null,
      bank: null,
    });
    setReason("");
    setCallback("");
  }

  const docLabels: Record<DocKey, [string, string]> = {
    pan: ["PAN card photo", "पैन कार्ड फोटो"],
    aadhaar_front: ["Aadhaar photo – FRONT side", "आधार फोटो – आगे की तरफ़"],
    aadhaar_back: ["Aadhaar photo – BACK side", "आधार फोटो – पीछे की तरफ़"],
    bill: ["Electricity bill connection photo", "बिजली बिल कनेक्शन फोटो"],
    bank: ["Bank passbook photo", "बैंक पासबुक फोटो"],
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white">
        {tx("Customer Detail", "ग्राहक विवरण")}
      </h1>
      <p className="text-sm text-slate-500">
        {tx("Logged in as", "लॉगिन:")} {employeeName}
      </p>

      <section className="card mt-4 space-y-3">
        <p className="font-bold">
          1. {tx("Site photo with GPS", "GPS के साथ साइट फोटो")}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-outline flex-1"
            onClick={() => photoCam.current?.click()}
          >
            <CameraIcon width={18} height={18} /> {tx("Take photo", "फोटो लें")}
          </button>
          <button
            type="button"
            className="btn-outline flex-1"
            onClick={() => photoUp.current?.click()}
          >
            <UploadIcon width={18} height={18} />{" "}
            {tx("Upload photo", "फोटो अपलोड")}
          </button>
        </div>
        <input
          ref={photoCam}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            setRaw(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        <input
          ref={photoUp}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            setRaw(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="btn w-full"
          onClick={getLocation}
          disabled={locBusy}
        >
          {locBusy
            ? tx("Getting location…", "लोकेशन ले रहे हैं…")
            : loc
              ? tx("Refresh location", "लोकेशन दोबारा लें")
              : tx("Get current location", "वर्तमान लोकेशन लें")}
        </button>
        {loc && (
          <p className="text-xs text-slate-500">
            📍 {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)} (±
            {Math.round(loc.accuracy)} m)
          </p>
        )}
        {preview && (
          <img src={preview} alt="Stamped site" className="w-full rounded-xl" />
        )}
        {raw && !loc && (
          <p className="text-xs text-amber-600">
            {tx(
              'Tap "Get current location" to add the GPS strip to the photo.',
              'फोटो पर GPS स्ट्रिप जोड़ने के लिए "वर्तमान लोकेशन लें" दबाएँ।',
            )}
          </p>
        )}
      </section>

      <section className="card mt-4 space-y-3">
        <p className="font-bold">2. {tx("Customer", "ग्राहक")}</p>
        <div>
          <label className="label">
            {tx("Name of customer", "ग्राहक का नाम")}
          </label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{tx("Mobile number", "मोबाइल नंबर")}</label>
          <input
            className="input"
            inputMode="numeric"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div>
          <label className="label">
            {tx(
              "Location (auto from current location)",
              "लोकेशन (वर्तमान लोकेशन से अपने-आप)",
            )}
          </label>
          <textarea
            className="input"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={tx(
              "Fills after you tap Get current location",
              "लोकेशन लेने के बाद भर जाएगा",
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setInterested(true)}
            className={`rounded-xl border px-3 py-3 font-bold ${interested === true ? "border-green-600 bg-green-600 text-white" : "border-slate-300 dark:border-slate-700"}`}
          >
            👍 {tx("Interested", "इच्छुक")}
          </button>
          <button
            type="button"
            onClick={() => setInterested(false)}
            className={`rounded-xl border px-3 py-3 font-bold ${interested === false ? "border-brand-red bg-brand-red text-white" : "border-slate-300 dark:border-slate-700"}`}
          >
            👎 {tx("Not interested", "अनिच्छुक")}
          </button>
        </div>
      </section>

      {interested === true && (
        <section className="card mt-4 space-y-3">
          <p className="font-bold">
            3.{" "}
            {tx(
              "Documents (add what you have)",
              "दस्तावेज़ (जो उपलब्ध हों जोड़ें)",
            )}
          </p>
          {(Object.keys(docLabels) as DocKey[]).map((k) => (
            <FilePick
              key={k}
              label={tx(...docLabels[k])}
              file={docs[k]}
              onFile={(f) => setDocs((d) => ({ ...d, [k]: f }))}
            />
          ))}
          <p className="text-xs text-slate-500">
            {tx(
              "These photos and the GPS site photo go straight to the owner on WhatsApp. They are not saved on the website.",
              "ये फोटो और GPS साइट फोटो सीधे ओनर को WhatsApp पर जाती हैं। वेबसाइट पर सेव नहीं होतीं।",
            )}
          </p>
        </section>
      )}

      {interested === false && (
        <section className="card mt-4 space-y-3">
          <p className="font-bold">
            3. {tx("Why not interested?", "अनिच्छुक क्यों?")}
          </p>
          <div>
            <label className="label">{tx("Reason", "कारण")}</label>
            <textarea
              className="input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div>
            <label className="label">
              {tx(
                "Preferred callback date & time",
                "पसंदीदा कॉलबैक तारीख और समय",
              )}
            </label>
            <input
              type="datetime-local"
              className="input"
              value={callback}
              onChange={(e) => setCallback(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500">
            {tx(
              "The GPS site photo and these details go straight to the owner on WhatsApp.",
              "GPS साइट फोटो और ये विवरण सीधे ओनर को WhatsApp पर जाते हैं।",
            )}
          </p>
        </section>
      )}

      {msg && (
        <p
          className={`mt-4 rounded-xl p-3 text-sm font-semibold ${msg.ok ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-red-50 text-brand-red dark:bg-red-950"}`}
        >
          {msg.text}
        </p>
      )}

      <button
        type="button"
        className="btn mt-4 w-full !bg-green-600 !py-3.5 !text-base"
        onClick={sendOnWhatsApp}
        disabled={busy}
      >
        {busy
          ? tx(
              "Saving and opening WhatsApp…",
              "सेव हो रहा है और WhatsApp खुल रहा है…",
            )
          : "📲 " + tx("Send on WhatsApp", "WhatsApp पर भेजें")}
      </button>
      <p className="mt-1 text-xs text-slate-500">
        {tx(
          "In the list that opens choose WhatsApp, then the owner chat, then Send. The first picture shows the customer details.",
          "जो सूची खुले उसमें WhatsApp, फिर ओनर चैट चुनें, फिर Send दबाएँ। पहली फोटो में ग्राहक का विवरण है।",
        )}
      </p>

      {last && (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            className="btn-outline w-full"
            onClick={() => void startShare(last.files, last.text)}
          >
            {tx(
              "Send the last customer again on WhatsApp",
              "पिछला ग्राहक WhatsApp पर दोबारा भेजें",
            )}
          </button>
          <button
            type="button"
            className="btn-outline w-full"
            onClick={() =>
              window.open(
                `https://wa.me/${OWNER_WA}?text=${encodeURIComponent(last.text)}`,
                "_blank",
              )
            }
          >
            💬{" "}
            {tx(
              "Send the details as a text message",
              "विवरण टेक्स्ट मैसेज के रूप में भेजें",
            )}
          </button>
          <button
            type="button"
            className="btn-outline w-full"
            onClick={() => {
              try {
                void navigator.clipboard?.writeText(last.text);
              } catch {
                /* ignore */
              }
            }}
          >
            📋 {tx("Copy the details", "विवरण कॉपी करें")}
          </button>
        </div>
      )}
    </div>
  );
}
