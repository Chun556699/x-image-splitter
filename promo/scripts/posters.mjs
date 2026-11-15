// Renders all poster stills to out/posters/: node scripts/posters.mjs
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const root = path.resolve(import.meta.dirname, "..");
const ids = process.argv.slice(2);
const all = ["PosterHeroEN", "PosterHeroZH", "PosterHeroSqEN", "PosterHeroSqZH", "PosterTimelineEN", "PosterTimelineZH", "PosterFeaturesEN", "PosterFeaturesZH"];
const targets = ids.length ? ids : all;
const names = {
  PosterHeroEN: "hero-en.png",
  PosterHeroZH: "hero-zh.png",
  PosterHeroSqEN: "hero-sq-en.png",
  PosterHeroSqZH: "hero-sq-zh.png",
  PosterTimelineEN: "timeline-en.png",
  PosterTimelineZH: "timeline-zh.png",
  PosterFeaturesEN: "features-en.png",
  PosterFeaturesZH: "features-zh.png",
};

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
for (const id of targets) {
  const composition = await selectComposition({ serveUrl, id });
  const output = path.join(root, "out/posters", names[id]);
  await renderStill({ serveUrl, composition, output });
  console.log(output);
}
