export const FPS = 30;
/** Scene boundaries (frames). Each is a bar line at 120 BPM (2 s = 60 frames) — keep in sync with scripts/music.mjs. */
export const CUTS = [120, 240, 420, 540, 660, 780];
export const DURATION = 930;
/** Cross-fade length between scenes. */
export const XF = 12;

export const FONT = '"Inter Variable", Inter, "Microsoft YaHei", "PingFang SC", system-ui, sans-serif';
export const ZH = '"Microsoft YaHei", "PingFang SC", "Inter Variable", sans-serif';

export const C = {
  paper: "#fafaf7",
  ink: "#16161c",
  muted: "#8a8577",
  soft: "#b5b0a3",
  line: "#d7d4ca",
  dot: "#e7e4dc",
  cyan: "#28c7fa",
  violet: "#7a5fff",
  pink: "#ff5f8f",
  xBlue: "#1d9bf0",
  xBorder: "#2f3336",
  xGray: "#71767b",
};

export const GRAD = `linear-gradient(90deg, ${C.cyan}, ${C.violet} 55%, ${C.pink})`;
