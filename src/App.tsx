import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Columns3,
  Globe,
  Image as ImageIcon,
  Images,
  Languages,
  LayoutGrid,
  Moon,
  Scissors,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import Dropzone from "./components/Dropzone";
import TimelinePreview from "./components/TimelinePreview";
import SliceThumbs from "./components/SliceThumbs";
import { AspectChips, CountSlider, ExportFields, SaveToAlbum } from "./components/Controls";
import { t, type Lang } from "./lib/i18n";
import {
  MAX_SLICES,
  downloadZip,
  loadImageFromFile,
  makeSampleImage,
  sliceImage,
  stitchImages,
  type AspectKey,
  type Direction,
  type OutFormat,
  type SliceItem,
} from "./lib/slicer";

const MAX_FILE_BYTES = 150 * 1024 * 1024; // 150MB
const MAX_SIDE = 16384;
const MAX_PIXELS = 100_000_000; // 100MP decompression-bomb guard
const imageTooBig = (w: number, h: number) => w > MAX_SIDE || h > MAX_SIDE || w * h > MAX_PIXELS;

interface MultiItem {
  id: number;
  file: File;
  url: string;
  name: string;
  img: HTMLImageElement;
  width: number;
  height: number;
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("xs-lang");
    return saved === "zh" || saved === "en" ? saved : "en";
  });
  const [showLangPicker, setShowLangPicker] = useState(() => localStorage.getItem("xs-lang") === null);
  const [dark, setDark] = useState(() => localStorage.getItem("xs-dark") === "1");
  const [mode, setMode] = useState<"slice" | "multi">("slice");

  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [srcUrl, setSrcUrl] = useState("");
  const [srcName, setSrcName] = useState("");
  const [direction, setDirection] = useState<Direction>("vertical");
  const [count, setCount] = useState(8);
  const [cols, setCols] = useState(4);
  const [rows, setRows] = useState(2);
  const [aspect, setAspect] = useState<AspectKey>("auto");
  const [gap, setGap] = useState(2);
  const [format, setFormat] = useState<OutFormat>("png");
  const [quality, setQuality] = useState(0.92);
  const [prefix, setPrefix] = useState("slice");
  const [slices, setSlices] = useState<SliceItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [notice, setNotice] = useState("");

  const [multi, setMulti] = useState<MultiItem[]>([]);
  const [multiMode, setMultiMode] = useState<"raw" | "stitch">("raw");
  const [visitors, setVisitors] = useState<number | null>(null);
  const multiId = useRef(0);
  const genRef = useRef(0);

  const T = useCallback((key: Parameters<typeof t>[1], vars?: Record<string, string | number>) => t(lang, key, vars), [lang]);

  const pickLang = (l: Lang) => {
    setLang(l);
    setShowLangPicker(false);
  };

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("xs-dark", dark ? "1" : "0");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("xs-lang", lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  const setSource = useCallback(
    async (file: File | Blob, name?: string) => {
      if (file.size > MAX_FILE_BYTES) {
        flash(T("fileTooLarge"));
        return;
      }
      try {
        const { img: image, url } = await loadImageFromFile(file);
        if (imageTooBig(image.naturalWidth, image.naturalHeight)) {
          URL.revokeObjectURL(url);
          flash(T("imgTooLarge"));
          return;
        }
        setImg(image);
        setSrcUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
        setSrcName(name || (file instanceof File ? file.name : "sample.png"));
      } catch {
        flash(T("imgInvalid"));
      }
    },
    [T, flash],
  );

  const addMulti = useCallback(
    async (files: File[]) => {
      const items: MultiItem[] = [];
      let skipped = 0;
      for (const f of files.slice(0, MAX_SLICES)) {
        try {
          if (f.size > MAX_FILE_BYTES) {
            skipped++;
            continue;
          }
          const { img: im, url } = await loadImageFromFile(f);
          if (imageTooBig(im.naturalWidth, im.naturalHeight)) {
            URL.revokeObjectURL(url);
            skipped++;
            continue;
          }
          items.push({
            id: ++multiId.current,
            file: f,
            url,
            name: f.name,
            img: im,
            width: im.naturalWidth,
            height: im.naturalHeight,
          });
        } catch {
          skipped++;
        }
      }
      setMulti((prev) => [...prev, ...items].slice(0, MAX_SLICES));
      if (skipped) flash(T("skippedN", { n: skipped }));
    },
    [T, flash],
  );

  // paste-to-upload
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      e.preventDefault();
      if (mode === "multi") void addMulti(files);
      else void setSource(files[0]);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [mode, addMulti, setSource]);

  // regenerate slices (debounced)
  useEffect(() => {
    if (mode !== "slice" || !img) return;
    const id = ++genRef.current;
    setBusy(true);
    const timer = setTimeout(() => {
      sliceImage(img, { direction, count, cols, rows, aspect, format, quality, prefix })
        .then((items) => {
          if (id !== genRef.current) {
            items.forEach((s) => URL.revokeObjectURL(s.url));
            return;
          }
          setSlices((prev) => {
            prev.forEach((s) => URL.revokeObjectURL(s.url));
            return items;
          });
          setBusy(false);
        })
        .catch(() => setBusy(false));
    }, 160);
    return () => clearTimeout(timer);
  }, [img, direction, count, cols, rows, aspect, format, quality, prefix, mode]);

  // stitch mode: join multi images → slice (debounced)
  useEffect(() => {
    if (mode !== "multi" || multiMode !== "stitch") return;
    if (!multi.length) {
      setSlices((prev) => {
        prev.forEach((s) => URL.revokeObjectURL(s.url));
        return [];
      });
      return;
    }
    const id = ++genRef.current;
    setBusy(true);
    const timer = setTimeout(() => {
      try {
        const canvas = stitchImages(multi.map((m) => m.img));
        sliceImage(canvas, { direction: "vertical", count, cols, rows, aspect, format, quality, prefix })
          .then((items) => {
            if (id !== genRef.current) {
              items.forEach((s) => URL.revokeObjectURL(s.url));
              return;
            }
            setSlices((prev) => {
              prev.forEach((s) => URL.revokeObjectURL(s.url));
              return items;
            });
            setBusy(false);
          })
          .catch(() => setBusy(false));
      } catch {
        setBusy(false);
      }
    }, 160);
    return () => clearTimeout(timer);
  }, [mode, multiMode, multi, count, cols, rows, aspect, format, quality, prefix]);

  // global visitor count (Vercount open API — same cookie/cache logic as their script)
  const visitorsFetched = useRef(false);
  useEffect(() => {
    if (visitorsFetched.current) return; // StrictMode double-mount guard
    visitorsFetched.current = true;
    const key = `vercount_uv_${location.host.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const isNew = !document.cookie.split("; ").some((c) => c.startsWith(`${key}=`));
    if (isNew) document.cookie = `${key}=1; path=/; max-age=31536000; samesite=lax`;
    fetch("https://events.vercount.one/api/v2/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: location.href, isNewUv: isNew }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        const d = j?.data ?? j;
        const n = Number(d?.site_uv ?? 0);
        if (n > 0) {
          setVisitors(n);
          try {
            localStorage.setItem("visitorCountData", JSON.stringify(d));
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        try {
          const c = JSON.parse(localStorage.getItem("visitorCountData") || "null");
          if (c?.site_uv) setVisitors(Number(c.site_uv));
        } catch {
          /* ignore */
        }
      });
  }, []);

  // cleanup on unmount
  useEffect(
    () => () => {
      slices.forEach((s) => URL.revokeObjectURL(s.url));
      multi.forEach((m) => URL.revokeObjectURL(m.url));
      if (srcUrl) URL.revokeObjectURL(srcUrl);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const gridTotal = Math.min(MAX_SLICES, cols * rows);

  const previewUrls = useMemo(
    () => (mode === "slice" || multiMode === "stitch" ? slices.map((s) => s.url) : multi.map((m) => m.url)),
    [mode, multiMode, slices, multi],
  );

  const exportFiles = useMemo(() => {
    if (mode === "slice" || multiMode === "stitch") {
      return slices.map((s) => ({ blob: s.blob, name: s.name }));
    }
    return multi.map((m, i) => {
      const ext = m.name.includes(".") ? m.name.split(".").pop()! : "png";
      return { blob: m.file as Blob, name: `${prefix}-${String(i + 1).padStart(2, "0")}.${ext}` };
    });
  }, [mode, multiMode, slices, multi, prefix]);

  const exportZip = async () => {
    setZipping(true);
    try {
      await downloadZip(exportFiles, `${prefix}.zip`);
      flash(T("downloaded", { n: exportFiles.length }));
    } finally {
      setZipping(false);
    }
  };

  const setColsClamped = (c: number) => {
    const nc = Math.max(1, Math.min(MAX_SLICES, c));
    setCols(nc);
    setRows((r) => Math.min(r, Math.max(1, Math.floor(MAX_SLICES / nc))));
  };
  const setRowsClamped = (r: number) => {
    const nr = Math.max(1, Math.min(MAX_SLICES, r));
    setRows(nr);
    setCols((c) => Math.min(c, Math.max(1, Math.floor(MAX_SLICES / nr))));
  };

  const dirBtn = (d: Direction, icon: React.ReactNode, label: string) => (
    <button
      key={d}
      onClick={() => setDirection(d)}
      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
        ${direction === d ? "bg-sky-500 text-white" : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"}`}
    >
      {icon}
      {label}
    </button>
  );

  const card = "rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900";
  const labelCls = "text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400";
  const inputCls =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-neutral-700 dark:bg-neutral-950";

  const move = (id: number, dir: -1 | 1) =>
    setMulti((prev) => {
      const i = prev.findIndex((m) => m.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="min-h-full flex flex-col">
      {/* header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <Scissors className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold leading-none">{T("appTitle")}</h1>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  20 max
                </span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{T("tagline")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              title={T("visitorsTip")}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
            >
              <Globe className="size-3.5" />
              <span>{visitors === null ? "···" : visitors.toLocaleString()}</span>
            </div>
            <button
              onClick={() => setLang(lang === "zh" ? "en" : "zh")}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <Languages className="size-4" />
              {lang === "zh" ? "EN" : "中文"}
            </button>
            <button
              onClick={() => setDark(!dark)}
              className="rounded-lg border border-neutral-200 p-2 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
        {/* mode tabs */}
        <div className="mb-5 inline-flex rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
          {(["slice", "multi"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors
                ${mode === m ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"}`}
            >
              {m === "slice" ? <Scissors className="size-4" /> : <Images className="size-4" />}
              {m === "slice" ? T("modeSlice") : T("modeMulti")}
            </button>
          ))}
        </div>

        {/* ============ SLICE MODE ============ */}
        {mode === "slice" &&
          (!img ? (
            <div className="mx-auto max-w-2xl py-8 text-center">
              <h2 className="text-brand-gradient text-2xl font-bold sm:text-3xl">{T("heroTitle")}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                {T("heroDesc")}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                {[T("heroPoint1"), T("heroPoint2"), T("heroPoint3")].map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    {p}
                  </span>
                ))}
              </div>
              <div className="mt-6">
                <Dropzone
                  onFiles={(f) => void setSource(f[0])}
                  hint={T("dropHint")}
                  pasteHint={T("dropPaste")}
                  formats={T("dropFormats")}
                />
              </div>
              <button
                onClick={async () => {
                  const { img: image, url } = await makeSampleImage();
                  setImg(image);
                  setSrcUrl((old) => {
                    if (old) URL.revokeObjectURL(old);
                    return url;
                  });
                  setSrcName("sample.png");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
              >
                <Sparkles className="size-4 text-amber-500" />
                {T("trySample")}
              </button>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
              {/* left: controls */}
              <div className="space-y-4">
                {/* source card */}
                <div className={card}>
                  <div className={labelCls}>{T("sourceImage")}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={srcUrl}
                      alt=""
                      className="size-14 rounded-lg border border-neutral-200 object-cover dark:border-neutral-700"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{srcName}</p>
                      <p className="text-xs text-neutral-500">
                        {img.naturalWidth} × {img.naturalHeight}px
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <label className="flex-1 cursor-pointer rounded-lg border border-neutral-200 py-1.5 text-center text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
                      {T("replace")}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && void setSource(e.target.files[0])}
                      />
                    </label>
                    <button
                      onClick={() => {
                        setImg(null);
                        setSlices([]);
                        setSrcUrl((old) => {
                          if (old) URL.revokeObjectURL(old);
                          return "";
                        });
                      }}
                      className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:border-neutral-700 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="size-4" />
                      {T("remove")}
                    </button>
                  </div>
                </div>

                {/* direction */}
                <div className={card}>
                  <div className={labelCls}>{T("direction")}</div>
                  <div className="mt-2 flex rounded-lg border border-neutral-200 p-1 dark:border-neutral-700">
                    {dirBtn("vertical", <Columns3 className="size-4" />, T("dirVertical"))}
                    {dirBtn("grid", <LayoutGrid className="size-4" />, T("dirGrid"))}
                  </div>

                  {direction === "grid" ? (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className={labelCls}>{T("cols")}</div>
                        <input
                          type="number"
                          min={1}
                          max={MAX_SLICES}
                          value={cols}
                          onChange={(e) => setColsClamped(+e.target.value)}
                          className={`${inputCls} mt-1`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className={labelCls}>{T("rows")}</div>
                        <input
                          type="number"
                          min={1}
                          max={MAX_SLICES}
                          value={rows}
                          onChange={(e) => setRowsClamped(+e.target.value)}
                          className={`${inputCls} mt-1`}
                        />
                      </div>
                      <div className="pt-4 text-sm font-medium text-neutral-500">
                        {T("gridTotal", { c: cols, r: rows, n: gridTotal })}
                      </div>
                    </div>
                  ) : (
                    <CountSlider count={count} onChange={setCount} T={T} />
                  )}

                  <AspectChips aspect={aspect} onChange={setAspect} T={T} />
                </div>

                {/* export */}
                <div className={card}>
                  <div className={labelCls}>{T("export")}</div>
                  <ExportFields
                    format={format}
                    onFormat={setFormat}
                    quality={quality}
                    onQuality={setQuality}
                    prefix={prefix}
                    onPrefix={setPrefix}
                    T={T}
                  />
                  <button
                    onClick={() => void exportZip()}
                    disabled={!slices.length || zipping}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    <Archive className="size-4" />
                    {zipping ? T("downloading") : T("downloadZip")}
                  </button>
                  {notice && (
                    <p className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {notice}
                    </p>
                  )}
                </div>
              </div>

              {/* right: preview + slices */}
              <div className="space-y-4">
                <div className={card}>
                  <div className="flex items-center justify-between">
                    <div className={labelCls}>{T("preview")}</div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      {T("gapPreview")}
                      <input
                        type="range"
                        min={0}
                        max={8}
                        value={gap}
                        onChange={(e) => setGap(+e.target.value)}
                        className="w-20 accent-sky-500"
                      />
                      <span className="w-6">{gap}px</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    {slices.length ? (
                      <TimelinePreview urls={previewUrls} gap={gap} />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-xl bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-800">
                        {busy ? "…" : T("emptySlices")}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-neutral-400">{T("previewHint")}</p>
                </div>

                <SliceThumbs slices={slices} title={T("slices")} hint={T("clickToDownload")} T={T} />
              </div>
            </div>
          ))}

        {/* ============ MULTI MODE ============ */}
        {mode === "multi" && (
          <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <div className="space-y-4">
              <div className={card}>
                <div className={labelCls}>
                  {T("modeMulti")} · {T("multiCount", { n: multi.length })}
                </div>
                <p className="mt-1.5 text-xs leading-5 text-neutral-500 dark:text-neutral-400">{T("multiHint")}</p>
                <div className="mt-3">
                  <Dropzone
                    compact
                    multiple
                    onFiles={(f) => void addMulti(f)}
                    hint={T("addImages")}
                    pasteHint={T("dropPaste")}
                    formats={T("dropFormats")}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  {multi.map((m, i) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 rounded-xl border border-neutral-200 p-2 dark:border-neutral-700"
                    >
                      <span className="w-5 text-center text-xs font-bold text-neutral-400">{i + 1}</span>
                      <img src={m.url} alt="" className="size-11 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{m.name}</p>
                        <p className="text-[11px] text-neutral-400">
                          {m.width}×{m.height}
                        </p>
                      </div>
                      <button
                        onClick={() => move(m.id, -1)}
                        title={T("moveLeft")}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                      >
                        <ArrowLeft className="size-3.5" />
                      </button>
                      <button
                        onClick={() => move(m.id, 1)}
                        title={T("moveRight")}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                      >
                        <ArrowRight className="size-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setMulti((prev) => {
                            const it = prev.find((x) => x.id === m.id);
                            if (it) URL.revokeObjectURL(it.url);
                            return prev.filter((x) => x.id !== m.id);
                          })
                        }
                        title={T("remove")}
                        className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {multi.length > 0 && (
                  <button
                    onClick={() => {
                      multi.forEach((m) => URL.revokeObjectURL(m.url));
                      setMulti([]);
                    }}
                    className="mt-4 w-full rounded-xl border border-neutral-200 py-2 text-sm text-red-500 hover:bg-red-50 dark:border-neutral-700 dark:hover:bg-red-950/30"
                  >
                    {T("clearAll")}
                  </button>
                )}
              </div>

              {/* output mode */}
              <div className={card}>
                <div className={labelCls}>{T("procMode")}</div>
                <div className="mt-2 flex rounded-lg border border-neutral-200 p-1 dark:border-neutral-700">
                  {(["raw", "stitch"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMultiMode(m)}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                        ${multiMode === m ? "bg-sky-500 text-white" : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"}`}
                    >
                      {m === "raw" ? <Images className="size-4" /> : <Scissors className="size-4" />}
                      {m === "raw" ? T("procRaw") : T("procStitch")}
                    </button>
                  ))}
                </div>

                {multiMode === "stitch" && (
                  <>
                    <p className="mt-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">{T("stitchDesc")}</p>
                    <CountSlider count={count} onChange={setCount} T={T} />
                    <AspectChips aspect={aspect} onChange={setAspect} T={T} />
                    <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                      <div className={labelCls}>{T("export")}</div>
                      <ExportFields
                        format={format}
                        onFormat={setFormat}
                        quality={quality}
                        onQuality={setQuality}
                        prefix={prefix}
                        onPrefix={setPrefix}
                        T={T}
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={() => void exportZip()}
                  disabled={zipping || (multiMode === "stitch" ? !slices.length : !multi.length)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  <Archive className="size-4" />
                  {zipping ? T("downloading") : T("downloadZip")}
                </button>
                {notice && (
                  <p className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">{notice}</p>
                )}
                {multiMode === "raw" && <SaveToAlbum files={exportFiles} T={T} onDone={flash} />}
              </div>
            </div>

            <div className="space-y-4">
              <div className={card}>
                <div className="flex items-center justify-between">
                  <div className={labelCls}>{T("preview")}</div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    {T("gapPreview")}
                    <input
                      type="range"
                      min={0}
                      max={8}
                      value={gap}
                      onChange={(e) => setGap(+e.target.value)}
                      className="w-20 accent-sky-500"
                    />
                    <span className="w-6">{gap}px</span>
                  </div>
                </div>
                <div className="mt-3">
                  {previewUrls.length ? (
                    <TimelinePreview urls={previewUrls} gap={gap} />
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-xl bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-800">
                      <ImageIcon className="mr-2 size-4" />
                      {busy ? "…" : T("emptySlices")}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-neutral-400">{T("previewHint")}</p>
              </div>

              {multiMode === "stitch" && slices.length > 0 && (
                <SliceThumbs slices={slices} title={T("slices")} hint={T("clickToDownload")} T={T} />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-200 py-5 dark:border-neutral-800">
        <div className="mx-auto max-w-3xl px-4 text-center text-xs leading-relaxed text-neutral-400">
          <p>
            {[T("footerTip1"), T("footerTip2"), T("footerTip3")].map((tip, i) => (
              <span key={i} className="inline-block">
                {i > 0 && <span className="mx-2.5 text-neutral-300 dark:text-neutral-600">·</span>}
                {tip}
              </span>
            ))}
          </p>
          <a
            href="https://x.com/isbestmee"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            © {new Date().getFullYear()} X Slice · {T("creditBy")} @isbestmee
          </a>
        </div>
      </footer>

      {showLangPicker && (
        <div
          className="anim-fade fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={() => setShowLangPicker(false)}
        >
          <div
            className="anim-pop w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-900 dark:bg-white">
                <Scissors className="size-5 text-white dark:text-neutral-900" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold leading-none">X Slice</div>
                <div className="mt-1 text-[11px] text-neutral-400">1 image → 20 slices · 一张图切 20 张</div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <div className="text-lg font-bold leading-snug">Which language do you prefer?</div>
              <div className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">你想用什么语言浏览本网站？</div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => pickLang("en")}
                className="rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                English
              </button>
              <button
                onClick={() => pickLang("zh")}
                className="rounded-xl border border-neutral-300 py-3.5 text-sm font-bold transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
              >
                中文
              </button>
            </div>
            <p className="mt-5 text-center text-[11px] leading-relaxed text-neutral-400">
              You can switch anytime in the top bar.
              <br />
              之后可随时在顶栏切换语言
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
