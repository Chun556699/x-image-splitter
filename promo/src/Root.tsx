import { Composition, Still } from "remotion";
import { Promo } from "./Promo";
import { PosterFeatures, PosterHero, PosterTimeline } from "./posters";
import { DURATION, FPS } from "./theme";

const HeroEN = () => <PosterHero lang="en" />;
const HeroZH = () => <PosterHero lang="zh" />;
const HeroSqEN = () => <PosterHero lang="en" square />;
const HeroSqZH = () => <PosterHero lang="zh" square />;
const TimelineEN = () => <PosterTimeline lang="en" />;
const TimelineZH = () => <PosterTimeline lang="zh" />;
const FeaturesEN = () => <PosterFeatures lang="en" />;
const FeaturesZH = () => <PosterFeatures lang="zh" />;

export function Root() {
  return (
    <>
      <Composition id="Promo" component={Promo} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
      <Still id="PosterHeroEN" component={HeroEN} width={1920} height={1080} />
      <Still id="PosterHeroZH" component={HeroZH} width={1920} height={1080} />
      <Still id="PosterHeroSqEN" component={HeroSqEN} width={1200} height={1200} />
      <Still id="PosterHeroSqZH" component={HeroSqZH} width={1200} height={1200} />
      <Still id="PosterTimelineEN" component={TimelineEN} width={1920} height={1080} />
      <Still id="PosterTimelineZH" component={TimelineZH} width={1920} height={1080} />
      <Still id="PosterFeaturesEN" component={FeaturesEN} width={1920} height={1080} />
      <Still id="PosterFeaturesZH" component={FeaturesZH} width={1920} height={1080} />
    </>
  );
}
