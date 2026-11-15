import { Heart, MessageCircle, Repeat2, Bookmark, Share, BarChart3, BadgeCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  urls: string[];
  gap: number;
  sliceHeight?: number;
}

/** Simulates how a multi-image post looks in the X mobile timeline. */
export default function TimelinePreview({ urls, gap, sliceHeight = 300 }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(0);
  const [aspects, setAspects] = useState<number[]>([]);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setBoxW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // reset measured aspects when the slice set changes
  useEffect(() => setAspects([]), [urls]);

  // If the slices' total width is narrower than the card, grow the display
  // height so the strip fills the width exactly (no empty block on the right).
  // If it would need extreme height (very square sources), cap it and share
  // the width across slices with object-cover instead.
  const loadedAll = urls.length > 0 && aspects.filter(Boolean).length === urls.length;
  const aspectSum = loadedAll ? aspects.reduce((a, b) => a + b, 0) : 0;
  const n = urls.length;
  // gaps + 1px border on each side of every img
  const chrome = Math.max(0, n - 1) * gap + n * 2;
  const contentW = boxW - chrome;
  let h = sliceHeight;
  let stretch = false;
  if (aspectSum > 0 && boxW > 0) {
    const naturalW = sliceHeight * aspectSum + chrome;
    if (naturalW < boxW) {
      const needed = contentW / aspectSum;
      h = Math.min(needed, 560);
      stretch = needed > 560;
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-black overflow-hidden dark:border-neutral-800">
      {/* fake post header */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-3">
        <div className="size-10 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[15px]">
            <span className="font-bold text-white">You</span>
            <BadgeCheck className="size-4 text-sky-400 fill-sky-400/20" />
            <span className="text-neutral-500">@you · 2h</span>
          </div>
          <p className="text-[13px] text-neutral-500 truncate">check out this seamless panorama →</p>
        </div>
      </div>

      {/* the image strip — horizontally scrollable like X */}
      <div className="px-4">
        <div
          ref={stripRef}
          className="strip-scroll flex overflow-x-auto pb-1"
          style={{ gap: `${gap}px` }}
        >
          {urls.map((u, i) => (
            <img
              key={`${i}-${u}`}
              src={u}
              alt={`slice ${i + 1}`}
              draggable={false}
              onLoad={(e) => {
                const im = e.currentTarget;
                const a = im.naturalWidth / im.naturalHeight || 0;
                setAspects((prev) => {
                  if (prev[i] === a) return prev;
                  const next = [...prev];
                  next[i] = a;
                  return next;
                });
              }}
              className="rounded-xl object-cover shrink-0 border border-neutral-800"
              style={
                stretch
                  ? { height: h, width: (contentW * (aspects[i] || 0)) / aspectSum, objectFit: "cover" }
                  : { height: h, width: "auto" }
              }
            />
          ))}
        </div>
      </div>

      {/* fake action bar */}
      <div className="flex items-center justify-between px-4 py-2.5 text-neutral-500">
        <span className="flex items-center gap-1.5"><MessageCircle className="size-[18px]" /><span className="text-xs">12</span></span>
        <span className="flex items-center gap-1.5"><Repeat2 className="size-[18px]" /><span className="text-xs">34</span></span>
        <span className="flex items-center gap-1.5"><Heart className="size-[18px]" /><span className="text-xs">567</span></span>
        <span className="flex items-center gap-1.5"><BarChart3 className="size-[18px]" /><span className="text-xs">8.9K</span></span>
        <span className="flex items-center gap-3"><Bookmark className="size-[18px]" /><Share className="size-[18px]" /></span>
      </div>
    </div>
  );
}
