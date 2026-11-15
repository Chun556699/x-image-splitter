// Synthesises the promo soundtrack (31 s, 44.1 kHz stereo WAV) from scratch — no samples, no deps.
// 120 BPM bright pop-house in D: Dmaj9 – Bm7 – Gmaj7 – A6, one chord per bar (2 s).
// Scene cuts land on bar lines (CUTS, in frames @30fps) and each gets a "snip" + whoosh.
// The intro counter (1 → 20) gets a rising tick per number, matching Hook in scenes.tsx.
import fs from "node:fs";
import path from "node:path";

const SR = 44100;
const DUR = 31;
const N = SR * DUR;
const BEAT = 0.5;
const BAR = BEAT * 4;
const CUTS = [120, 240, 420, 540, 660, 780].map((f) => f / 30);
const DROP = CUTS[0]; // drums enter
const FULL = CUTS[1]; // claps, hats, lead
const OUTRO = CUTS[5];

const midi = (m) => 440 * 2 ** ((m - 69) / 12);

// two buses: "duck" gets sidechain pumping from the kick, "dry" doesn't
const bus = { duck: [new Float32Array(N), new Float32Array(N)], dry: [new Float32Array(N), new Float32Array(N)] };

function add(t0, buf, { pan = 0, gain = 1, to = "dry" } = {}) {
  const [L, R] = bus[to];
  const s0 = Math.floor(t0 * SR);
  const gl = Math.cos(((pan + 1) * Math.PI) / 4) * gain;
  const gr = Math.sin(((pan + 1) * Math.PI) / 4) * gain;
  for (let i = 0; i < buf.length; i++) {
    const j = s0 + i;
    if (j < 0 || j >= N) continue;
    L[j] += buf[i] * gl;
    R[j] += buf[i] * gr;
  }
}

let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

/** Supersaw-ish pad: 3 detuned saws, low-passed, slow attack. */
function pad(freq, len, attack = 0.25, release = 0.9) {
  const n = Math.floor((len + release) * SR);
  const out = new Float32Array(n);
  const det = [0.994, 1, 1.006];
  const ph = det.map(() => rand() * 0.5 + 0.5);
  let lp1 = 0;
  let lp2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = t < attack ? t / attack : t < len ? 1 : Math.max(0, 1 - (t - len) / release);
    let x = 0;
    for (let k = 0; k < 3; k++) {
      ph[k] = (ph[k] + (freq * det[k]) / SR) % 1;
      x += ph[k] * 2 - 1;
    }
    x /= 3;
    lp1 += (x - lp1) * 0.06;
    lp2 += (lp1 - lp2) * 0.06;
    out[i] = lp2 * env;
  }
  return out;
}

/** Plucky lead: square + sine, fast decay, slight vibrato. */
function lead(freq, len = 0.32) {
  const n = Math.floor((len + 0.4) * SR);
  const out = new Float32Array(n);
  let ph = 0;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const vib = 1 + 0.003 * Math.sin(2 * Math.PI * 5.5 * t) * Math.min(1, t / 0.15);
    ph = (ph + (freq * vib) / SR) % 1;
    const sq = ph < 0.5 ? 1 : -1;
    const x = sq * 0.35 + Math.sin(2 * Math.PI * ph) * 0.65;
    const cutoff = 0.05 + 0.35 * Math.exp(-t / 0.08);
    lp += (x - lp) * cutoff;
    const env = Math.min(1, t / 0.005) * (t < len ? Math.exp(-t / 0.35) : Math.exp(-len / 0.35) * Math.exp(-(t - len) / 0.08));
    out[i] = lp * env;
  }
  return out;
}

/** Bell / pluck for the arp and counter ticks. */
function pluck(freq, decay = 0.3) {
  const n = Math.floor(decay * 5 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.002) * Math.exp(-t / decay);
    out[i] = (Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(2 * Math.PI * freq * 3.01 * t) * Math.exp(-t / 0.05)) * env;
  }
  return out;
}

function bell(freq, len = 3) {
  const n = Math.floor(len * SR);
  const out = new Float32Array(n);
  const parts = [[1, 1, 1.4], [2.76, 0.3, 0.6], [5.4, 0.12, 0.3], [2, 0.25, 0.9]];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let x = 0;
    for (const [m, a, d] of parts) x += a * Math.sin(2 * Math.PI * freq * m * t) * Math.exp(-t / d);
    out[i] = x * Math.min(1, t / 0.002);
  }
  return out;
}

function kick() {
  const n = Math.floor(0.4 * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (45 + 110 * Math.exp(-t / 0.025))) / SR;
    out[i] = Math.tanh(Math.sin(ph) * 1.6) * Math.exp(-t / 0.16) + (i < 90 ? rand() * 0.15 * (1 - i / 90) : 0);
  }
  return out;
}

