import { AbsoluteFill, Html5Audio, staticFile } from "remotion";
import { CUTS, DURATION } from "./theme";
import { Scene } from "./ui";
import { Hook, Idea, Outro, ProductScene, SliceScene, StitchScene, TimelineScene } from "./scenes";

const SCENES = [Hook, Idea, SliceScene, TimelineScene, StitchScene, ProductScene, Outro];

export function Promo() {
  const bounds = [0, ...CUTS, DURATION];
  return (
    <AbsoluteFill style={{ background: "#fafaf7" }}>
      {SCENES.map((S, i) => (
        <Scene key={i} from={bounds[i]} to={bounds[i + 1]} first={i === 0} last={i === SCENES.length - 1}>
          <S />
        </Scene>
      ))}
      <Html5Audio src={staticFile("music.wav")} />
    </AbsoluteFill>
  );
}
