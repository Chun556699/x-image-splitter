import { Heart, MessageCircle, Repeat2, Bookmark, Share, BarChart3, BadgeCheck } from "lucide-react";

interface Props {
  urls: string[];
  gap: number;
  sliceHeight?: number;
}

/** Simulates how a multi-image post looks in the X mobile timeline. */
export default function TimelinePreview({ urls, gap, sliceHeight = 300 }: Props) {
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
          className="strip-scroll flex overflow-x-auto pb-1"
          style={{ gap: `${gap}px` }}
        >
          {urls.map((u, i) => (
            <img
              key={i}
              src={u}
              alt={`slice ${i + 1}`}
              draggable={false}
              className="rounded-xl object-cover shrink-0 border border-neutral-800"
              style={{ height: sliceHeight, width: "auto" }}
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