function clap() {
  const n = Math.floor(0.25 * SR);
  const out = new Float32Array(n);
  let bp1 = 0;
  let bp2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // three quick bursts then a tail
    const burst = [0, 0.011, 0.022].reduce((a, o) => a + (t >= o ? Math.exp(-(t - o) / 0.004) : 0), 0);
    const env = burst * 0.6 + Math.exp(-t / 0.07);
    const w = rand();
    bp1 += (w - bp1) * 0.35;
    bp2 += (bp1 - bp2) * 0.35;
    out[i] = (bp1 - bp2) * env * 2.2;
  }
  return out;
}

function hat(open = false) {
  const n = Math.floor((open ? 0.22 : 0.05) * SR);
  const out = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const w = rand();
    out[i] = (w - prev) * Math.exp(-(i / SR) / (open ? 0.07 : 0.014));
    prev = w;
  }
  return out;
}

function bass(freq, len) {
  const n = Math.floor(len * SR);
  const out = new Float32Array(n);
  let ph = 0;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph = (ph + freq / SR) % 1;
    const saw = ph * 2 - 1;
    lp += (saw - lp) * (0.04 + 0.12 * Math.exp(-t / 0.06));
    const env = Math.min(1, t / 0.004) * Math.min(1, (len - t) / 0.02);
    out[i] = (lp * 0.7 + Math.sin(2 * Math.PI * ph) * 0.6) * env;
  }
  return out;
}

/** Scissors "snip": two short metallic clicks. */
function snip() {
  const n = Math.floor(0.16 * SR);
  const out = new Float32Array(n);
  let hp = 0;
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = (t >= 0 ? Math.exp(-t / 0.006) : 0) + (t >= 0.07 ? 0.8 * Math.exp(-(t - 0.07) / 0.008) : 0);
    const w = rand();
    hp = w - prev + hp * 0.3;
    prev = w;
    const ring = Math.sin(2 * Math.PI * 4200 * t) * 0.5 + Math.sin(2 * Math.PI * 6900 * t) * 0.3;
    out[i] = (hp * 0.6 + ring) * e;
  }
  return out;
}

/** Filtered-noise whoosh, rising into a cut. */
function whoosh(len = 0.6) {
  const n = Math.floor(len * SR);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    lp += (rand() - lp) * (0.01 + p * p * 0.3);
    out[i] = lp * Math.sin(Math.PI * p) ** 2 * (0.4 + p);
  }
  return out;
}

const CHORDS = [
  { root: 38, notes: [62, 66, 69, 73, 76] }, // Dmaj9
  { root: 35, notes: [59, 62, 66, 69] }, // Bm7
  { root: 31, notes: [55, 59, 62, 66] }, // Gmaj7
  { root: 33, notes: [57, 61, 64, 66] }, // A6
];
const chordAt = (t) => CHORDS[Math.floor(t / BAR) % 4];

// --- pads (whole track until outro) ---
for (let b = 0; b * BAR < OUTRO; b++) {
  const t0 = b * BAR;
  const ch = CHORDS[b % 4];
  ch.notes.forEach((m, i) =>
    add(t0, pad(midi(m), BAR - 0.05), { pan: (i / (ch.notes.length - 1)) * 1.2 - 0.6, gain: t0 < DROP ? 0.085 : 0.07, to: "duck" }),
  );
}

// --- outro chord: big Dmaj9 ringing out ---
[50, 57, 62, 66, 69, 73, 76].forEach((m, i) => add(OUTRO, pad(midi(m), 2.8, 0.05, 2.2), { pan: (i / 6) * 1.4 - 0.7, gain: 0.07 }));
add(OUTRO, bass(midi(26), 2.2), { gain: 0.32 });
[78, 81, 86].forEach((m, i) => add(OUTRO + i * 0.25, bell(midi(m)), { pan: [-0.4, 0.4, 0][i], gain: 0.09 }));

// --- intro counter ticks (Hook: n increments every 3 frames from frame 15 to 69) ---
const SCALE = [74, 76, 78, 81, 83, 86, 88, 90, 93, 95];
for (let k = 1; k <= 19; k++) {
  const t = (12 + 3 * k) / 30;
  add(t, pluck(midi(SCALE[Math.floor((k / 19) * (SCALE.length - 1))]), 0.09), { pan: k % 2 ? 0.3 : -0.3, gain: 0.14 });
}
add(72 / 30, bell(midi(86), 2), { gain: 0.16 }); // "20!" sparkle
for (let t = 0; t < DROP - 0.01; t += BEAT * 2) add(t, kick(), { gain: 0.3 }); // intro half-time pulse
for (let t = 2; t < DROP - 0.01; t += BEAT / 2) add(t, hat(), { pan: 0.3, gain: 0.02 + ((t - 2) / 2) * 0.04 }); // building hats

