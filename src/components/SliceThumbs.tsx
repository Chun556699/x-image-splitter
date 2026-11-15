import { Download } from "lucide-react";
import { downloadBlob, type SliceItem } from "../lib/slicer";

export default function SliceThumbs({ slices, title, hint }: { slices: SliceItem[]; title: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {title} · {slices.length}
        </div>
        <span className="text-xs text-neutral-400">{hint}</span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {slices.map((s, i) => (
          <button
            key={s.url}
            onClick={() => downloadBlob(s.blob, s.name)}
            title={`${s.name} · ${s.width}×${s.height}`}
            className="group relative overflow-hidden rounded-lg border border-neutral-200 transition-transform hover:scale-[1.03] dark:border-neutral-700"
          >
            <img src={s.url} alt="" className="aspect-[3/4] w-full object-cover" />
            <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {i + 1}
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
