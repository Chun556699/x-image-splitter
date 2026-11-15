// Renders a handful of frames to out/stills/ for visual checks: node scripts/stills.mjs 60 170 ...
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';

const root = path.resolve(import.meta.dirname, '..');
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts') });
const composition = await selectComposition({ serveUrl, id: 'Promo' });
for (const frame of frames) {
  const output = path.join(root, 'out/stills', `f${String(frame).padStart(3, '0')}.jpg`);
  await renderStill({ serveUrl, composition, frame, output, imageFormat: 'jpeg', scale: 0.5 });
  console.log(output);
}
