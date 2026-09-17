export default function SurvivalKitCard({ onOpen }) {
  return (
    <div className="pc-card pc-card--kit">
      <div className="pc-card__eyebrow">🕯️ SURVIVAL KIT</div>
      <h3 className="pc-card__title">Current പോയാൽ<br />ready ആണോ?</h3>
      <p className="pc-card__desc">
        Power-cut survival checklist. നിങ്ങൾ എത്ര prepared ആണെന്ന് നോക്കാം.
      </p>
      <button type="button" className="pc-card__cta" onClick={onOpen}>
        CHECKLIST →
      </button>
    </div>
  );
}
