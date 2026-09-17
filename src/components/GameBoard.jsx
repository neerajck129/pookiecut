import { useEffect, useRef } from "react";
import Grid from "./Grid.jsx";
import Wall from "./Wall.jsx";
import PowerPath from "./PowerPath.jsx";
import House from "./House.jsx";
import KsebSource from "./KsebSource.jsx";
import { usePointerPath } from "../hooks/usePointerPath.js";
import { reachedCheckpointNumbers } from "../game/validator.js";
import { getCellSize, BOARD_UNITS } from "../game/geometry.js";

export default function GameBoard({ board, resetToken, undoToken, locked, onPathChange, isComplete }) {
  const {
    svgRef,
    path,
    rejectFlash,
    reset,
    undoLastStep,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = usePointerPath(board);

  const lastResetToken = useRef(resetToken);
  useEffect(() => {
    if (resetToken !== lastResetToken.current) {
      lastResetToken.current = resetToken;
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  const lastUndoToken = useRef(undoToken);
  useEffect(() => {
    if (undoToken !== lastUndoToken.current) {
      lastUndoToken.current = undoToken;
      undoLastStep();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoToken]);

  useEffect(() => {
    onPathChange?.(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const cellSize = getCellSize(board.size);
  const visitedSet = new Set(path.map(([r, c]) => `${r},${c}`));
  const reachedNumbers = new Set(reachedCheckpointNumbers(board, path));

  const ksebCheckpoint = board.checkpoints.find((cp) => cp.number === 1);
  const houseCheckpoints = board.checkpoints.filter((cp) => cp.number !== 1);

  return (
    <div className={"kc-board" + (locked ? " kc-board--locked" : "")}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${BOARD_UNITS} ${BOARD_UNITS}`}
        className="kc-board__svg"
        onPointerDown={locked ? undefined : handlePointerDown}
        onPointerMove={locked ? undefined : handlePointerMove}
        onPointerUp={locked ? undefined : handlePointerUp}
        onPointerCancel={locked ? undefined : handlePointerUp}
        onPointerLeave={locked ? undefined : handlePointerUp}
      >
        <Grid size={board.size} cellSize={cellSize} visitedSet={visitedSet} rejectFlash={rejectFlash} />
        <Wall walls={board.walls} cellSize={cellSize} />
        <PowerPath path={path} cellSize={cellSize} isComplete={isComplete} />
        {houseCheckpoints.map((cp) => (
          <House
            key={`h-${cp.number}`}
            row={cp.row}
            col={cp.col}
            cellSize={cellSize}
            number={cp.number}
            isPowered={reachedNumbers.has(cp.number)}
          />
        ))}
        {ksebCheckpoint && (
          <KsebSource row={ksebCheckpoint.row} col={ksebCheckpoint.col} cellSize={cellSize} />
        )}
      </svg>
    </div>
  );
}