// --- arpeggio 16ths, light in intro, fuller later ---
for (let t = 0, k = 0; t < OUTRO - 0.05; t += BEAT / 2, k++) {
  if (t < 72 / 30 && t > 0.3) continue; // leave room for the counter ticks
  const ch = chordAt(t);
  const order = [0, 2, 1, 3, 2, 1, 3, 2];
  const m = ch.notes[order[k % 8] % ch.notes.length] + 12;
  add(t, pluck(midi(m), 0.18), { pan: k % 2 ? 0.5 : -0.5, gain: t < DROP ? 0.06 : 0.045, to: "duck" });
}

// --- drums ---
for (let t = DROP; t < OUTRO - 0.01; t += BEAT) add(t, kick(), { gain: 0.5 });
for (let t = FULL + BEAT; t < OUTRO - 0.01; t += BEAT * 2) add(t, clap(), { pan: 0.05, gain: 0.22 });
for (let t = DROP + BEAT / 2; t < OUTRO - 0.01; t += BEAT) add(t, hat(t >= FULL), { pan: 0.3, gain: t >= FULL ? 0.07 : 0.05 });
for (let t = FULL + BEAT / 4; t < OUTRO - 0.01; t += BEAT / 2) add(t, hat(), { pan: -0.35, gain: 0.03 });

// --- bass: offbeat 8ths (house) from the drop ---
for (let t = DROP; t < OUTRO - 0.01; t += BEAT) {
  const ch = chordAt(t);
  add(t + BEAT / 2, bass(midi(ch.root + 12), BEAT / 2 - 0.02), { gain: 0.26, to: "duck" });
}

// --- lead hook (4-bar motif, 8th-note grid; null = rest) ---
const MOTIF = [
  [74, null, 76, null, 78, 76, null, 74],
  [73, null, 71, null, 73, 74, null, null],
  [71, null, 74, null, 78, null, 76, 74],
  [76, null, 73, null, 76, 78, 81, null],
];
for (let t = FULL; t < OUTRO - 0.01; t += BAR) {
  const bar = Math.floor((t - FULL) / BAR) % 4;
  MOTIF[bar].forEach((m, i) => {
    if (m !== null) add(t + i * (BEAT / 2), lead(midi(m)), { pan: 0.1, gain: 0.11 });
  });
}

// --- cut SFX: whoosh into each cut, snip on it ---
CUTS.slice(0, 5).forEach((c, i) => {
  add(c - 0.55, whoosh(0.6), { pan: i % 2 ? 0.4 : -0.4, gain: 0.16 });
  add(c, snip(), { pan: i % 2 ? -0.2 : 0.2, gain: 0.22 });
});
add(OUTRO - 1.8, whoosh(1.8), { gain: 0.3 }); // big riser into outro
add(OUTRO, snip(), { gain: 0.26 });

// --- sidechain pump on the duck bus ---
function pump(t) {
  if (t < DROP || t >= OUTRO) return 1;
  const p = ((t - DROP) % BEAT) / BEAT;
  return 0.35 + 0.65 * Math.min(1, p / 0.45) ** 1.5;
}

// --- Schroeder reverb ---
function reverb(x, off) {
  const combs = [1116, 1188, 1277, 1356].map((d) => ({ d: d + off, buf: new Float32Array(d + off), i: 0, lp: 0 }));
  const aps = [556, 441].map((d) => ({ d, buf: new Float32Array(d), i: 0 }));
  const out = new Float32Array(x.length);
  for (let n = 0; n < x.length; n++) {
    let s = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.lp = y * 0.7 + c.lp * 0.3;
      c.buf[c.i] = x[n] * 0.5 + c.lp * 0.84;
      c.i = (c.i + 1) % c.d;
      s += y;
    }
    for (const a of aps) {
      const y = a.buf[a.i];
      const v = s + y * 0.5;
      a.buf[a.i] = v;
      a.i = (a.i + 1) % a.d;
      s = y - v * 0.5;
    }
    out[n] = s;
  }
  return out;
}

const L = new Float32Array(N);
const R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const g = pump(i / SR);
  L[i] = bus.duck[0][i] * g + bus.dry[0][i];
  R[i] = bus.duck[1][i] * g + bus.dry[1][i];
}
const rl = reverb(L, 0);
const rr = reverb(R, 23);

let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.05) * Math.min(1, (DUR - t) / 2.2);
  L[i] = (L[i] + rl[i] * 0.18) * fade;
  R[i] = (R[i] + rr[i] * 0.18) * fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const gain = 0.9 / peak;
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.tanh(L[i] * gain * 1.1) * 32767 * 0.95), i * 4);
  data.writeInt16LE(Math.round(Math.tanh(R[i] * gain * 1.1) * 32767 * 0.95), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);
const file = path.resolve(import.meta.dirname, "../public/music.wav");
fs.writeFileSync(file, Buffer.concat([header, data]));
console.log(`wrote ${file} (${(data.length / 1e6).toFixed(1)} MB, gain ${gain.toFixed(2)})`);
