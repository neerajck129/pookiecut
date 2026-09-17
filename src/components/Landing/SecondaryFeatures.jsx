export default function SecondaryFeatures({ onOpenTorch, onOpenVibe }) {
  return (
    <section className="pc-secondary" aria-label="More experiences">
      <div className="pc-secondary__card pc-secondary__card--torch">
        <div className="pc-secondary__eyebrow">🔦 TORCH</div>
        <p className="pc-secondary__desc">
          ഇരുട്ടിനെ കുറച്ചെങ്കിലും
          <br />
          വെളിച്ചമാക്കാം.
        </p>
        <button type="button" className="pc-secondary__cta" onClick={onOpenTorch}>
          OPEN TORCH →
        </button>
      </div>

      <div className="pc-secondary__card pc-secondary__card--vibe">
        <div className="pc-secondary__eyebrow">🪩 POOKIE VIBE</div>
        <p className="pc-secondary__desc">
          Current പോയാൽ
          <br />
          party തുടങ്ങാം. 😌
        </p>
        <button type="button" className="pc-secondary__cta" onClick={onOpenVibe}>
          ENTER VIBE →
        </button>
      </div>
    </section>
  );
}
