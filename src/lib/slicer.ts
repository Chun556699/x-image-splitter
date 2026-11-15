import JSZip from "jszip";

export type Direction = "vertical" | "grid";
export type AspectKey = "auto" | "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "4:5";
export type OutFormat = "png" | "jpeg" | "webp";

export const ASPECT_VALUE: Record<AspectKey, number | null> = {
  auto: null,
  "1:1": 1,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "4:5": 4 / 5,
};

export const MAX_SLICES = 20;
const MAX_DIM = 4096;

export interface SliceItem {
  blob: Blob;
  url: string;
  name: string;
  width: number;
  height: number;
}

interface Rect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/** Center-crop the source so that every slice has the target aspect ratio. */
export function computeCrop(
  sw: number,
  sh: number,
  cols: number,
  rows: number,
  ratio: number | null,
): Rect {
  if (!ratio) return { sx: 0, sy: 0, sw, sh };
  const gridAspect = (ratio * cols) / rows;
  const srcAspect = sw / sh;
  let cw: number, ch: number;
  if (srcAspect > gridAspect) {
    ch = sh;
    cw = sh * gridAspect;
  } else {
    cw = sw;
    ch = sw / gridAspect;
  }
  return { sx: (sw - cw) / 2, sy: (sh - ch) / 2, sw: cw, sh: ch };
}

/** Split a rect into cols×rows cells using rounded integer edges (seam-free). */
function makeRects(crop: Rect, cols: number, rows: number): Rect[] {
  const xEdge: number[] = [];
  const yEdge: number[] = [];
  for (let i = 0; i <= cols; i++) xEdge.push(Math.round(crop.sx + (crop.sw * i) / cols));
  for (let i = 0; i <= rows; i++) yEdge.push(Math.round(crop.sy + (crop.sh * i) / rows));
  const out: Rect[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({
        sx: xEdge[c],
        sy: yEdge[r],
        sw: xEdge[c + 1] - xEdge[c],
        sh: yEdge[r + 1] - yEdge[r],
      });
    }
  }
  return out;
}

function canvasToBlob(canvas: HTMLCanvasElement, format: OutFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      `image/${format}`,
      quality,
    );
  });
}

export interface SliceOptions {
  direction: Direction;
  count: number;
  cols: number;
  rows: number;
  aspect: AspectKey;
  format: OutFormat;
  quality: number; // 0-1, jpeg/webp only
  prefix: string;
}

export async function sliceImage(
  img: HTMLImageElement | HTMLCanvasElement,
  opts: SliceOptions,
): Promise<SliceItem[]> {
  const cols = opts.direction === "grid" ? opts.cols : opts.count;
  const rows = opts.direction === "grid" ? opts.rows : 1;

  const srcW = img instanceof HTMLCanvasElement ? img.width : img.naturalWidth;
  const srcH = img instanceof HTMLCanvasElement ? img.height : img.naturalHeight;
  const crop = computeCrop(srcW, srcH, cols, rows, ASPECT_VALUE[opts.aspect]);
  const rects = makeRects(crop, cols, rows);
  const ext = opts.format === "jpeg" ? "jpg" : opts.format;

  const items: SliceItem[] = [];
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    const scale = Math.min(1, MAX_DIM / r.sw, MAX_DIM / r.sh);
    const w = Math.max(1, Math.round(r.sw * scale));
    const h = Math.max(1, Math.round(r.sh * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    if (opts.format === "jpeg") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
    const blob = await canvasToBlob(canvas, opts.format, opts.quality);
    items.push({
      blob,
      url: URL.createObjectURL(blob),
      name: `${opts.prefix}-${String(i + 1).padStart(2, "0")}.${ext}`,
      width: w,
      height: h,
    });
  }
  return items;
}

/** Join images side-by-side into one panorama canvas (uniform height, aspect preserved). */
export function stitchImages(images: HTMLImageElement[]): HTMLCanvasElement {
  if (!images.length) throw new Error("no images");
  const H0 = Math.max(...images.map((i) => i.naturalHeight));
  const w0 = images.reduce((a, i) => a + (i.naturalWidth * H0) / i.naturalHeight, 0);
  const scale = Math.min(1, MAX_DIM / H0, 16000 / w0);
  const H = Math.max(1, Math.round(H0 * scale));
  const ws = images.map((i) => Math.max(1, Math.round((i.naturalWidth * H) / i.naturalHeight)));

  const canvas = document.createElement("canvas");
  canvas.height = H;
  canvas.width = ws.reduce((a, b) => a + b, 0);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  let x = 0;
  images.forEach((im, i) => {
    ctx.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight, x, 0, ws[i], H);
    x += ws[i];
  });
  return canvas;
}

