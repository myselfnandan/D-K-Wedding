import { useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Preloader } from './components/Preloader';
import { useFrameSequence } from './hooks/useFrameSequence';
import { Closing, Footer } from './sections/Closing';
import { DestinationExplorer } from './sections/DestinationExplorer';
import { GuestInformation, RSVPSection } from './sections/GuestInformation';
import { HeroFilm } from './sections/HeroFilm';
import { InvitationSection } from './sections/InvitationSection';
import { LocalFoodGuide } from './sections/LocalFoodGuide';
import { SmartItinerary } from './sections/SmartItinerary';
import { StoryFilm } from './sections/StoryFilm';
import { TravelGuide } from './sections/TravelGuide';
import { WeddingTimeline } from './sections/WeddingTimeline';

export default function App() {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  // No frame requests at all under reduced motion: the static hero uses the poster only.
  const { store, keyProgress } = useFrameSequence(!reduce);
  return (
    <>
      <a className="skip-link" href="#celebrations">Skip to the celebrations</a>
      <Preloader skip={!!reduce} progress={keyProgress} onDone={() => setReady(true)} />
      <Navigation />
      <HeroFilm ready={ready} store={store} />
      <main>
        <InvitationSection />
        <StoryFilm />
        <WeddingTimeline />
        <SmartItinerary />
        <DestinationExplorer />
        <LocalFoodGuide />
        <TravelGuide />
        <GuestInformation />
        <RSVPSection />
        <Closing />
      </main>
      <Footer />
    </>
  );
}
