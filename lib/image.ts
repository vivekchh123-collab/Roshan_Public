// Browser-side image helpers (compress photos, stamp a GPS Map Camera style strip on site photos).

export async function compressImage(
  file: Blob,
  maxW = 1600,
  quality = 0.8,
): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) =>
    c.toBlob(
      (b) => (b ? res(b) : rej(new Error("compress failed"))),
      "image/jpeg",
      quality,
    ),
  );
}

function loadImg(src: string, cors = false): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const i = new Image();
    if (cors) i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
  });
}

export function gmtLabel(d: Date) {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const hh = String(Math.floor(Math.abs(off) / 60)).padStart(2, "0");
  const mm = String(Math.abs(off) % 60).padStart(2, "0");
  const day = d.toLocaleDateString("en-GB", { weekday: "long" });
  const date = d.toLocaleDateString("en-GB"); // dd/mm/yyyy
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${day}, ${date} ${time} GMT ${sign}${hh}:${mm}`;
}

function tileXY(lat: number, lng: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const r = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  return { x, y };
}

/** Small satellite map (Esri) of the current location with a red pin; falls back to a street map (OpenStreetMap). */
async function mapThumb(
  lat: number,
  lng: number,
  size: number,
): Promise<HTMLCanvasElement | null> {
  const z = 17;
  const { x, y } = tileXY(lat, lng, z);
  const tx = Math.floor(x),
    ty = Math.floor(y);
  const sources = [
    (X: number, Y: number) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${Y}/${X}`,
    (X: number, Y: number) =>
      `https://tile.openstreetmap.org/${z}/${X}/${Y}.png`,
  ];
  for (const src of sources) {
    const grid = document.createElement("canvas");
    grid.width = grid.height = 768;
    const g = grid.getContext("2d")!;
    let ok = 0;
    await Promise.all(
      [-1, 0, 1].flatMap((dy) =>
        [-1, 0, 1].map(async (dx) => {
          const img = await loadImg(src(tx + dx, ty + dy), true);
          if (img) {
            g.drawImage(img, (dx + 1) * 256, (dy + 1) * 256);
            ok++;
          }
        }),
      ),
    );
    if (ok < 5) continue;

    const out = document.createElement("canvas");
    out.width = out.height = size;
    const o = out.getContext("2d")!;
    const cx = (x - tx + 1) * 256,
      cy = (y - ty + 1) * 256; // our point inside the 3x3 tile grid
    const crop = 256;
    o.drawImage(
      grid,
      cx - crop / 2,
      cy - crop / 2,
      crop,
      crop,
      0,
      0,
      size,
      size,
    );

    // red pin
    const c = size / 2,
      r = size * 0.075;
    o.fillStyle = "#e11d1d";
    o.strokeStyle = "#ffffff";
    o.lineWidth = size * 0.025;
    o.beginPath();
    o.arc(c, c - r * 1.7, r, Math.PI * 0.8, Math.PI * 2.2);
    o.lineTo(c, c);
    o.closePath();
    o.fill();
    o.stroke();
    o.fillStyle = "#ffffff";
    o.beginPath();
    o.arc(c, c - r * 1.7, r * 0.38, 0, Math.PI * 2);
    o.fill();
    return out;
  }
  return null;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width <= maxW) cur = t;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
    if (lines.length === maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines.slice(0, maxLines);
}

export type StampInfo = {
  employee: string;
  title?: string; // e.g. "Hardaspur Kassi, Uttar Pradesh, India"
  address?: string; // full address line
  lat: number;
  lng: number;
  accuracy: number;
  when: Date;
};

