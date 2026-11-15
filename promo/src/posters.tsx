import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, GRAD, ZH } from "./theme";
import { BrandCard, Corners, Logo, Paper, ScissorsIcon, Sliced, XLogo, gradText } from "./ui";

export type Lang = "en" | "zh";

/* ---------------- static primitives (no frame animation) ---------------- */

function PTitle({ words, size = 100, align = "center", dark = false }: { words: { t: string; g?: boolean }[]; size?: number; align?: "center" | "left"; dark?: boolean }) {
  return (
    <div style={{ textAlign: align, fontFamily: FONT, fontSize: size, fontWeight: 850, letterSpacing: -size * 0.035, lineHeight: 1.08, color: dark ? "#fff" : C.ink }}>
      {words.map((w, i) => (
        <span key={i} style={{ display: "inline-block", marginRight: i < words.length - 1 ? size * 0.26 : 0, ...(w.g ? gradText : {}) }}>
          {w.t}
        </span>
      ))}
    </div>
  );
}

function PSub({ children, size = 40, dark = false, style }: { children: ReactNode; size?: number; dark?: boolean; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: FONT, fontSize: size, fontWeight: 600, color: dark ? "#a8acb3" : C.muted, letterSpacing: 1, ...style }}>{children}</div>
  );
}

function PZh({ children, size = 40, dark = false }: { children: ReactNode; size?: number; dark?: boolean }) {
  return <div style={{ fontFamily: ZH, fontSize: size, fontWeight: 600, letterSpacing: 3, color: dark ? "#a8acb3" : C.muted }}>{children}</div>;
}

function UrlPill({ dark = false }: { dark?: boolean }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "16px 32px",
        borderRadius: 999,
        background: dark ? "#16181c" : "#fff",
        border: `2px solid ${dark ? C.xBorder : "#e6e3da"}`,
        fontFamily: FONT,
        fontSize: 34,
        fontWeight: 700,
        color: dark ? "#fff" : C.ink,
      }}
    >
      <div style={{ width: 12, height: 12, borderRadius: 6, backgroundImage: GRAD }} />
      x-image-splitter.vercel.app
    </div>
  );
}

function PChip({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "18px 28px",
        borderRadius: 20,
        background: dark ? "#16181c" : "#fff",
        border: `2px solid ${dark ? C.xBorder : "#ebe8e0"}`,
        fontFamily: FONT,
        fontSize: 32,
        fontWeight: 700,
        color: dark ? "#fff" : C.ink,
      }}
    >
      <div style={{ width: 14, height: 14, borderRadius: 7, backgroundImage: GRAD, flexShrink: 0 }} />
      {children}
    </div>
  );
}

