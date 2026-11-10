"use client";
import { useCallback, useEffect, useState } from "react";
import { BellIcon, CloseIcon } from "./Icons";
import { useApp } from "./Providers";

type N = { id: string; title: string; body: string; created_at: string };

function b64ToU8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export default function NotificationBell() {
  const { tx } = useApp();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const [seen, setSeen] = useState<string>("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (r.ok) setItems(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    try {
      setSeen(localStorage.getItem("rt_seen") || "");
    } catch {}
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const unread = items.filter((i) => i.created_at > seen).length;

  function toggle() {
    setOpen((o) => !o);
    if (!open && items[0]) {
      try {
        localStorage.setItem("rt_seen", items[0].created_at);
      } catch {}
      setSeen(items[0].created_at);
    }
  }

  async function enablePush() {
    setMsg("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setMsg(
          tx(
            "Phone alerts are not supported in this browser. On iPhone, add the site to Home Screen first.",
            "इस ब्राउज़र में फोन अलर्ट उपलब्ध नहीं है। iPhone में पहले साइट को Home Screen पर जोड़ें।",
          ),
        );
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg(tx("Permission denied.", "अनुमति नहीं मिली।"));
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setMsg("VAPID key missing");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToU8(key) as BufferSource,
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setMsg(tx("Phone alerts are ON.", "फोन अलर्ट चालू हो गए।"));
    } catch (e) {
      setMsg(String(e));
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed left-2 right-2 top-16 z-50 max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="mb-2 flex items-center justify-between">
            <b>{tx("Notifications", "सूचनाएँ")}</b>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <CloseIcon width={18} height={18} />
            </button>
          </div>
          <button onClick={enablePush} className="btn-outline mb-2 w-full">
            {tx("Get alerts on my phone", "फोन पर अलर्ट पाएँ")}
          </button>
          {msg && <p className="mb-2 text-xs text-slate-500">{msg}</p>}
          {items.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">
              {tx("No notifications yet.", "अभी कोई सूचना नहीं है।")}
            </p>
          )}
          <ul className="space-y-2">
            {items.map((n) => (
              <li
                key={n.id}
                className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"
              >
                <p className="font-semibold">{n.title}</p>
                <p className="text-slate-600 dark:text-slate-300">{n.body}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {new Date(n.created_at).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
