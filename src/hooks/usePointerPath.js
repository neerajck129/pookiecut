import { useCallback, useRef, useState } from "react";
import { evaluateMove } from "../game/validator.js";

/**
 * Handles converting raw pointer events on the SVG board into logical
 * row/col moves, validated against the board's rules. Never trusts raw
 * screen pixels as truth — every pointer position is converted to a
 * board-relative fraction, then to a cell index, before anything else
 * happens.
 */
export function usePointerPath(board) {
  const [path, setPath] = useState([]); // array of [row, col]
  const [isDrawing, setIsDrawing] = useState(false);
  const [rejectFlash, setRejectFlash] = useState(null); // {row,col,key} transient
  const svgRef = useRef(null);
  const lastCellRef = useRef(null); // avoid re-processing the same cell repeatedly
  const flashTimeoutRef = useRef(null);

  const size = board.size;

  // Convert a client (screen) pointer position into a logical {row, col}.
  const pointToCell = useCallback(
    (clientX, clientY) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const fracX = (clientX - rect.left) / rect.width;
      const fracY = (clientY - rect.top) / rect.height;
      if (fracX < 0 || fracX > 1 || fracY < 0 || fracY > 1) return null;
      const col = Math.floor(fracX * size);
      const row = Math.floor(fracY * size);
      if (row < 0 || row >= size || col < 0 || col >= size) return null;
      return { row, col };
    },
    [size]
  );

  const flashReject = useCallback((row, col) => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    const key = `${row},${col}-${Date.now()}`;
    setRejectFlash({ row, col, key });
    flashTimeoutRef.current = setTimeout(() => setRejectFlash(null), 220);
    // Short haptic tick on mobile so an invalid move is felt, not just seen
    // — useful when a thumb is covering the exact cell that just rejected.
    navigator.vibrate?.(12);
  }, []);

  const reset = useCallback(() => {
    setPath([]);
    setIsDrawing(false);
    lastCellRef.current = null;
  }, []);

  // Step back exactly one cell (undo), without discarding the whole path.
  // This is the single-tap "oops" correction — much cheaper on mobile than
  // a full RESET when you're 20 cells into a board and misjudge one turn.
  const undoLastStep = useCallback(() => {
    setIsDrawing(false);
    lastCellRef.current = null;
    setPath((currentPath) =>
      currentPath.length === 0 ? currentPath : currentPath.slice(0, -1)
    );
  }, []);

  const tryStepTo = useCallback(
    (cell, currentPath) => {
      if (!cell) return currentPath;
      const key = `${cell.row},${cell.col}`;
      if (lastCellRef.current === key) return currentPath; // no-op, same cell as last processed

      const outcome = evaluateMove(board, currentPath, cell);
      lastCellRef.current = key;

      if (outcome === "advance") {
        return [...currentPath, [cell.row, cell.col]];
      }
      if (outcome === "backtrack") {
        return currentPath.slice(0, -1);
      }
      // Any "invalid-*" outcome (wall, not-adjacent, visited,
      // checkpoint-order, not-start): reject with visual feedback, path
      // unchanged.
      flashReject(cell.row, cell.col);
      return currentPath;
    },
    [board, flashReject]
  );

  // Walk every intermediate cell between the last known pointer cell and the
  // new one (fast finger movement can skip several cells in one event) so
  // moves aren't silently lost, while every step is still individually
  // validated by evaluateMove.
  const stepThroughLine = useCallback(
    (fromCell, toCell, currentPath) => {
      if (!fromCell || !toCell) return tryStepTo(toCell, currentPath);
      let working = currentPath;
      let cur = { ...fromCell };
      // Bounded walk (grid is small) - move one axis-step at a time toward target.
      let guard = 0;
      while ((cur.row !== toCell.row || cur.col !== toCell.col) && guard < 64) {
        guard++;
        if (cur.row !== toCell.row) {
          cur = { ...cur, row: cur.row + Math.sign(toCell.row - cur.row) };
        } else if (cur.col !== toCell.col) {
          cur = { ...cur, col: cur.col + Math.sign(toCell.col - cur.col) };
        }
        working = tryStepTo(cur, working);
      }
      return working;
    },
    [tryStepTo]
  );

  const handlePointerDown = useCallback(
    (e) => {
      const cell = pointToCell(e.clientX, e.clientY);
      if (!cell) return;

      // Resuming: if the finger lifted mid-path and comes back down on the
      // cell the path currently ends at, continue from there instead of
      // forcing a full restart from KSEB.
      if (path.length > 0) {
        const [lastRow, lastCol] = path[path.length - 1];
        if (cell.row === lastRow && cell.col === lastCol) {
          lastCellRef.current = `${cell.row},${cell.col}`;
          setIsDrawing(true);
          e.target.setPointerCapture?.(e.pointerId);
          return;
        }
      }

      const start = board.checkpoints.find((cp) => cp.number === 1);
      const isStart = start && cell.row === start.row && cell.col === start.col;
      if (!isStart) {
        flashReject(cell.row, cell.col);
        return;
      }
      lastCellRef.current = null;
      setIsDrawing(true);
      setPath([[cell.row, cell.col]]);
      lastCellRef.current = `${cell.row},${cell.col}`;
      e.target.setPointerCapture?.(e.pointerId);
    },
    [board, pointToCell, flashReject, path]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDrawing) return;
      const cell = pointToCell(e.clientX, e.clientY);
      if (!cell) return;
      const prevKey = lastCellRef.current;
      const prevCell = prevKey
        ? { row: Number(prevKey.split(",")[0]), col: Number(prevKey.split(",")[1]) }
        : null;
      setPath((currentPath) => stepThroughLine(prevCell, cell, currentPath));
    },
    [isDrawing, pointToCell, stepThroughLine]
  );

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  return {
    svgRef,
    path,
    setPath,
    isDrawing,
    rejectFlash,
    reset,
    undoLastStep,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
