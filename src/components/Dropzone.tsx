import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

interface Props {
  onFiles: (files: File[]) => void;
  hint: string;
  pasteHint: string;
  formats: string;
  compact?: boolean;
  multiple?: boolean;
}

export default function Dropzone({ onFiles, hint, pasteHint, formats, compact, multiple }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const pick = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        pick(e.dataTransfer.files);
      }}
      className={`w-full rounded-2xl border-2 border-dashed text-center transition-colors cursor-pointer
        ${compact ? "p-4" : "p-8"}
        ${over
          ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40"
          : "border-neutral-300 bg-white hover:border-sky-400 hover:bg-sky-50/50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-sky-600 dark:hover:bg-sky-950/20"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex flex-col items-center gap-1.5 pointer-events-none">
        <ImagePlus className={`${compact ? "size-6" : "size-9"} text-sky-500`} strokeWidth={1.6} />
        <p className={`${compact ? "text-sm" : "text-base"} font-medium`}>{hint}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {pasteHint} · {formats}
        </p>
      </div>
    </button>
  );
}