/** Draws a GPS Map Camera style strip: map of the current place on the left, place + address + lat/long + time on the right. */
export async function stampPhoto(file: Blob, info: StampInfo): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bmp.width);
  const W = Math.round(bmp.width * scale);
  const H = Math.round(bmp.height * scale);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, W, H);

  // Two floating boxes at the bottom (like GPS Map Camera): LEFT square = map of the current place, RIGHT rectangle = details
  const s = W / 900;
  const m = 14 * s; // outer margin
  const gap = 10 * s; // space between the two boxes
  const boxH = Math.round(168 * s); // both boxes have this height; the map box is a square of the same size
  const top = H - m - boxH;

  // LEFT: square map box
  const map = await mapThumb(info.lat, info.lng, boxH);
  ctx.save();
  roundRect(ctx, m, top, boxH, boxH, 12 * s);
  ctx.clip();
  if (map) {
    ctx.drawImage(map, m, top, boxH, boxH);
  } else {
    ctx.fillStyle = "#0b57c8";
    ctx.fillRect(m, top, boxH, boxH);
    const logo = await loadImg("/logo.png");
    if (logo)
      ctx.drawImage(
        logo,
        m + boxH * 0.1,
        top + boxH * 0.1,
        boxH * 0.8,
        boxH * 0.8,
      );
  }
  ctx.restore();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2 * s;
  roundRect(ctx, m, top, boxH, boxH, 12 * s);
  ctx.stroke();

  // RIGHT: rectangle details box
  const bx = m + boxH + gap;
  const bw = W - bx - m;
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  roundRect(ctx, bx, top, bw, boxH, 12 * s);
  ctx.fill();

  const x = bx + 14 * s;
  const maxW = bw - 28 * s;
  let y = top + 32 * s;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";

  ctx.font = `bold ${Math.round(26 * s)}px sans-serif`;
  const title =
    info.title ||
    info.address?.split(",").slice(0, 3).join(",") ||
    "Current location";
  ctx.fillText(title, x, y, maxW);
  y += 28 * s;

  ctx.font = `${Math.round(17 * s)}px sans-serif`;
  const addr = wrapLines(ctx, info.address || "", maxW, 2);
  for (const l of addr) {
    ctx.fillText(l, x, y, maxW);
    y += 21 * s;
  }

  ctx.font = `${Math.round(18 * s)}px sans-serif`;
  ctx.fillText(
    `Lat ${info.lat.toFixed(6)}°  Long ${info.lng.toFixed(6)}°`,
    x,
    y,
    maxW,
  );
  y += 22 * s;
  ctx.fillText(gmtLabel(info.when), x, y, maxW);
  y += 22 * s;
  ctx.font = `${Math.round(16 * s)}px sans-serif`;
  ctx.fillText(
    `Note : Captured by Roshan Tubes · ${info.employee}`,
    x,
    y,
    maxW,
  );

  return new Promise((res, rej) =>
    c.toBlob(
      (b) => (b ? res(b) : rej(new Error("stamp failed"))),
      "image/jpeg",
      0.85,
    ),
  );
}

/**
 * Draws the customer details as a picture (name, mobile, location, reason...) and returns it as a File.
 * WhatsApp often drops the typed message when several photos are shared at once, but it never drops a photo,
 * so the details travel inside this first picture. It is fully synchronous so it can be used right inside a button tap.
 */
export function detailsCardFile(
  title: string,
  accent: string,
  rows: [string, string][],
  fileName: string,
): File {
  const W = 1080,
    pad = 48,
    labelW = 250;
  const c = document.createElement("canvas");
  c.width = W;
  const ctx = c.getContext("2d")!;
  const font = (px: number, bold = false) =>
    `${bold ? "bold " : ""}${px}px sans-serif`;

  // measure first so the card is exactly as tall as the text
  ctx.font = font(40);
  const lineH = 54;
  const wrapped = rows.map(([k, v]) => {
    const words = (v || "-").split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(t).width <= W - pad * 2 - labelW) cur = t;
      else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return { k, lines: lines.length ? lines : ["-"] };
  });
  const bodyH = wrapped.reduce((s, r) => s + r.lines.length * lineH + 18, 0);
  const headH = 130;
  c.height = headH + bodyH + pad;

  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, W, c.height);
  g.fillStyle = accent;
  g.fillRect(0, 0, W, headH);
  g.fillStyle = "#ffffff";
  g.textBaseline = "alphabetic";
  g.font = font(48, true);
  g.fillText(title, pad, 62);
  g.font = font(30);
  g.fillText("Roshan Tubes", pad, 108);

  let y = headH + 60;
  for (const r of wrapped) {
    g.fillStyle = "#64748b";
    g.font = font(34, true);
    g.fillText(r.k, pad, y);
    g.fillStyle = "#0f172a";
    g.font = font(40);
    r.lines.forEach((ln, i) => g.fillText(ln, pad + labelW, y + i * lineH));
    y += r.lines.length * lineH + 18;
    g.strokeStyle = "#e2e8f0";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(pad, y - 40);
    g.lineTo(W - pad, y - 40);
    g.stroke();
  }

  // dataURL -> bytes, synchronously
  const b64 = c.toDataURL("image/jpeg", 0.9).split(",")[1];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], fileName, { type: "image/jpeg" });
}
