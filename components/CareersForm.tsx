"use client";
import { FormEvent, useState } from "react";
import { useApp } from "./Providers";
import { compressImage } from "@/lib/image";

export default function CareersForm({
  technical,
  field,
}: {
  technical: boolean;
  field: boolean;
}) {
  const { tx } = useApp();
  const roles = [
    ...(technical
      ? [{ v: "technical", en: "Technical role", hi: "टेक्निकल रोल" }]
      : []),
    ...(field
      ? [{ v: "field", en: "Field work role", hi: "फील्ड वर्क रोल" }]
      : []),
  ];
  const [role, setRole] = useState(roles[0]?.v ?? "");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  if (roles.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <h1 className="text-3xl font-extrabold text-brand-navy dark:text-white">
          {tx("Careers", "करियर")}
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          {tx(
            "There are no openings at the moment. Please check again soon.",
            "अभी कोई रिक्ति उपलब्ध नहीं है। कृपया कुछ समय बाद देखें।",
          )}
        </p>
      </div>
    );
  }
  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="text-5xl">✅</p>
        <p className="mt-3 text-xl font-bold">
          {tx(
            "Application sent. We will contact you soon.",
            "आवेदन भेज दिया गया है। हम जल्द आपसे संपर्क करेंगे।",
          )}
        </p>
      </div>
    );
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const f = new FormData(e.currentTarget);
    if (!front || !back) {
      setErr(
        tx(
          "Please add both the FRONT and BACK photo of your Aadhaar.",
          "कृपया आधार की आगे और पीछे दोनों तरफ़ की फोटो जोड़ें।",
        ),
      );
      return;
    }
    setBusy(true);
    try {
      f.set("role", role);
      f.delete("aadhaarFrontFile");
      f.delete("aadhaarBackFile");
      f.set("aadhaarFront", await compressImage(front), "aadhaar-front.jpg");
      f.set("aadhaarBack", await compressImage(back), "aadhaar-back.jpg");
      const r = await fetch("/api/careers", { method: "POST", body: f });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Failed");
      setDone(true);
    } catch (x) {
      setErr(String((x as Error).message || x));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-brand-navy dark:text-white">
        {tx("Careers", "करियर")}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {tx(
          "Join the Roshan Tubes team. Apply below.",
          "रोशन ट्यूब्स टीम से जुड़ें। नीचे आवेदन करें।",
        )}
      </p>
      <form onSubmit={submit} className="card mt-5 space-y-3">
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
        />
        <div>
          <span className="label">{tx("Role", "पद")}</span>
          <div className="flex gap-2">
            {roles.map((r) => (
              <button
                type="button"
                key={r.v}
                onClick={() => setRole(r.v)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold ${role === r.v ? "border-brand-blue bg-brand-blue text-white" : "border-slate-300 dark:border-slate-700"}`}
              >
                {tx(r.en, r.hi)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{tx("First name", "पहला नाम")}</label>
            <input name="firstName" required className="input" />
          </div>
          <div>
            <label className="label">{tx("Last name", "अंतिम नाम")}</label>
            <input name="lastName" required className="input" />
          </div>
        </div>
        <div>
          <label className="label">{tx("Mobile number", "मोबाइल नंबर")}</label>
          <input
            name="mobile"
            required
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            className="input"
            placeholder="10 digits"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label">
            {tx("Aadhaar photo – FRONT side", "आधार फोटो – आगे की तरफ़")}
          </label>
          <input
            name="aadhaarFrontFile"
            type="file"
            accept="image/*"
            required
            onChange={(e) => setFront(e.target.files?.[0] ?? null)}
            className="input"
          />
          {front && (
            <p className="mt-1 truncate text-xs text-green-600">
              ✓ {front.name}
            </p>
          )}
        </div>
        <div>
          <label className="label">
            {tx("Aadhaar photo – BACK side", "आधार फोटो – पीछे की तरफ़")}
          </label>
          <input
            name="aadhaarBackFile"
            type="file"
            accept="image/*"
            required
            onChange={(e) => setBack(e.target.files?.[0] ?? null)}
            className="input"
          />
          {back && (
            <p className="mt-1 truncate text-xs text-green-600">
              ✓ {back.name}
            </p>
          )}
        </div>
        <div>
          <label className="label">
            {tx("Past experience", "पिछला अनुभव")}
          </label>
          <textarea name="experience" rows={3} required className="input" />
        </div>
        {err && <p className="text-sm font-semibold text-brand-red">{err}</p>}
        <button className="btn w-full" disabled={busy}>
          {busy
            ? tx("Sending…", "भेज रहे हैं…")
            : tx("Submit application", "आवेदन भेजें")}
        </button>
      </form>
    </div>
  );
}
