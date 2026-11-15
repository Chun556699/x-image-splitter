import "@fontsource-variable/inter";
import { continueRender, delayRender, registerRoot } from "remotion";
import { Root } from "./Root";

const fonts = delayRender("Loading fonts");
Promise.all([
  ...[500, 600, 700, 800, 900].map((w) => document.fonts.load(`${w} 40px "Inter Variable"`)),
  document.fonts.load(`700 40px "Microsoft YaHei"`),
])
  .catch(() => undefined)
  .then(() => continueRender(fonts));

registerRoot(Root);
