"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "./Providers";

const KEY = "rt_share_loc"; // 'off' = the employee switched it off himself; anything else = ON (default)
const SEND_EVERY = 60_000; // one point per minute

type Pos = { lat: number; lng: number; accuracy: number };
type Lock = { release: () => Promise<void> };

export default function LocationSharing() {
  const { tx } = useApp();
  const [on, setOn] = useState(false);
  const [sent, setSent] = useState("");
  const [err, setErr] = useState("");
  const watch = useRef<number | null>(null);
  const lastSent = useRef(0);
  const lastPos = useRef<Pos | null>(null);
  const lock = useRef<Lock | null>(null);

  const send = useCallback(async (p: Pos, kind: "point" | "stop" = "point") => {
    try {
      const r = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ ...p, kind }),
      });
      if (r.ok && kind === "point")
        setSent(
          new Date().toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
    } catch {
      /* next point will go */
    }
  }, []);

  const keepAwake = useCallback(async () => {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (t: "screen") => Promise<Lock> };
      };
      if (nav.wakeLock && !lock.current)
        lock.current = await nav.wakeLock.request("screen");
    } catch {
      /* not supported – fine */
    }
  }, []);

  const begin = useCallback(() => {
    if (!navigator.geolocation) {
      setErr("Location is not supported on this phone.");
      return false;
    }
    if (watch.current !== null) return true;
    watch.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        lastPos.current = p;
        setErr("");
        setOn(true);
        if (Date.now() - lastSent.current >= SEND_EVERY) {
          lastSent.current = Date.now();
          void send(p);
        }
      },
      (e) => {
        if (e.code === 1) {
          setErr(
            "Location is blocked. Allow Location for this website in the browser settings.",
          );
          if (watch.current !== null) {
            navigator.geolocation.clearWatch(watch.current);
            watch.current = null;
          }
          setOn(false);
        } else setErr("Could not get your location right now.");
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );
    void keepAwake();
    return true;
  }, [send, keepAwake]);

  function stop() {
    if (watch.current !== null) {
      navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
    }
    void lock.current?.release().catch(() => {});
    lock.current = null;
    if (lastPos.current) void send(lastPos.current, "stop");
    try {
      localStorage.setItem(KEY, "off");
    } catch {
      /* ignore */
    }
    setOn(false);
    setErr("");
  }
  function start() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setErr("");
    begin();
  }

  // AUTO-START as soon as the employee opens the site (unless he switched it off himself)
  const [off, setOff] = useState(false);
  useEffect(() => {
    let wasOff = false;
    try {
      wasOff = localStorage.getItem(KEY) === "off";
    } catch {
      /* ignore */
    }
    setOff(wasOff);
    if (!wasOff) begin();
    const vis = () => {
      if (document.visibilityState === "visible" && watch.current !== null) {
        lastSent.current = 0;
        void keepAwake();
      }
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      document.removeEventListener("visibilitychange", vis);
      if (watch.current !== null) {
        navigator.geolocation.clearWatch(watch.current);
        watch.current = null;
      }
      void lock.current?.release().catch(() => {});
      lock.current = null;
    };
  }, [begin, keepAwake]);

  useEffect(() => {
    if (on) setOff(false);
  }, [on]);

  return (
    <div className="fixed bottom-2 left-2 right-2 z-40 mx-auto max-w-md">
      {on ? (
        <div className="flex items-center gap-2 rounded-full border border-green-600 bg-green-50 px-3 py-1.5 text-xs shadow dark:bg-green-950">
          <span className="font-bold text-green-700 dark:text-green-300">
            🟢 {tx("Location sharing ON", "लोकेशन शेयरिंग चालू")}
            {sent && ` · ${sent}`}
          </span>
          <button
            type="button"
            className="ml-auto rounded-full border border-slate-400 px-2 py-0.5 font-semibold"
            onClick={stop}
          >
            {tx("Stop", "बंद")}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs shadow dark:border-slate-700 dark:bg-slate-900">
          <span className="font-semibold">
            {err
              ? `⚠️ ${err}`
              : off
                ? `📍 ${tx("Location sharing OFF", "लोकेशन शेयरिंग बंद")}`
                : `📍 ${tx("Starting location…", "लोकेशन शुरू हो रही है…")}`}
          </span>
          <button
            type="button"
            className="ml-auto rounded-full bg-brand-blue px-2 py-0.5 font-semibold text-white"
            onClick={start}
          >
            {tx("Start", "शुरू")}
          </button>
        </div>
      )}
    </div>
  );
}
