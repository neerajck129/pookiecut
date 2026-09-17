import { useEffect, useState } from "react";
import { survivalKit } from "../../data/survivalKit.js";
import SurvivalItem from "./SurvivalItem.jsx";

const STORAGE_KEY = "pookieCut_survivalChecklist";

function loadChecklist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveChecklist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — checklist just won't persist
  }
}

export default function SurvivalKitModal({ visible, onClose }) {
  const [checked, setChecked] = useState(loadChecklist);

  useEffect(() => {
    if (visible) setChecked(loadChecklist());
  }, [visible]);

  if (!visible) return null;

  const readyCount = survivalKit.filter((item) => checked[item.id]).length;
  const total = survivalKit.length;
  const fullyPrepared = readyCount === total;

  const toggle = (id) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveChecklist(next);
      return next;
    });
  };

  const reset = () => {
    setChecked({});
    saveChecklist({});
  };

  return (
    <div className="pc-modal" role="dialog" aria-modal="true" aria-labelledby="pc-kit-title">
      <div className="pc-modal__sheet pc-modal__sheet--kit">
        <div className="pc-modal__header">
          <button type="button" className="pc-modal__close" onClick={onClose} aria-label="Close checklist">
            ×
          </button>
          <span className="pc-modal__eyebrow" id="pc-kit-title">🕯️ SURVIVAL KIT</span>
          <h2 className="pc-modal__heading">POWER-CUT SURVIVAL</h2>

          <div className="pc-kitprogress">
            <span className="pc-kitprogress__label">
              {readyCount} / {total} READY
            </span>
            <div className="pc-kitprogress__bar">
              <div
                className="pc-kitprogress__fill"
                style={{ width: `${(readyCount / total) * 100}%` }}
              />
            </div>
          </div>

          {fullyPrepared && (
            <div className="pc-kitprogress__done">
              ⚡ FULLY PREPARED
              <br />
              <span>Current വരാത്തത് മാത്രം നമ്മുടെ control-ൽ അല്ല. 😌</span>
            </div>
          )}
        </div>

        <div className="pc-kitlist">
          {survivalKit.map((item) => (
            <SurvivalItem
              key={item.id}
              item={item}
              checked={!!checked[item.id]}
              onToggle={toggle}
            />
          ))}
        </div>

        <button type="button" className="pc-modal__reset" onClick={reset}>
          RESET CHECKLIST
        </button>
      </div>
    </div>
  );
}
