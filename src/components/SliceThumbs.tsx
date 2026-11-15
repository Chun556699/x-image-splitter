import { useEffect, useRef, useState } from "react";
import { Check, Download, ImageDown } from "lucide-react";
import { downloadBlob, saveToAlbum, type SliceItem } from "../lib/slicer";
import type { TKey } from "../lib/i18n";

type TF = (key: TKey, vars?: Record<string, string | number>) => string;

export default function SliceThumbs({
  slices,
  title,
  hint,
  T,
}: {
  slices: SliceItem[];
  title: string;
  hint: string;
  T: TF;
}) {
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const allRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSel(new Set());
    setNote("");
  }, [slices]);

  const all = slices.length > 0 && sel.size === slices.length;
  const partial = sel.size > 0 && !all;
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = partial;
  }, [partial]);

  const toggle = (i: number) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const save = async () => {
    const files = [...sel].sort((a, b) => a - b).map((i) => ({ blob: slices[i].blob, name: slices[i].name }));
    setBusy(true);
    try {
      const r = await saveToAlbum(files);
      if (r === "shared") setNote(T("albumShared"));
      else if (r === "downloaded") setNote(T("albumSaved", { n: files.length }));
      if (r !== "cancelled") setTimeout(() => setNote(""), 5000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {title} · {slices.length}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <input
              ref={allRef}
              type="checkbox"
              checked={all}
              onChange={() => setSel(all ? new Set() : new Set(slices.map((_, i) => i)))}
              className="size-3.5 accent-sky-500"
            />
            {T("selectAll")}
          </label>
          <button
            onClick={() => void save()}
            disabled={!sel.size || busy}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <ImageDown className="size-3.5" />
            {busy ? "…" : T("saveAlbumN", { n: sel.size })}
          </button>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs text-neutral-400">{hint}</span>
        {note && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{note}</span>}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {slices.map((s, i) => (
          <button
            key={s.url}
            onClick={() => downloadBlob(s.blob, s.name)}
            title={`${s.name} · ${s.width}×${s.height}`}
            className={`group relative overflow-hidden rounded-lg border transition-transform hover:scale-[1.03] ${
              sel.has(i)
                ? "border-sky-500 ring-2 ring-sky-500/60"
                : "border-neutral-200 dark:border-neutral-700"
            }`}
          >
            <img src={s.url} alt="" className="aspect-[3/4] w-full object-cover" />
            <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {i + 1}
            </span>
            <span
              role="checkbox"
              aria-checked={sel.has(i)}
              onClick={(e) => {
                e.stopPropagation();
                toggle(i);
              }}
              className={`absolute right-1 top-1 z-10 grid size-6 place-items-center rounded-full border transition-colors ${
                sel.has(i)
                  ? "border-sky-500 bg-sky-500 text-white"
                  : "border-white/80 bg-black/30 text-transparent hover:bg-black/50"
              }`}
            >
              <Check className="size-3.5" strokeWidth={3.5} />
            </span>
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Download className="size-4 text-white" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
