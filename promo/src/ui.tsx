import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, GRAD, XF, ZH } from "./theme";

export const EASE = Easing.bezier(0.22, 1, 0.36, 1);

export const lerp = (f: number, input: number[], output: number[], easing = EASE) =>
  interpolate(f, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export function useSpring(delay = 0, config = { damping: 14, stiffness: 130, mass: 0.7 }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: Math.max(0, f - delay), fps, config });
}

export const gradText: CSSProperties = {
  backgroundImage: GRAD,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/** Scene with cross-fade in/out; children see frames relative to the scene start. */
export function Scene({ from, to, first, last, children }: { from: number; to: number; first?: boolean; last?: boolean; children: ReactNode }) {
  const start = first ? from : from - XF / 2;
  const end = last ? to : to + XF / 2;
  return (
    <Sequence from={start} durationInFrames={end - start}>
      <Fade len={end - start} first={first} last={last}>
        {children}
      </Fade>
    </Sequence>
  );
}

function Fade({ len, first, last, children }: { len: number; first?: boolean; last?: boolean; children: ReactNode }) {
  const f = useCurrentFrame();
  const o = Math.min(first ? 1 : lerp(f, [0, XF], [0, 1]), last ? 1 : lerp(f, [len - XF, len], [1, 0]));
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
}

/** Paper background with dot grid and slowly drifting brand-colour glows. */
export function Paper() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.paper, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${C.dot} 2.2px, transparent 2.6px)`, backgroundSize: "46px 46px" }} />
      <div style={{ position: "absolute", width: 900, height: 900, left: -260 + Math.sin(f / 70) * 60, top: -380 + Math.cos(f / 80) * 40, borderRadius: "50%", background: C.cyan, opacity: 0.1, filter: "blur(140px)" }} />
      <div style={{ position: "absolute", width: 900, height: 900, right: -300 + Math.cos(f / 75) * 60, bottom: -420 + Math.sin(f / 65) * 40, borderRadius: "50%", background: C.pink, opacity: 0.1, filter: "blur(140px)" }} />
    </AbsoluteFill>
  );
}

export function ScissorsIcon({ size = 40, color = "currentColor", stroke = 2 }: { size?: number; color?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <path d="M8.12 8.12 12 12" />
      <path d="M20 4 8.12 15.88" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14.8 14.8 20 20" />
    </svg>
  );
}

export function XLogo({ size = 40, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Logo({ size = 64, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.26, background: dark ? "#fff" : C.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <ScissorsIcon size={size * 0.56} color={dark ? C.ink : "#fff"} stroke={2.2} />
    </div>
  );
}

/** Small brand + handle in the corners of every middle scene. */
export function Corners({ dark = false }: { dark?: boolean }) {
  const ink = dark ? "#fff" : C.ink;
  return (
    <>
      <div style={{ position: "absolute", left: 80, top: 56, display: "flex", alignItems: "center", gap: 14, fontFamily: FONT }}>
        <Logo size={44} dark={dark} />
        <span style={{ fontSize: 28, fontWeight: 800, color: ink, letterSpacing: -0.5 }}>X Slice</span>
      </div>
      <div style={{ position: "absolute", right: 80, top: 64, display: "flex", alignItems: "center", gap: 10, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: dark ? C.xGray : C.muted }}>
        <XLogo size={22} color={dark ? C.xGray : C.muted} />
        @isbestmee
      </div>
    </>
  );
}

/** English headline (word-by-word rise) + Chinese subline. */
export function Headline({
  words,
  zh,
  delay = 0,
  size = 92,
  align = "center",
  dark = false,
}: {
  words: { t: string; g?: boolean }[];
  zh?: string;
  delay?: number;
  size?: number;
  align?: "center" | "left";
  dark?: boolean;
}) {
  const f = useCurrentFrame();
  return (
    <div style={{ textAlign: align, fontFamily: FONT }}>
      <div style={{ fontSize: size, fontWeight: 850, letterSpacing: -size * 0.035, lineHeight: 1.1, color: dark ? "#fff" : C.ink }}>
        {words.map((w, i) => {
          const d = delay + i * 3;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: i < words.length - 1 ? size * 0.26 : 0,
                opacity: lerp(f, [d, d + 10], [0, 1]),
                transform: `translateY(${lerp(f, [d, d + 14], [size * 0.45, 0])}px)`,
                ...(w.g ? gradText : {}),
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
      {zh && (
        <div
          style={{
            marginTop: size * 0.26,
            fontFamily: ZH,
            fontSize: size * 0.4,
            fontWeight: 600,
            letterSpacing: 2,
            color: dark ? "#a8acb3" : C.muted,
            opacity: lerp(f, [delay + 10, delay + 22], [0, 1]),
            transform: `translateY(${lerp(f, [delay + 10, delay + 24], [16, 0])}px)`,
          }}
        >
          {zh}
        </div>
      )}
    </div>
  );
}

/** The white brand card — same artwork as the site's sample image (2400×1350 design space). */
export function BrandCard({ width }: { width: number }) {
  const s = width / 2400;
  const mark = (pos: CSSProperties) => (
    <div style={{ position: "absolute", width: 84, height: 84, borderColor: "#c3bfb4", borderStyle: "solid", borderWidth: 0, ...pos }} />
  );
  return (
    <div style={{ width, height: 1350 * s, position: "relative", overflow: "hidden", background: C.paper }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 2400, height: 1350, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(#eceae3 3.2px, transparent 3.7px)", backgroundSize: "64px 64px", backgroundPosition: "8px 8px" }} />
        {mark({ left: 64, top: 64, borderLeftWidth: 6, borderTopWidth: 6 })}
        {mark({ right: 64, top: 64, borderRightWidth: 6, borderTopWidth: 6 })}
        {mark({ left: 64, bottom: 64, borderLeftWidth: 6, borderBottomWidth: 6 })}
        {mark({ right: 64, bottom: 64, borderRightWidth: 6, borderBottomWidth: 6 })}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "stretch" }}>
            <div style={{ fontSize: 365, fontWeight: 900, lineHeight: 1, letterSpacing: -6, color: C.ink, whiteSpace: "nowrap" }}>
              <span style={gradText}>X</span> SLICE
            </div>
            <div style={{ marginTop: 40, height: 24, borderRadius: 12, backgroundImage: GRAD }} />
          </div>
          <div style={{ marginTop: 90, fontSize: 57, fontWeight: 600, letterSpacing: 14, color: C.muted }}>1 IMAGE&nbsp;&nbsp;→&nbsp;&nbsp;20 SLICES</div>
          <div style={{ marginTop: 90, display: "flex", gap: 22 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{ width: 96, height: 150, borderRadius: 22, backgroundImage: GRAD, backgroundSize: `${96 * 8 + 22 * 7}px 100%`, backgroundPosition: `${-i * 118}px 0` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Cuts `render(width)` into n vertical strips separated by `gap`. */
export function Sliced({
  n,
  width,
  height,
  gap,
  radius,
  render,
  stripStyle,
  shadow = true,
}: {
  n: number;
  width: number;
  height: number;
  gap: number;
  radius: number;
  render: (w: number) => ReactNode;
  stripStyle?: (i: number) => CSSProperties;
  shadow?: boolean;
}) {
  const sw = width / n;
  return (
    <div style={{ display: "flex", gap }}>
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          style={{
            width: sw,
            height,
            overflow: "hidden",
            borderRadius: radius,
            position: "relative",
            flexShrink: 0,
            boxShadow: shadow ? "0 18px 40px rgba(22,22,28,0.10)" : undefined,
            ...stripStyle?.(i),
          }}
        >
          <div style={{ position: "absolute", left: -i * sw, top: 0 }}>{render(width)}</div>
        </div>
      ))}
    </div>
  );
}

/** Dashed cut lines drawing from top to bottom. */
export function CutLines({ n, width, height, progress, color = C.violet }: { n: number; width: number; height: number; progress: number; color?: string }) {
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height, pointerEvents: "none" }}>
      {Array.from({ length: n - 1 }, (_, k) => (
        <div
          key={k}
          style={{
            position: "absolute",
            left: ((k + 1) * width) / n - 2,
            top: 0,
            width: 4,
            height: height * Math.min(1, Math.max(0, progress * 1.3 - k * 0.04)),
            backgroundImage: `repeating-linear-gradient(to bottom, ${color} 0 16px, transparent 16px 28px)`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

export function Chip({ children, delay, dark = false }: { children: ReactNode; delay: number; dark?: boolean }) {
  const s = useSpring(delay);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "20px 30px",
        borderRadius: 22,
        background: dark ? "#16181c" : "#fff",
        border: `2px solid ${dark ? C.xBorder : "#ebe8e0"}`,
        boxShadow: "0 12px 30px rgba(22,22,28,0.06)",
        fontFamily: FONT,
        fontSize: 34,
        fontWeight: 700,
        color: dark ? "#fff" : C.ink,
        opacity: s,
        transform: `translateX(${(1 - s) * 60}px)`,
      }}
    >
      <div style={{ width: 14, height: 14, borderRadius: 7, backgroundImage: GRAD, flexShrink: 0 }} />
      {children}
    </div>
  );
}
