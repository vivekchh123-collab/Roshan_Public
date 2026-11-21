import { NextResponse } from "next/server";
import { getEmployee } from "@/lib/auth";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

// Receives the employee's location ONLY while the employee has switched "Share my location" ON.
export async function POST(req: Request) {
  const emp = await getEmployee();
  if (!emp) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const lat = Number(b.lat),
    lng = Number(b.lng);
  const acc = Number(b.accuracy);
  const kind = b.kind === "stop" ? "stop" : "point";
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  )
    return NextResponse.json({ error: "Bad coordinates" }, { status: 400 });

  const sb = db();
  if (kind === "point") {
    // ignore updates that arrive faster than every 20 seconds
    const { data: last } = await sb
      .from("employee_locations")
      .select("created_at")
      .eq("employee_id", emp.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last && Date.now() - new Date(last.created_at).getTime() < 20000)
      return NextResponse.json({ ok: true, skipped: true });
  }
  const { error } = await sb.from("employee_locations").insert({
    employee_id: emp.id,
    lat,
    lng,
    accuracy: Number.isFinite(acc) ? acc : null,
    kind,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // housekeeping: now and then, delete points older than 30 days
  if (Math.random() < 0.02) {
    await sb
      .from("employee_locations")
      .delete()
      .lt("created_at", new Date(Date.now() - 30 * 86400000).toISOString());
  }
  return NextResponse.json({ ok: true });
}
