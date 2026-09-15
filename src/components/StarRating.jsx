import "./StarRating.css";

export default function StarRating({
  value = 0,
  onChange,
  label = "Rating",
  readOnly = false,
}) {
  const rounded = Math.round(value);

  return (
    <div className={`star-rating${readOnly ? " is-readonly" : ""}`} role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (onChange ? value : rounded);
        if (readOnly) {
          return (
            <span
              key={star}
              className={`material-symbols-outlined${filled ? " is-filled" : ""}`}
              aria-hidden="true"
            >
              star
            </span>
          );
        }
        return (
          <button
            key={star}
            type="button"
            className={filled ? "is-on" : ""}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            aria-pressed={value === star}
            onClick={() => onChange(star)}
          >
            <span className={`material-symbols-outlined${filled ? " is-filled" : ""}`}>star</span>
          </button>
        );
      })}
    </div>
  );
}