export function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export async function downloadZip(files: { blob: Blob; name: string }[], zipName: string) {
  const zip = new JSZip();
  // Stagger entry mtimes (slice-01 newest): after extraction, date-sorted gallery
  // pickers list the files in slice order — identical mtimes scramble the order.
  const base = Date.now();
  files.forEach((f, i) => zip.file(f.name, f.blob, { date: new Date(base - i * 60_000) }));
  const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  downloadBlob(blob, zipName);
}

export type PostResult = "shared" | "downloaded" | "cancelled";

interface DirHandle {
  getFileHandle(
    name: string,
    opts?: { create?: boolean },
  ): Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }>;
}

/** Save slices & open X composer. Mobile: native share sheet with files attached. */
export async function postToX(files: { blob: Blob; name: string }[], text: string): Promise<PostResult> {
  const base = Date.now();
  const objs = files.map(
    (f, i) => new File([f.blob], f.name, { type: f.blob.type || "image/png", lastModified: base - i * 60_000 }),
  );
  const nav = navigator as Navigator & {
    canShare?: (d: { files?: File[] }) => boolean;
    share?: (d: { files?: File[]; text?: string }) => Promise<void>;
  };
  if (nav.canShare?.({ files: objs }) && nav.share) {
    try {
      await nav.share({ files: objs, ...(text.trim() ? { text: text.trim() } : {}) });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }

  const picker = (window as Window & { showDirectoryPicker?: (o?: { mode?: string }) => Promise<DirHandle> })
    .showDirectoryPicker;
  // Write files in reverse so slice-01 ends up with the newest mtime — gallery
  // pickers sorted "newest first" then attach images in the correct order.
  const rev = [...files].reverse();
  let saved = false;
  if (picker) {
    try {
      const dir = await picker({ mode: "readwrite" });
      for (const f of rev) {
        const fh = await dir.getFileHandle(f.name, { create: true });
        const w = await fh.createWritable();
        await w.write(f.blob);
        await w.close();
      }
      saved = true;
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  if (!saved) rev.forEach((f, i) => setTimeout(() => downloadBlob(f.blob, f.name), i * 300));

  const url = `https://x.com/intent/post${text.trim() ? `?text=${encodeURIComponent(text.trim())}` : ""}`;
  window.open(url, "_blank", "noopener");
  return "downloaded";
}

export function loadImageFromFile(file: File | Blob): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("invalid image"));
    };
    img.src = url;
  });
}

