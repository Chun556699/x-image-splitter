import { useState } from "react";
import { Share2 } from "lucide-react";
import { MAX_SLICES, postToX, type AspectKey, type OutFormat } from "../lib/slicer";
import type { TKey } from "../lib/i18n";

type TF = (key: TKey, vars?: Record<string, string | number>) => string;

const ASPECT_OPTIONS: AspectKey[] = ["auto", "9:16", "3:4", "4:5", "1:1", "4:3", "16:9"];

const inputCls =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-neutral-700 dark:bg-neutral-950";
const labelCls = "text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400";

export function CountSlider({ count, onChange, T }: { count: number; onChange: (n: number) => void; T: TF }) {
  const clamp = (n: number) => Math.max(1, Math.min(MAX_SLICES, n || 1));
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <div className={labelCls}>{T("sliceCount")}</div>
        <input
          type="number"
          min={1}
          max={MAX_SLICES}
          value={count}
          onChange={(e) => onChange(clamp(+e.target.value))}
          className="w-16 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-center text-sm outline-none focus:border-sky-500 dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>
      <input
        type="range"
        min={1}
        max={MAX_SLICES}
        value={count}
        onChange={(e) => onChange(+e.target.value)}
        className="mt-2 w-full accent-sky-500"
      />
      <div className="mt-1 flex flex-wrap gap-1.5">
        {[4, 6, 8, 10, 12, 16, 20].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${count === n ? "bg-sky-500 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AspectChips({ aspect, onChange, T }: { aspect: AspectKey; onChange: (a: AspectKey) => void; T: TF }) {
  return (
    <div className="mt-4">
      <div className={labelCls}>{T("aspect")}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ASPECT_OPTIONS.map((a) => (
          <button
            key={a}
            onClick={() => onChange(a)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${aspect === a ? "bg-sky-500 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"}`}
          >
            {a === "auto" ? T("aspectAuto") : a}
          </button>
        ))}
      </div>
      {aspect !== "auto" && (
        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">{T("aspectNote")}</p>
      )}
    </div>
  );
}

export function ExportFields({
  format,
  onFormat,
  quality,
  onQuality,
  prefix,
  onPrefix,
  T,
}: {
  format: OutFormat;
  onFormat: (f: OutFormat) => void;
  quality: number;
  onQuality: (q: number) => void;
  prefix: string;
  onPrefix: (p: string) => void;
  T: TF;
}) {
  return (
    <>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-xs text-neutral-500">{T("format")}</div>
          <select value={format} onChange={(e) => onFormat(e.target.value as OutFormat)} className={inputCls}>
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
        <div>
          <div className="mb-1 text-xs text-neutral-500">
            {T("quality")} {format === "png" ? "—" : `${Math.round(quality * 100)}%`}
          </div>
          <input
            type="range"
            min={0.5}
            max={1}
            step={0.01}
            disabled={format === "png"}
            value={quality}
            onChange={(e) => onQuality(+e.target.value)}
            className="mt-2.5 w-full accent-sky-500 disabled:opacity-40"
          />
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 text-xs text-neutral-500">{T("prefix")}</div>
        <input
          value={prefix}
          onChange={(e) => onPrefix(e.target.value.replace(/[\\/:*?"<>|]/g, "") || "slice")}
          className={inputCls}
        />
      </div>
    </>
  );
}

export function PostToX({
  files,
  T,
  onDone,
}: {
  files: { blob: Blob; name: string }[];
  T: TF;
  onDone: (msg: string) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      const r = await postToX(files, text);
      if (r === "shared") onDone(T("postShared"));
      else if (r === "downloaded") onDone(T("postSaved", { n: files.length }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={T("postTextPh")}
        maxLength={280}
        className={inputCls}
      />
      <button
        onClick={() => void go()}
        disabled={!files.length || busy}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-neutral-900 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-50 dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-neutral-900"
      >
        <Share2 className="size-4" />
        {busy ? "…" : T("postToX")}
      </button>
    </div>
  );
}
