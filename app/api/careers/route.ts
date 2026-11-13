import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

const esc = (s: string) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );

export async function POST(req: Request) {
  const f = await req.formData();
  if (f.get("website")) return NextResponse.json({ ok: true }); // honeypot

  const role = String(f.get("role") || "");
  const firstName = String(f.get("firstName") || "")
    .trim()
    .slice(0, 60);
  const lastName = String(f.get("lastName") || "")
    .trim()
    .slice(0, 60);
  const mobile = String(f.get("mobile") || "").replace(/\D/g, "");
  const email = String(f.get("email") || "")
    .trim()
    .toLowerCase()
    .slice(0, 120);
  const experience = String(f.get("experience") || "")
    .trim()
    .slice(0, 2000);
  const front = f.get("aadhaarFront");
  const back = f.get("aadhaarBack");

  if (!["technical", "field"].includes(role))
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  if (
    !firstName ||
    !lastName ||
    mobile.length !== 10 ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    !experience
  )
    return NextResponse.json(
      { error: "Please fill all fields correctly." },
      { status: 400 },
    );
  const okImg = (x: FormDataEntryValue | null): x is File =>
    x instanceof File &&
    x.size > 0 &&
    x.size <= 4 * 1024 * 1024 &&
    x.type.startsWith("image/");
  if (!okImg(front) || !okImg(back))
    return NextResponse.json(
      {
        error:
          "Add both Aadhaar photos (front and back), each an image under 4 MB.",
      },
      { status: 400 },
    );

  const sb = db();
  const { data: s } = await sb
    .from("settings")
    .select("value")
    .eq("key", role === "field" ? "careers_field" : "careers_technical")
    .maybeSingle();
  if (s && s.value === false)
    return NextResponse.json(
      { error: "This role is not open right now." },
      { status: 403 },
    );

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  try {
    await transporter.sendMail({
      from: `Roshan Tubes Website <${process.env.GMAIL_USER}>`,
      to: process.env.OWNER_EMAIL,
      replyTo: email,
      subject: `New career application — ${role === "field" ? "Field work" : "Technical"} — ${firstName} ${lastName}`,
      html: `<h3>New career application</h3>
        <p><b>Role:</b> ${role === "field" ? "Field work" : "Technical"}</p>
        <p><b>Name:</b> ${esc(firstName)} ${esc(lastName)}</p>
        <p><b>Mobile:</b> ${mobile}</p>
        <p><b>Email:</b> ${esc(email)}</p>
        <p><b>Past experience:</b><br>${esc(experience).replace(/\n/g, "<br>")}</p>
        <p>Aadhaar photos (front and back) are attached.</p>`,
      attachments: [
        {
          filename: `aadhaar-front-${firstName}-${lastName}.jpg`,
          content: Buffer.from(await front.arrayBuffer()),
        },
        {
          filename: `aadhaar-back-${firstName}-${lastName}.jpg`,
          content: Buffer.from(await back.arrayBuffer()),
        },
      ],
    });
  } catch (e) {
    console.error("career mail failed", e);
    return NextResponse.json(
      { error: "Could not send your application. Please try again." },
      { status: 502 },
    );
  }

  // Only FIELD applicants appear in the owner's "Employee Status" (name, mobile, email). Nothing else is stored.
  if (role === "field") {
    await sb
      .from("employees")
      .upsert(
        {
          name: `${firstName} ${lastName}`,
          mobile,
          email,
          role: "field",
          status: "applicant",
          allowed: false,
        },
        { onConflict: "email", ignoreDuplicates: true },
      );
  }
  return NextResponse.json({ ok: true });
}