function Badge({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        padding: "10px 24px",
        borderRadius: 999,
        border: `2px solid ${dark ? C.xBorder : "#ddd9cd"}`,
        fontFamily: FONT,
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: 2.5,
        color: dark ? "#a8acb3" : C.muted,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------- static X post mock ---------------- */

const ICON = {
  reply: "M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z",
  repost: "M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z",
  views: "M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z",
};

export function XPostMock({ lang = "en", sliceCount = 8 }: { lang?: Lang; sliceCount?: number }) {
  const H = 540;
  const W = (H * 2400) / 1350;
  const viewW = 920;
  return (
    <div style={{ width: viewW + 2 * 36, borderRadius: 28, border: `2px solid ${C.xBorder}`, background: "#000", padding: "30px 36px 22px", fontFamily: FONT, boxShadow: "0 40px 120px rgba(0,0,0,0.55)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, backgroundImage: GRAD }} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 28 }}>
            <span style={{ color: "#fff", fontWeight: 800 }}>X Slice</span>
            <svg width={26} height={26} viewBox="0 0 24 24">
              <path fill={C.xBlue} d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.26 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z" />
              <path fill="#fff" d="m9.99 16.4-3.53-3.53 1.41-1.41 2.12 2.12 5.3-5.3 1.41 1.41z" />
            </svg>
            <span style={{ color: C.xGray }}>@isbestmee · now</span>
          </div>
          <div style={{ color: "#e7e9ea", fontSize: 28, marginTop: 4 }}>
            {lang === "en" ? (
              <>
                One image → {sliceCount} slices. Swipe for the full view <span style={{ fontFamily: ZH }}>→</span>
              </>
            ) : (
              <span style={{ fontFamily: ZH }}>一张图 → {sliceCount} 张切片，左滑看全景 →</span>
            )}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 24, width: viewW, overflow: "hidden", borderRadius: 18 }}>
        <Sliced n={sliceCount} width={W} height={H} gap={6} radius={18} shadow={false} render={(w) => <BrandCard width={w} />} stripStyle={() => ({ border: `1px solid ${C.xBorder}` })} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, color: C.xGray, fontSize: 24, paddingRight: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={C.xGray} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d={ICON.reply} />
          </svg>
          482
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={C.xGray} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d={ICON.repost} />
          </svg>
          2.1K
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10, color: C.pink }}>
          <svg width={30} height={30} viewBox="0 0 24 24" fill={C.pink} stroke={C.pink} strokeWidth={1.8}>
            <path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z" />
          </svg>
          18.3K
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={C.xGray} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d={ICON.views} />
          </svg>
          1.2M
        </span>
      </div>
    </div>
  );
}

function BrowserFrame({ width }: { width: number }) {
  const BH = (width * 998) / 1728;
  return (
    <div style={{ width, borderRadius: 22, overflow: "hidden", background: "#fff", border: "2px solid #e6e3da", boxShadow: "0 40px 100px rgba(22,22,28,0.18)" }}>
      <div style={{ height: 52, background: "#f2f1ec", display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderBottom: "1px solid #e6e3da" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
        ))}
        <div style={{ marginLeft: 22, flex: 1, height: 32, borderRadius: 16, background: "#fff", display: "flex", alignItems: "center", padding: "0 18px", fontFamily: FONT, fontSize: 19, color: "#6b675d" }}>x-image-splitter.vercel.app</div>
      </div>
      <Img src={staticFile("app.png")} style={{ width, height: BH, display: "block" }} />
    </div>
  );
}

/* ---------------- posters ---------------- */

const copy = {
  hero: {
    en: {
      title: [{ t: "Turn" }, { t: "1" }, { t: "image" }, { t: "into" }, { t: "20.", g: true }],
      sub: "Seamless multi-image posts for X",
      badge: "FREE · NO SIGNUP · 100% PRIVATE",
    },
    zh: {
      title: [{ t: "一张图" }, { t: "切成" }, { t: "20", g: true }, { t: "张" }],
      sub: "X 多图无缝帖子神器 · 竖切 / 网格 / 拼接",
      badge: "免费 · 无需注册 · 纯本地处理",
    },
  },
  timeline: {
    en: { title: [{ t: "Preview" }, { t: "like" }, { t: "it's" }, { t: "live", g: true }, { t: "on", g: true }, { t: "X.", g: true }], sub: "See the sliced post before you post it" },
    zh: { title: [{ t: "预览" }, { t: "就像" }, { t: "发在", g: true }, { t: "X", g: true }, { t: "上一样", g: true }], sub: "切片发帖前，先看 X 时间线效果" },
  },
  features: {
    en: {
      title: [{ t: "Free." }, { t: "Private." }, { t: "No", g: true }, { t: "signup.", g: true }],
      sub: "Slice · Stitch · Preview · Export — all in your browser",
      chips: ["Slice into 1–20", "Stitch & slice panoramas", "ZIP · PNG · JPEG · WebP", "中文 / English UI"],
    },
    zh: {
      title: [{ t: "免费" }, { t: "隐私" }, { t: "无需", g: true }, { t: "注册", g: true }],
      sub: "切割 · 拼接 · 预览 · 导出——全部在浏览器里完成",
      chips: ["竖切 / 网格，最多 20 张", "多图拼接成全景再切", "ZIP · PNG · JPEG · WebP", "中文 / English 界面"],
    },
  },
};

