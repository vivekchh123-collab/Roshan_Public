// Browser-side image helpers (compress for upload, stamp GPS strip on site photos).

export async function compressImage(file: Blob, maxW = 1600, quality = 0.8): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width);
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('compress failed'))), 'image/jpeg', quality));
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
  });
}

export function gmtLabel(d: Date) {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(off) / 60)).padStart(2, '0');
  const mm = String(Math.abs(off) % 60).padStart(2, '0');
  const day = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const date = d.toLocaleDateString('en-GB'); // dd/mm/yyyy
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${day}, ${date} ${time} GMT ${sign}${hh}:${mm}`;
}

export type StampInfo = { employee: string; customer?: string; address?: string; lat: number; lng: number; accuracy: number; when: Date };

/** Draws a dark strip at the bottom of the photo with employee, GPS coordinates, time and a Maps link. */
export async function stampPhoto(file: Blob, info: StampInfo): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bmp.width);
  const W = Math.round(bmp.width * scale);
  const H = Math.round(bmp.height * scale);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, W, H);

  const s = W / 900;
  const stripH = Math.round(170 * s);
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(0, H - stripH, W, stripH);

  const logo = await loadImg('/logo.png');
  const pad = 16 * s;
  const logoSize = stripH - pad * 2;
  if (logo) ctx.drawImage(logo, pad, H - stripH + pad, logoSize, logoSize);
  const x = pad * 2 + logoSize;
  let y = H - stripH + pad + 26 * s;

  const line = (text: string, size: number, bold = false) => {
    ctx.fillStyle = '#fff';
    ctx.font = `${bold ? 'bold ' : ''}${Math.round(size * s)}px sans-serif`;
    ctx.fillText(text, x, y, W - x - pad);
    y += (size + 9) * s;
  };
  line(`Roshan Tubes · ${info.employee}`, 26, true);
  if (info.address) line(info.address.slice(0, 80), 19);
  line(`Lat ${info.lat.toFixed(6)}°  Long ${info.lng.toFixed(6)}°  (±${Math.round(info.accuracy)} m)`, 20);
  line(gmtLabel(info.when), 20);
  line(`maps.google.com/?q=${info.lat.toFixed(6)},${info.lng.toFixed(6)}`, 18);

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('stamp failed'))), 'image/jpeg', 0.85));
}