/** Generate a demo image — white brand card "X SLICE" (2400×1350). */
export async function makeSampleImage(): Promise<{ img: HTMLImageElement; url: string }> {
  const w = 2400;
  const h = 1350;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  // --- paper white background ---
  ctx.fillStyle = "#fafaf7";
  ctx.fillRect(0, 0, w, h);

  // subtle dot grid
  ctx.fillStyle = "#eceae3";
  for (let y = 40; y < h; y += 64) {
    for (let x = 40; x < w; x += 64) {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- dashed vertical cut lines (8 equal slices) ---
  ctx.strokeStyle = "#d7d4ca";
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 24]);
  for (let i = 1; i < 8; i++) {
    const x = (w * i) / 8;
    ctx.beginPath();
    ctx.moveTo(x, 56);
    ctx.lineTo(x, h - 56);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // --- brand title ---
  const font = `900 ${Math.round(h * 0.27)}px Inter, "Arial Black", system-ui, sans-serif`;
  ctx.font = font;
  ctx.textBaseline = "alphabetic";
  const partX = "X";
  const partRest = " SLICE";
  const xW = ctx.measureText(partX).width;
  const restW = ctx.measureText(partRest).width;
  const totalW = xW + restW;
  const startX = (w - totalW) / 2;
  const baseY = h * 0.53;

  const brand = ctx.createLinearGradient(startX, baseY - h * 0.2, startX + xW, baseY);
  brand.addColorStop(0, "#28c7fa");
  brand.addColorStop(0.55, "#7a5fff");
  brand.addColorStop(1, "#ff5f8f");
  ctx.fillStyle = brand;
  ctx.fillText(partX, startX, baseY);
  ctx.fillStyle = "#16161c";
  ctx.fillText(partRest, startX + xW, baseY);

  // gradient underline
  const barY = baseY + h * 0.055;
  const barH = h * 0.018;
  const ug = ctx.createLinearGradient(startX, 0, startX + totalW, 0);
  ug.addColorStop(0, "#28c7fa");
  ug.addColorStop(0.55, "#7a5fff");
  ug.addColorStop(1, "#ff5f8f");
  ctx.fillStyle = ug;
  ctx.beginPath();
  ctx.roundRect(startX, barY, totalW, barH, barH / 2);
  ctx.fill();

  // caption
  ctx.font = `600 ${Math.round(h * 0.042)}px Inter, system-ui, sans-serif`;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "14px";
  ctx.fillStyle = "#8a8577";
  ctx.textAlign = "center";
  ctx.fillText("1 IMAGE  →  20 SLICES", w / 2, barY + h * 0.115);
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
  ctx.textAlign = "left";

  // --- corner crop marks ---
  ctx.strokeStyle = "#c3bfb4";
  ctx.lineWidth = 6;
  const m = 64;
  const ml = 84;
  for (const [sx, sy] of [
    [m, m],
    [w - m, m],
    [m, h - m],
    [w - m, h - m],
  ] as const) {
    const dx = sx === m ? 1 : -1;
    const dy = sy === m ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(sx + dx * ml, sy);
    ctx.lineTo(sx, sy);
    ctx.lineTo(sx, sy + dy * ml);
    ctx.stroke();
  }

  // --- bottom mini slice strip (one gradient cut into 8 pills) ---
  const pillW = 96;
  const pillH = 150;
  const pillGap = 22;
  const stripW = pillW * 8 + pillGap * 7;
  const stripX = (w - stripW) / 2;
  const stripY = h * 0.79;
  const sg = ctx.createLinearGradient(stripX, 0, stripX + stripW, 0);
  sg.addColorStop(0, "#28c7fa");
  sg.addColorStop(0.55, "#7a5fff");
  sg.addColorStop(1, "#ff5f8f");
  for (let i = 0; i < 8; i++) {
    const px = stripX + i * (pillW + pillGap);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(px, stripY, pillW, pillH, 22);
    ctx.clip();
    ctx.fillStyle = sg;
    ctx.fillRect(stripX, stripY, stripW, pillH);
    ctx.restore();
  }

  // --- tiny scissors on the middle cut line ---
  const scx = w / 2;
  const scy = 56;
  ctx.strokeStyle = "#9a968b";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(scx - 20, scy - 20);
  ctx.lineTo(scx + 14, scy + 16);
  ctx.moveTo(scx + 20, scy - 20);
  ctx.lineTo(scx - 14, scy + 16);
  ctx.stroke();
  for (const dx of [-22, 22]) {
    ctx.beginPath();
    ctx.arc(scx + dx, scy + 24, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  const blob = await canvasToBlob(c, "png", 1);
  return loadImageFromFile(blob);
}
