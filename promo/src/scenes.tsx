import { AbsoluteFill, Easing, Img, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, GRAD, ZH } from "./theme";
import { BrandCard, Chip, Corners, CutLines, Headline, Logo, Paper, ScissorsIcon, Sliced, XLogo, gradText, lerp, useSpring } from "./ui";

/* ------------------------------------------------------------------ */
/* 1. Hook — "X now allows 20 images per post"                         */
/* ------------------------------------------------------------------ */
export function Hook() {
  const f = useCurrentFrame();
  // linear count: +1 every 3 frames from frame 15 → 20 at frame 69 (music ticks match)
  const n = Math.max(1, Math.min(20, 1 + Math.floor((f - 12) / 3)));
  const pill = useSpring(0);
  const numPop = useSpring(69, { damping: 9, stiffness: 180, mass: 0.6 });
  const tiles = 20;
  const tileW = 44;
  const tileGap = 14;
  const rowW = tiles * tileW + (tiles - 1) * tileGap;
  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 28px",
            borderRadius: 999,
            background: C.ink,
            color: "#fff",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 3,
            opacity: pill,
            transform: `translateY(${(1 - pill) * -30}px)`,
          }}
        >
          NEW ON <XLogo size={28} color="#fff" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 40 }}>
          <div
            style={{
              width: 440,
              textAlign: "right",
              fontSize: 360,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: -14,
              fontVariantNumeric: "tabular-nums",
              transform: `scale(${1 + Math.sin(numPop * Math.PI) * 0.08})`,
              ...gradText,
            }}
          >
            {n}
          </div>
          <div style={{ fontSize: 118, fontWeight: 850, lineHeight: 1.02, letterSpacing: -4, color: C.ink, opacity: lerp(f, [4, 16], [0, 1]), transform: `translateX(${lerp(f, [4, 20], [40, 0])}px)` }}>
            images
            <br />
            per post
          </div>
        </div>

        <div style={{ marginTop: 40, display: "flex", gap: tileGap, width: rowW }}>
          {Array.from({ length: tiles }, (_, i) => {
            const on = i < n;
            return (
              <div
                key={i}
                style={{
                  width: tileW,
                  height: 78,
                  borderRadius: 12,
                  backgroundImage: on ? GRAD : "none",
                  backgroundColor: on ? undefined : "#ebe8e0",
                  backgroundSize: `${rowW}px 100%`,
                  backgroundPosition: `${-i * (tileW + tileGap)}px 0`,
                  transform: `scaleY(${on ? 1 : 0.7})`,
                  transition: "none",
                }}
              />
            );
          })}
        </div>

        <div style={{ marginTop: 44, fontFamily: ZH, fontSize: 44, fontWeight: 600, letterSpacing: 3, color: C.muted, opacity: lerp(f, [24, 38], [0, 1]) }}>
          X 现在单条帖子最多可发 20 张图
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Idea — one image, cut lines draw, scissors travel                */
/* ------------------------------------------------------------------ */
export function Idea() {
  const f = useCurrentFrame();
  const W = 1180;
  const H = (W * 1350) / 2400;
  const card = useSpring(6);
  const cut = lerp(f, [40, 84], [0, 1], Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill>
      <Paper />
      <Corners />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
        <Headline delay={6} size={84} words={[{ t: "One" }, { t: "image." }, { t: "Seamless", g: true }, { t: "swipe.", g: true }]} zh="一张图，切出无缝滑动的多图帖子" />
        <div
          style={{
            position: "relative",
            marginTop: 54,
            width: W,
            height: H,
            borderRadius: 26,
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(22,22,28,0.14)",
            border: "2px solid #ebe8e0",
            opacity: card,
            transform: `translateY(${(1 - card) * 60}px) scale(${0.94 + card * 0.06})`,
          }}
        >
          <BrandCard width={W} />
          <CutLines n={8} width={W} height={H} progress={cut} />
          <div
            style={{
              position: "absolute",
              left: W / 2 - 32,
              top: -40 + cut * (H + 20),
              transform: `rotate(90deg) rotate(${Math.sin(f * 0.9) * 10}deg)`,
              opacity: cut > 0 && cut < 1 ? 1 : 0,
              color: C.ink,
            }}
          >
            <ScissorsIcon size={64} color={C.ink} stroke={2.4} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Slice — strips separate, count 8 → 12 → 20, slider mirrors UI    */
/* ------------------------------------------------------------------ */
const STEPS = [
  { at: 0, n: 8 },
  { at: 72, n: 12 },
  { at: 122, n: 20 },
];

export function SliceScene() {
  const f = useCurrentFrame();
  const W = 1000;
  const H = (W * 1350) / 2400;
  const step = [...STEPS].reverse().find((s) => f >= s.at)!;
  const n = step.n;
  const split = lerp(f, [10, 36], [0, 1]);
  const gap = split * (n === 20 ? 10 : 16);
  const radius = split * (n === 20 ? 10 : 16);
  const local = f - Math.max(step.at, 10);
  const totalW = W + gap * (n - 1);
  const chips = [4, 6, 8, 10, 12, 16, 20];
  const thumbX = lerp(f, [Math.max(step.at - 10, 0), step.at + 4], [((STEPS[Math.max(0, STEPS.indexOf(step) - 1)].n - 1) / 19) * 640, ((n - 1) / 19) * 640]);
  return (
    <AbsoluteFill>
      <Paper />
      <Corners />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
        <Headline delay={6} size={84} words={[{ t: "Slice" }, { t: "into" }, { t: "up" }, { t: "to" }, { t: "20", g: true }]} zh="竖切 · 网格 · 自定比例，实时生成" />
        <div style={{ marginTop: 40, height: H, display: "flex", alignItems: "center", justifyContent: "center", width: totalW }}>
          <Sliced
            n={n}
            width={W}
            height={H}
            gap={gap}
            radius={radius}
            render={(w) => <BrandCard width={w} />}
            stripStyle={(i) => {
              const d = i * (n === 20 ? 0.8 : 1.4);
              const p = lerp(local, [d, d + 16], [0, 1]);
              return { transform: `translateY(${(1 - p) * (i % 2 ? 26 : -26)}px)` };
            }}
          />
        </div>
        <div style={{ marginTop: 46, display: "flex", alignItems: "center", gap: 36, fontFamily: FONT, opacity: lerp(f, [18, 30], [0, 1]) }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.muted, letterSpacing: 2 }}>SLICES</div>
          <div style={{ position: "relative", width: 640, height: 12, borderRadius: 6, background: "#e6e3da" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: 12, width: thumbX, borderRadius: 6, background: C.cyan }} />
            <div style={{ position: "absolute", left: thumbX - 18, top: -12, width: 36, height: 36, borderRadius: 18, background: "#fff", border: `6px solid ${C.cyan}`, boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {chips.map((c) => (
              <div key={c} style={{ width: 62, height: 46, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, background: c === n ? C.cyan : "#ecebe6", color: c === n ? "#fff" : "#6b675d" }}>
                {c}
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Timeline — X post mock, strips scroll, like pops                 */
/* ------------------------------------------------------------------ */
function Icon({ d, color }: { d: string; color: string }) {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function TimelineScene() {
  const f = useCurrentFrame();
  const card = useSpring(8, { damping: 16, stiffness: 110, mass: 0.8 });
  const n = 10;
  const H = 560;
  const W = (H * 2400) / 1350;
  const gap = 6;
  const viewW = 932;
  const overflow = W + gap * (n - 1) - viewW;
  const scroll = lerp(f, [42, 112], [0, overflow], Easing.inOut(Easing.cubic));
  const like = useSpring(96, { damping: 8, stiffness: 220, mass: 0.5 });
  const liked = f >= 96;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", width: 1100, height: 1100, right: -200, top: -300, borderRadius: "50%", background: C.violet, opacity: 0.16, filter: "blur(180px)" }} />
      <div style={{ position: "absolute", width: 800, height: 800, left: -300, bottom: -380, borderRadius: "50%", background: C.cyan, opacity: 0.12, filter: "blur(160px)" }} />
      <Corners dark />
      <div style={{ position: "absolute", left: 120, top: 330, width: 640 }}>
        <Headline delay={6} size={86} align="left" dark words={[{ t: "Preview" }, { t: "it" }, { t: "like" }, { t: "it's" }, { t: "live", g: true }, { t: "on", g: true }, { t: "X.", g: true }]} zh="X 时间线实时预览，所见即所得" />
      </div>
      <div
        style={{
          position: "absolute",
          left: 820,
          top: 150,
          width: viewW + 2 * 36,
          borderRadius: 28,
          border: `2px solid ${C.xBorder}`,
          background: "#000",
          padding: "30px 36px 22px",
          fontFamily: FONT,
          opacity: card,
          transform: `translateY(${(1 - card) * 80}px)`,
          boxShadow: "0 40px 120px rgba(0,0,0,0.6)",
        }}
      >
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
              One image → {n} slices. Swipe <span style={{ fontFamily: ZH }}>无缝全景</span> →
            </div>
          </div>
        </div>
        <div style={{ marginTop: 24, width: viewW, overflow: "hidden", borderRadius: 18 }}>
          <div style={{ transform: `translateX(${-scroll}px)` }}>
            <Sliced n={n} width={W} height={H} gap={gap} radius={18} shadow={false} render={(w) => <BrandCard width={w} />} stripStyle={() => ({ border: `1px solid ${C.xBorder}` })} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, color: C.xGray, fontSize: 24, paddingRight: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon color={C.xGray} d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z" />
            482
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon color={C.xGray} d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
            2.1K
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: liked ? C.pink : C.xGray }}>
            <span style={{ display: "inline-flex", transform: `scale(${liked ? 0.7 + like * 0.3 + Math.sin(like * Math.PI) * 0.35 : 1})` }}>
              <svg width={30} height={30} viewBox="0 0 24 24" fill={liked ? C.pink : "none"} stroke={liked ? C.pink : C.xGray} strokeWidth={1.8}>
                <path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z" />
              </svg>
            </span>
            {liked ? "18.3K" : "18.2K"}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon color={C.xGray} d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z" />
            1.2M
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Stitch — 3 images merge into a panorama, then slice              */
/* ------------------------------------------------------------------ */
const PANELS = [
  { bg: "linear-gradient(160deg, #6fe3ff, #28c7fa 45%, #2a7bff)", label: "01" },
  { bg: "linear-gradient(160deg, #b9a6ff, #7a5fff 50%, #4b33d9)", label: "02" },
  { bg: "linear-gradient(160deg, #ffb0c8, #ff5f8f 50%, #ff8a4c)", label: "03" },
];
const PW = 380;
const PH = 475;

function Panorama({ gap, radius, wave }: { gap: number; radius: number; wave: number }) {
  const total = PW * 3 + gap * 2;
  return (
    <div style={{ position: "relative", width: total, height: PH }}>
      <div style={{ display: "flex", gap }}>
        {PANELS.map((p, i) => (
          <div key={i} style={{ width: PW, height: PH, borderRadius: radius, background: p.bg, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 34, top: 26, fontFamily: FONT, fontSize: 120, fontWeight: 900, color: "rgba(255,255,255,0.92)", letterSpacing: -4 }}>{p.label}</div>
            <div style={{ position: "absolute", right: -60, bottom: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
          </div>
        ))}
      </div>
      <svg width={total} height={PH} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={`M 0 ${PH * 0.7} C ${total * 0.2} ${PH * 0.45}, ${total * 0.35} ${PH * 0.9}, ${total * 0.5} ${PH * 0.65} S ${total * 0.8} ${PH * 0.4}, ${total} ${PH * 0.62}`}
          fill="none"
          stroke="#fff"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={total * 1.3}
          strokeDashoffset={total * 1.3 * (1 - wave)}
          opacity={0.95}
        />
      </svg>
    </div>
  );
}

export function StitchScene() {
  const f = useCurrentFrame();
  const merge = lerp(f, [22, 50], [0, 1], Easing.inOut(Easing.cubic));
  const wave = lerp(f, [48, 66], [0, 1]);
  const cut = lerp(f, [64, 82], [0, 1]);
  const split = lerp(f, [84, 104], [0, 1]);
  const enter = useSpring(6);
  const W = PW * 3;
  const n = 9;
  return (
    <AbsoluteFill>
      <Paper />
      <Corners />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
        <Headline delay={6} size={84} words={[{ t: "Many" }, { t: "images?" }, { t: "Stitch,", g: true }, { t: "then", g: true }, { t: "slice.", g: true }]} zh="多图横向拼接成全景，再一键切割" />
        <div style={{ marginTop: 70, position: "relative", height: PH, display: "flex", alignItems: "center", opacity: enter, transform: `translateY(${(1 - enter) * 50}px)` }}>
          {f < 84 ? (
            <div style={{ position: "relative", boxShadow: merge > 0.98 ? "0 30px 80px rgba(22,22,28,0.16)" : undefined, borderRadius: 24 * merge }}>
              <Panorama gap={(1 - merge) * 80} radius={24 * (1 - merge) + 0.0001} wave={wave} />
              {merge >= 1 && <CutLines n={n} width={W} height={PH} progress={cut} color="#ffffff" />}
            </div>
          ) : (
            <Sliced n={n} width={W} height={PH} gap={split * 14} radius={split * 14} render={() => <Panorama gap={0} radius={0} wave={1} />} />
          )}
        </div>
        <div style={{ marginTop: 40, display: "flex", gap: 20, fontFamily: FONT, fontSize: 28, fontWeight: 700, color: C.muted, letterSpacing: 2, opacity: lerp(f, [14, 26], [0, 1]) }}>
          <span style={{ color: f < 50 ? C.ink : C.muted }}>3 IMAGES</span>
          <span>→</span>
          <span style={{ color: f >= 50 && f < 84 ? C.ink : C.muted }}>1 PANORAMA</span>
          <span>→</span>
          <span style={{ color: f >= 84 ? C.ink : C.muted }}>{n} SLICES</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Product — real UI screenshot + feature chips                     */
/* ------------------------------------------------------------------ */
export function ProductScene() {
  const f = useCurrentFrame();
  const enter = useSpring(6, { damping: 18, stiffness: 100, mass: 0.9 });
  const BW = 1120;
  const BH = (BW * 998) / 1728;
  return (
    <AbsoluteFill>
      <Paper />
      <Corners />
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 200,
          width: BW,
          borderRadius: 22,
          overflow: "hidden",
          background: "#fff",
          border: "2px solid #e6e3da",
          boxShadow: "0 40px 100px rgba(22,22,28,0.18)",
          opacity: enter,
          transform: `perspective(1800px) rotateY(${(1 - enter) * 14}deg) translateY(${(1 - enter) * 60}px) scale(${0.95 + enter * 0.05})`,
          transformOrigin: "left center",
        }}
      >
        <div style={{ height: 52, background: "#f2f1ec", display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderBottom: "1px solid #e6e3da" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
          ))}
          <div style={{ marginLeft: 22, flex: 1, height: 32, borderRadius: 16, background: "#fff", display: "flex", alignItems: "center", padding: "0 18px", fontFamily: FONT, fontSize: 19, color: "#6b675d" }}>
            x-image-splitter.vercel.app
          </div>
        </div>
        <Img src={staticFile("app.png")} style={{ width: BW, height: BH, display: "block", transform: `scale(${1 + lerp(f, [10, 130], [0, 0.04], Easing.linear)})`, transformOrigin: "60% 30%" }} />
      </div>
      <div style={{ position: "absolute", left: 1290, top: 200, width: 560 }}>
        <Headline delay={10} size={66} align="left" words={[{ t: "Everything" }, { t: "runs" }, { t: "in" }, { t: "your", g: true }, { t: "browser.", g: true }]} zh="纯本地处理，图片不上传" />
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          <Chip delay={30}>
            100% private <span style={{ fontFamily: ZH, color: C.muted, fontWeight: 600 }}>隐私安全</span>
          </Chip>
          <Chip delay={40}>
            Save & post to X <span style={{ fontFamily: ZH, color: C.muted, fontWeight: 600 }}>一键发帖</span>
          </Chip>
          <Chip delay={50}>ZIP · PNG · JPEG · WebP</Chip>
          <Chip delay={60}>
            Free · <span style={{ fontFamily: ZH }}>中文</span> / English
          </Chip>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Outro — logo, URL, Follow @isbestmee                             */
/* ------------------------------------------------------------------ */
export function Outro() {
  const f = useCurrentFrame();
  const logo = useSpring(8, { damping: 11, stiffness: 140, mass: 0.7 });
  const follow = useSpring(46, { damping: 13, stiffness: 120, mass: 0.8 });
  const press = f >= 100 ? lerp(f, [100, 104, 112], [1, 0.92, 1], Easing.out(Easing.quad)) : 1;
  const following = f >= 104;
  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ display: "flex", alignItems: "center", gap: 36, opacity: logo, transform: `scale(${0.8 + logo * 0.2})` }}>
          <Logo size={150} />
          <div style={{ fontSize: 168, fontWeight: 900, letterSpacing: -6, color: C.ink, lineHeight: 1 }}>
            <span style={gradText}>X</span> Slice
          </div>
        </div>
        <div style={{ marginTop: 34, fontSize: 52, fontWeight: 750, color: C.ink, letterSpacing: -1, opacity: lerp(f, [18, 30], [0, 1]) }}>
          Slice. Preview. Post. <span style={{ fontFamily: ZH, color: C.muted, fontWeight: 600, fontSize: 44, marginLeft: 12 }}>一键切图发推</span>
        </div>
        <div
          style={{
            marginTop: 34,
            padding: "16px 34px",
            borderRadius: 999,
            background: "#fff",
            border: "2px solid #e6e3da",
            fontSize: 36,
            fontWeight: 700,
            color: C.ink,
            letterSpacing: 0.5,
            opacity: lerp(f, [26, 38], [0, 1]),
            transform: `translateY(${lerp(f, [26, 40], [20, 0])}px)`,
          }}
        >
          x-image-splitter.vercel.app
        </div>

        <div style={{ marginTop: 70, display: "flex", alignItems: "center", gap: 30, opacity: follow, transform: `translateY(${(1 - follow) * 50}px)` }}>
          <div style={{ width: 108, height: 108, borderRadius: 54, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <XLogo size={54} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 700, color: C.muted, letterSpacing: 3 }}>FOLLOW ON X</div>
            <div style={{ fontSize: 92, fontWeight: 900, letterSpacing: -3, lineHeight: 1.05, ...gradText }}>@isbestmee</div>
          </div>
          <div
            style={{
              marginLeft: 20,
              padding: "22px 46px",
              borderRadius: 999,
              background: following ? "#fff" : C.ink,
              border: `3px solid ${C.ink}`,
              color: following ? C.ink : "#fff",
              fontSize: 38,
              fontWeight: 800,
              transform: `scale(${press})`,
            }}
          >
            {following ? "Following" : "Follow"}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
