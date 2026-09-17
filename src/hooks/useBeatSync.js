import { useEffect, useRef } from "react";

/**
 * Analyses the audio playing in `audioRef` in real time and calls
 * `onFrame({ bass, mid, energy, beat })` on every animation frame while
 * playing. Values are 0..1. `beat` is true only on the frame a bass hit
 * is detected (debounced so it can't fire faster than ~110ms apart).
 *
 * Uses refs/rAF only — no React state — so the flicker can run at a
 * smooth frame rate without re-rendering the component every tick.
 */
export function useBeatSync(audioRef, onFrame, isPlaying) {
  const graphRef = useRef(null); // { ctx, analyser, data }
  const rafRef = useRef(null);
  const avgRef = useRef(0);
  const lastBeatRef = useRef(0);
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const audioEl = audioRef.current;
    if (!audioEl) return undefined;

    // Build the audio graph once per <audio> element (a MediaElementSource
    // can only be created a single time for a given element).
    if (!graphRef.current) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        const source = ctx.createMediaElementSource(audioEl);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.55;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        graphRef.current = { ctx, analyser, data: new Uint8Array(analyser.frequencyBinCount) };
      } catch {
        graphRef.current = null;
      }
    }

    const graph = graphRef.current;
    if (!graph) return undefined;

    if (graph.ctx.state === "suspended") graph.ctx.resume();

    const bassBins = Math.max(2, Math.round(graph.data.length * 0.12));
    const midStart = bassBins;
    const midEnd = Math.round(graph.data.length * 0.5);

    const tick = () => {
      const { analyser, data } = graph;
      analyser.getByteFrequencyData(data);

      let bassSum = 0;
      for (let i = 0; i < bassBins; i++) bassSum += data[i];
      const bass = bassSum / bassBins / 255;

      let midSum = 0;
      for (let i = midStart; i < midEnd; i++) midSum += data[i];
      const mid = midSum / (midEnd - midStart) / 255;

      let total = 0;
      for (let i = 0; i < data.length; i++) total += data[i];
      const energy = total / data.length / 255;

      // Lightweight rolling-average beat detector: a hit is a bass spike
      // meaningfully above its own recent average, rate-limited so lights
      // never strobe faster than is comfortable to look at.
      avgRef.current = avgRef.current * 0.92 + bass * 0.08;
      const now = performance.now();
      const beat =
        bass > 0.28 &&
        bass > avgRef.current * 1.18 &&
        now - lastBeatRef.current > 110;
      if (beat) lastBeatRef.current = now;

      onFrameRef.current({ bass, mid, energy, beat });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, audioRef]);

  // Fully tear down the audio graph when the component using this hook unmounts.
  useEffect(() => {
    return () => {
      const graph = graphRef.current;
      if (graph) {
        try {
          graph.analyser.disconnect();
          graph.ctx.close();
        } catch {
          // already closed
        }
      }
    };
  }, []);
}
