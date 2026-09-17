import { useState } from "react";

export default function TorchScreen({ onClose }) {
  const [mode, setMode] = useState("warm"); // "warm" | "cool"

  return (
    <div className={"pc-torch pc-torch--" + mode} role="dialog" aria-modal="true" aria-label="Torch">
      <button type="button" className="pc-torch__back" onClick={onClose} aria-label="Back to home">
        ← BACK
      </button>

      <div className="pc-torch__top">🔦 TORCH</div>

      <div className="pc-torch__panel">
        <div className="pc-torch__panel-title">TORCH</div>
        <div className="pc-torch__panel-sub">Choose your light</div>

        <div className="pc-torch__options" role="group" aria-label="Light color">
          <button
            type="button"
            className={"pc-torch__option" + (mode === "warm" ? " pc-torch__option--active" : "")}
            onClick={() => setMode("warm")}
            aria-pressed={mode === "warm"}
          >
            <span className="pc-torch__dot pc-torch__dot--warm" aria-hidden="true" />
            WARM
          </button>
          <button
            type="button"
            className={"pc-torch__option" + (mode === "cool" ? " pc-torch__option--active" : "")}
            onClick={() => setMode("cool")}
            aria-pressed={mode === "cool"}
          >
            <span className="pc-torch__dot pc-torch__dot--cool" aria-hidden="true" />
            COOL
          </button>
        </div>
      </div>
    </div>
  );
}
