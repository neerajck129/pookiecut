const RULES = [
  { icon: "⚡", text: "⚡-ൽ നിന്ന് തുടങ്ങുക" },
  { icon: "🏠", text: "നമ്പർ ക്രമത്തിൽ വീടുകളിലേക്ക് കറന്റ് എത്തിക്കുക" },
  { icon: "⬜", text: "എല്ലാ square-ലൂടെയും പോകണം" },
  { icon: "🚫", text: "ഒരു square രണ്ടുതവണ ഉപയോഗിക്കരുത്" },
  { icon: "↔️", text: "UP / DOWN / LEFT / RIGHT മാത്രം" },
  { icon: "🚫", text: "Diagonal ഇല്ല" },
  { icon: "🚫", text: "Line cross ചെയ്യരുത്" },
  { icon: "🏠", text: "അവസാനം അവസാനത്തെ numbered വീട്ടിൽ തന്നെ എത്തണം" },
];

export default function GameIntroModal({ visible, onClose }) {
  if (!visible) return null;

  return (
    <div className="pc-modal" role="dialog" aria-modal="true" aria-labelledby="pc-intro-title">
      <div className="pc-modal__sheet pc-modal__sheet--intro">
        <div className="pc-modal__header">
          <span className="pc-modal__eyebrow" id="pc-intro-title">⚡ POOKIE PUZZLE</span>
          <h2 className="pc-modal__heading">എങ്ങനെ കളിക്കാം?</h2>
        </div>

        <ul className="pc-rules">
          {RULES.map((rule, i) => (
            <li key={i} className="pc-rules__item">
              <span className="pc-rules__icon" aria-hidden="true">{rule.icon}</span>
              <span>{rule.text}</span>
            </li>
          ))}
        </ul>

        <button type="button" className="pc-modal__cta" onClick={onClose}>
          OK, START ⚡
        </button>
      </div>
    </div>
  );
}
