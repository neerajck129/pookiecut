import { useCallback, useEffect, useRef, useState } from "react";
import { useBeatSync } from "../../hooks/useBeatSync.js";
import { siteConfig } from "../../config/siteConfig.js";

// DJ light palette. Each beat advances to the next colour so the strobe
// reads as a lighting rig rather than a single colour pulsing.
const PALETTE = [
  "255, 60, 160", // magenta
  "70, 200, 255", // cyan
  "255, 176, 42", // amber
  "130, 90, 255", // violet
  "80, 255, 150", // green
];

export default function PookieVibeScreen({ onClose }) {
  const audioRef = useRef(null);
  const flashRef = useRef(null);
  const lightRefs = useRef([]);
  const colorIndexRef = useRef(0);
  const flashOpacityRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  const handleFrame = useCallback(({ bass, mid, energy, beat }) => {
    if (beat) {
      colorIndexRef.current = (colorIndexRef.current + 1) % PALETTE.length;
      flashOpacityRef.current = Math.min(0.4, 0.16 + bass * 0.3);
    } else {
      // Exponential decay so the flash always fades smoothly between hits,
      // even during a run of fast beats.
      flashOpacityRef.current *= 0.86;
    }

    const color = PALETTE[colorIndexRef.current];
    if (flashRef.current) {
      flashRef.current.style.opacity = flashOpacityRef.current.toFixed(3);
      flashRef.current.style.background = `rgb(${color})`;
    }

    lightRefs.current.forEach((el, i) => {
      if (!el) return;
      const nextColor = PALETTE[(colorIndexRef.current + i) % PALETTE.length];
      const drive = i % 2 === 0 ? mid : energy;
      const scale = 0.85 + drive * 0.9 + (beat ? 0.18 : 0);
      el.style.opacity = (0.35 + drive * 0.65).toFixed(3);
      el.style.transform = `scale(${scale.toFixed(3)})`;
      el.style.background = `radial-gradient(circle, rgba(${nextColor}, 0.9), rgba(${nextColor}, 0) 70%)`;
    });
  }, []);

  useBeatSync(audioRef, handleFrame, playing);

  const startParty = () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl.currentTime = 0;
    audioEl
      .play()
      .then(() => {
        setStarted(true);
        setPlaying(true);
      })
      .catch(() => {
        // Autoplay blocked or file missing — leave the tap-to-start screen up.
      });
  };

  const togglePlay = () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (playing) {
      audioEl.pause();
      setPlaying(false);
    } else {
      audioEl.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  useEffect(() => {
    const audioEl = audioRef.current;
    return () => {
      audioEl?.pause();
    };
  }, []);

  return (
    <div className="pc-vibe" role="dialog" aria-modal="true" aria-label="Pookie Vibe">
      <audio ref={audioRef} src={siteConfig.vibeTrackUrl} loop preload="auto" />

      <div className="pc-vibe__lights" aria-hidden="true">
        <div className="pc-vibe__light pc-vibe__light--1" ref={(el) => (lightRefs.current[0] = el)} />
        <div className="pc-vibe__light pc-vibe__light--2" ref={(el) => (lightRefs.current[1] = el)} />
        <div className="pc-vibe__light pc-vibe__light--3" ref={(el) => (lightRefs.current[2] = el)} />
      </div>
      <div className="pc-vibe__flash" ref={flashRef} aria-hidden="true" />

      <button type="button" className="pc-vibe__back" onClick={onClose} aria-label="Back to home">
        ×
      </button>
      <div className="pc-vibe__top">🪩 POOKIE VIBE</div>

      {!started && (
        <div className="pc-vibe__gate">
          <p className="pc-vibe__gate-text">
            Current പോയാൽ
            <br />
            party തുടങ്ങാം. 😌
          </p>
          <button type="button" className="pc-vibe__start" onClick={startParty}>
            ▶ DROP THE BEAT
          </button>
        </div>
      )}

      {started && (
        <div className="pc-vibe__controls">
          <button type="button" className="pc-vibe__toggle" onClick={togglePlay}>
            {playing ? "⏸ PAUSE" : "▶ PLAY"}
          </button>
          <span className="pc-vibe__hint">DJ lights are synced to the beat 🔊</span>
        </div>
      )}
    </div>
  );
}
