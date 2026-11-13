import { useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Preloader } from './components/Preloader';
import { useFrameSequence } from './hooks/useFrameSequence';
import { Closing, Footer } from './sections/Closing';
import { GuestInformation, RSVPSection } from './sections/GuestInformation';
import { HeroFilm } from './sections/HeroFilm';
import { LocalFoodGuide } from './sections/LocalFoodGuide';
import { PlacesMap } from './sections/PlacesMap';
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
        <WeddingTimeline />
        <PlacesMap />
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
