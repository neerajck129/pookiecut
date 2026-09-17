import { useState } from "react";
import { powerCutOptions } from "../../data/powerCutContext.js";

export default function PowerCutQuestion() {
  const [selectedId, setSelectedId] = useState(null);
  const selected = powerCutOptions.find((o) => o.id === selectedId);

  return (
    <section className="pc-context">
      <div className="pc-context__badge">SATIRICAL TAKE · PUBLIC DEBATE</div>
      <h2 className="pc-context__heading">
        ⚡ OK... BUT WHY IS THE CURRENT GONE?
      </h2>
      <p className="pc-context__question">
        ഒരു ചോദ്യം: ഇപ്പോഴത്തെ power-cut പ്രതിസന്ധിക്ക് പ്രധാന കാരണം
        എന്താണെന്ന് നിങ്ങൾ കരുതുന്നു?
      </p>

      <div className="pc-context__options" role="group" aria-label="Pick a take">
        {powerCutOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={
              "pc-context__option" +
              (selectedId === opt.id ? " pc-context__option--active" : "")
            }
            onClick={() => setSelectedId(opt.id)}
            aria-pressed={selectedId === opt.id}
          >
            <span className="pc-context__option-icon" aria-hidden="true">
              {opt.icon}
            </span>
            {opt.label}
          </button>
        ))}
      </div>

      {selected && (
        <div className="pc-context__panel" key={selected.id}>
          <div className="pc-context__panel-head">
            <span className="pc-context__pick">YOUR PICK</span>
            <span className="pc-context__panel-title">
              {selected.icon} {selected.label}
            </span>
            <span className="pc-context__tag">{selected.tag}</span>
          </div>
          <div className="pc-context__panel-body">
            {selected.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