export function PosterHero({ lang = "en", square = false }: { lang?: Lang; square?: boolean }) {
  const t = copy.hero[lang];
  const zhFont = lang === "zh";
  const W = square ? 1000 : 1180;
  const H = (W * 1350) / 2400;
  const n = 10;
  const gap = 14;
  return (
    <AbsoluteFill>
      <Paper />
      <Corners />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: square ? 60 : 30 }}>
        <div style={{ fontFamily: zhFont ? ZH : FONT }}>
          <PTitle words={t.title} size={square ? 96 : 100} />
        </div>
        <PSub size={square ? 38 : 44} style={{ marginTop: 22, fontFamily: zhFont ? ZH : FONT, letterSpacing: zhFont ? 3 : 1 }}>
          {t.sub}
        </PSub>
        <div style={{ marginTop: square ? 46 : 40 }}>
          <Sliced
            n={n}
            width={W}
            height={H}
            gap={gap}
            radius={18}
            render={(w) => <BrandCard width={w} />}
            stripStyle={(i) => ({ transform: `translateY(${i % 2 ? 14 : -14}px)` })}
          />
        </div>
        <div style={{ marginTop: square ? 56 : 48, display: "flex", alignItems: "center", gap: 24 }}>
          <UrlPill />
          <Badge>{t.badge}</Badge>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function PosterTimeline({ lang = "en" }: { lang?: Lang }) {
  const t = copy.timeline[lang];
  const zhFont = lang === "zh";
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", width: 1100, height: 1100, right: -200, top: -300, borderRadius: "50%", background: C.violet, opacity: 0.16, filter: "blur(180px)" }} />
      <div style={{ position: "absolute", width: 800, height: 800, left: -300, bottom: -380, borderRadius: "50%", background: C.cyan, opacity: 0.12, filter: "blur(160px)" }} />
      <Corners dark />
      <div style={{ position: "absolute", left: 110, top: 280, width: 660 }}>
        <div style={{ fontFamily: zhFont ? ZH : FONT }}>
          <PTitle words={t.title} size={84} align="left" dark />
        </div>
        <PSub dark size={36} style={{ marginTop: 30, fontFamily: zhFont ? ZH : FONT, letterSpacing: zhFont ? 3 : 1 }}>
          {t.sub}
        </PSub>
        <div style={{ marginTop: 48 }}>
          <UrlPill dark />
        </div>
      </div>
      <div style={{ position: "absolute", left: 830, top: 165 }}>
        <XPostMock lang={lang} sliceCount={8} />
      </div>
    </AbsoluteFill>
  );
}

export function PosterFeatures({ lang = "en" }: { lang?: Lang }) {
  const t = copy.features[lang];
  const zhFont = lang === "zh";
  return (
    <AbsoluteFill>
      <Paper />
      <Corners />
      <div style={{ position: "absolute", left: 100, top: 210 }}>
        <BrowserFrame width={1120} />
      </div>
      <div style={{ position: "absolute", left: 1300, top: 190, width: 560 }}>
        <div style={{ fontFamily: zhFont ? ZH : FONT }}>
          <PTitle words={t.title} size={80} align="left" />
        </div>
        <PSub size={30} style={{ marginTop: 24, fontFamily: zhFont ? ZH : FONT, letterSpacing: zhFont ? 2 : 1 }}>
          {t.sub}
        </PSub>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
          {t.chips.map((c, i) => (
            <PChip key={i}>
              <span style={{ fontFamily: /[\u4e00-\u9fff]/.test(c) ? ZH : FONT }}>{c}</span>
            </PChip>
          ))}
        </div>
        <div style={{ marginTop: 40 }}>
          <UrlPill />
        </div>
      </div>
    </AbsoluteFill>
  );
}
