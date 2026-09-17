import { useCallback, useRef, useState } from "react";
import LandingPage from "./components/Landing/LandingPage.jsx";
import GameScreen from "./components/Game/GameScreen.jsx";
import SurvivalKitModal from "./components/SurvivalKit/SurvivalKitModal.jsx";
import TorchScreen from "./components/Torch/TorchScreen.jsx";
import PookieVibeScreen from "./components/PookieVibe/PookieVibeScreen.jsx";

const BLACKOUT_MS = 650;

export default function App() {
  const [view, setView] = useState("landing"); // "landing" | "game" | "torch" | "vibe"
  const [blackout, setBlackout] = useState(false);
  const [kitOpen, setKitOpen] = useState(false);
  const blackoutTimeout = useRef(null);

  const prefersReducedMotion = useCallback(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const goToGame = useCallback(() => {
    if (prefersReducedMotion()) {
      setView("game");
      return;
    }
    setBlackout(true);
    clearTimeout(blackoutTimeout.current);
    blackoutTimeout.current = setTimeout(() => {
      setView("game");
      setBlackout(false);
    }, BLACKOUT_MS);
  }, [prefersReducedMotion]);

  const goToLanding = useCallback(() => {
    setView("landing");
  }, []);

  return (
    <>
      {view === "landing" && (
        <LandingPage
          onStartGame={goToGame}
          onOpenKit={() => setKitOpen(true)}
          onOpenTorch={() => setView("torch")}
          onOpenVibe={() => setView("vibe")}
        />
      )}
      {view === "game" && <GameScreen onExit={goToLanding} />}
      {view === "torch" && <TorchScreen onClose={goToLanding} />}
      {view === "vibe" && <PookieVibeScreen onClose={goToLanding} />}

      <SurvivalKitModal visible={kitOpen} onClose={() => setKitOpen(false)} />

      <div className={"pc-blackout" + (blackout ? " pc-blackout--active" : "")} aria-hidden="true" />
    </>
  );
}
