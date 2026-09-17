import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameBoard from "../GameBoard.jsx";
import LevelHeader from "../LevelHeader.jsx";
import LevelComplete from "../LevelComplete.jsx";
import VillageBackground from "../VillageBackground.jsx";
import GameIntroModal from "./GameIntroModal.jsx";
import { LEVELS } from "../../levels/levels.js";
import { isLevelComplete, reachedCheckpointNumbers } from "../../game/validator.js";

const SUCCESS_HOLD_MS = 1600;
const PROGRESS_KEY = "pookieCut_levelProgress";

function loadStoredLevelIndex() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function storeLevelIndex(index) {
  try {
    localStorage.setItem(PROGRESS_KEY, String(index));
  } catch {
    // localStorage unavailable — progress just won't persist
  }
}

export default function GameScreen({ onExit }) {
  const [showIntro, setShowIntro] = useState(true);
  const [levelIndex, setLevelIndex] = useState(loadStoredLevelIndex);
  const [path, setPath] = useState([]);
  const [resetToken, setResetToken] = useState(0);
  const [undoToken, setUndoToken] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  const level = LEVELS[levelIndex % LEVELS.length];
  const levelNumber = levelIndex + 1;

  const isComplete = useMemo(() => isLevelComplete(level, path), [level, path]);

  const reachedNumbers = useMemo(
    () => new Set(reachedCheckpointNumbers(level, path)),
    [level, path]
  );
  const houseCount = level.checkpoints.length - 1; // exclude KSEB (checkpoint 1)
  const poweredHouseCount = Math.max(0, reachedNumbers.size - (reachedNumbers.has(1) ? 1 : 0));
  const brightness = houseCount > 0 ? poweredHouseCount / houseCount : 0;

  const advanceTimeout = useRef(null);
  const advanceToNextLevel = useCallback(() => {
    clearTimeout(advanceTimeout.current);
    setShowComplete(false);
    setPath([]);
    setResetToken((t) => t + 1);
    setLevelIndex((i) => {
      const next = i + 1;
      storeLevelIndex(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isComplete) return;
    navigator.vibrate?.([12, 40, 12, 40, 24]);
    setShowComplete(true);
    advanceTimeout.current = setTimeout(advanceToNextLevel, SUCCESS_HOLD_MS);
    return () => clearTimeout(advanceTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const handleReset = useCallback(() => {
    setPath([]);
    setResetToken((t) => t + 1);
  }, []);

  const handleUndo = useCallback(() => {
    setUndoToken((t) => t + 1);
  }, []);

  const handlePathChange = useCallback((p) => setPath(p), []);

  const moves = Math.max(0, path.length - 1);
  const hasProgress = path.length > 0;

  return (
    <div className="kc-app">
      <VillageBackground brightness={brightness} />

      <div className="kc-layout">
        <button type="button" className="pc-exit" onClick={onExit} aria-label="Back to home">
          ← BACK
        </button>

        <LevelHeader
          levelNumber={levelNumber}
          moves={moves}
          poweredHouseCount={poweredHouseCount}
          houseCount={houseCount}
        />

        <main className="kc-main">
          <GameBoard
            board={level}
            resetToken={resetToken}
            undoToken={undoToken}
            locked={showComplete || showIntro}
            onPathChange={handlePathChange}
            isComplete={isComplete}
          />

          <div className="kc-controls">
            <button
              type="button"
              className="kc-control kc-control--undo"
              onClick={handleUndo}
              disabled={!hasProgress}
              aria-label="Undo last step"
            >
              <span className="kc-control__icon" aria-hidden="true">↶</span>
              UNDO
            </button>
            <button
              type="button"
              className="kc-control kc-control--reset"
              onClick={handleReset}
              disabled={!hasProgress}
              aria-label="Reset level"
            >
              <span className="kc-control__icon" aria-hidden="true">↺</span>
              RESET
            </button>
          </div>
        </main>
      </div>

      <LevelComplete visible={showComplete} nextLevelNumber={levelNumber + 1} onSkip={advanceToNextLevel} />

      <GameIntroModal visible={showIntro} onClose={() => setShowIntro(false)} />
    </div>
  );
}
