import Hero from "./Hero.jsx";
import FeatureCards from "./FeatureCards.jsx";
import SecondaryFeatures from "./SecondaryFeatures.jsx";
import BloodDonation from "./BloodDonation.jsx";
import { siteConfig } from "../../config/siteConfig.js";

export default function LandingPage({ onStartGame, onOpenKit, onOpenTorch, onOpenVibe }) {
  return (
    <div className="pc-landing">
      <div className="pc-topbar" aria-hidden="false">
        <span className="pc-topbar__bolt">{siteConfig.bolt}</span>
        <span className="pc-topbar__title">{siteConfig.title}</span>
      </div>

      <Hero />
      <FeatureCards onStartGame={onStartGame} onOpenKit={onOpenKit} />
      <SecondaryFeatures onOpenTorch={onOpenTorch} onOpenVibe={onOpenVibe} />
      <BloodDonation />

      <footer className="pc-footer">{siteConfig.presenter}</footer>
    </div>
  );
}
