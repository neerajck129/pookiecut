export default function SurvivalItem({ item, checked, onToggle }) {
  return (
    <button
      type="button"
      className={"pc-kititem" + (checked ? " pc-kititem--checked" : "")}
      onClick={() => onToggle(item.id)}
      aria-pressed={checked}
    >
      <span className="pc-kititem__box" aria-hidden="true">
        {checked ? "✓" : ""}
      </span>
      <span className="pc-kititem__icon" aria-hidden="true">{item.icon}</span>
      <span className="pc-kititem__text">
        <span className="pc-kititem__title">{item.title}</span>
        <span className="pc-kititem__desc">{item.description}</span>
      </span>
    </button>
  );
}
