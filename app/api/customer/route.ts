import { NextResponse } from "next/server";
import { getEmployee } from "@/lib/auth";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

// Saves the customer in the database (so the owner website can list it).
// NOTHING is sent to Telegram or Gmail. The details + photos go to the owner on WhatsApp from the employee's phone (see CustomerForm).
export async function POST(req: Request) {
  const emp = await getEmployee();
  if (!emp) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const name = String(b.name || "")
    .trim()
    .slice(0, 100);
  const mobile = String(b.mobile || "").replace(/\D/g, "");
  const location = String(b.location || "")
    .trim()
    .slice(0, 300);
  const lat = Number(b.lat),
    lng = Number(b.lng);
  const interested = b.interested === true;
  const reason = String(b.reason || "")
    .trim()
    .slice(0, 500);
  const callback = b.callback ? new Date(String(b.callback)) : null;

  if (!name || mobile.length !== 10)
    return NextResponse.json(
      { error: "Enter customer name and a 10-digit mobile number." },
      { status: 400 },
    );
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    return NextResponse.json(
      { error: "Please capture the current location." },
      { status: 400 },
    );
  if (!interested && (!reason || !callback || isNaN(+callback)))
    return NextResponse.json(
      { error: "Enter the reason and preferred callback date/time." },
      { status: 400 },
    );

  const { data: row, error } = await db()
    .from("customers")
    .insert({
      name,
      mobile,
      location,
      lat,
      lng,
      status: interested ? "pending" : "not_interested",
      employee_id: emp.id,
      employee_name: emp.displayName,
      reason: interested ? null : reason,
      callback_at: interested ? null : callback!.toISOString(),
    })
    .select("id")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Text that the employee's phone will send to the owner on WhatsApp
  const when = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const maps = `https://maps.google.com/?q=${lat},${lng}`;
  const head = interested
    ? "✅ NEW INTERESTED CUSTOMER"
    : "❌ CUSTOMER NOT INTERESTED";
  let text = `${head}\nName: ${name}\nMobile: ${mobile}\nLocation: ${location || "-"}\nMap: ${maps}\nEmployee: ${emp.displayName}${emp.mobile ? ` (${emp.mobile})` : ""}\nTime: ${when}`;
  if (!interested)
    text += `\n\nReason: ${reason}\nPreferred callback: ${callback!.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;

  return NextResponse.json({ ok: true, id: row.id, text });
}
