import { useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Preloader } from './components/Preloader';
import { Closing, Footer } from './sections/Closing';
import { DestinationExplorer } from './sections/DestinationExplorer';
import { GuestInformation, RSVPSection } from './sections/GuestInformation';
import { HeroSection } from './sections/HeroSection';
import { InvitationSection } from './sections/InvitationSection';
import { LocalFoodGuide } from './sections/LocalFoodGuide';
import { SmartItinerary } from './sections/SmartItinerary';
import { StoryFilm } from './sections/StoryFilm';
import { TravelGuide } from './sections/TravelGuide';
import { WeddingTimeline } from './sections/WeddingTimeline';

export default function App() {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  return (
    <>
      <a className="skip-link" href="#celebrations">Skip to the celebrations</a>
      <Preloader skip={!!reduce} onDone={() => setReady(true)} />
      <Navigation />
      <HeroSection ready={ready} />
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
