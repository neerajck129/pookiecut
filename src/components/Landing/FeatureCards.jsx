import GameZoneCard from "./GameZoneCard.jsx";
import SurvivalKitCard from "./SurvivalKitCard.jsx";

export default function FeatureCards({ onStartGame, onOpenKit }) {
  return (
    <section id="pc-cards" className="pc-cards">
      <GameZoneCard onStart={onStartGame} />
      <SurvivalKitCard onOpen={onOpenKit} />
    </section>
  );
}
