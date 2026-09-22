import { accessibilityFor } from "../data/accessibility.js";
import { averageRating } from "../lib/storage.js";
import AccessFacts from "./AccessFacts.jsx";
import ReviewForm from "./ReviewForm.jsx";
import StarRating from "./StarRating.jsx";
import "./PlaceDetails.css";

function averageField(reviews, key) {
  const values = reviews.map((review) => review[key]).filter((value) => typeof value === "number" && value >= 1);
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default function PlaceDetails({
  selection,
  reviews,
  user,
  onClose,
  onAddReview,
  onAddLocation,
  onNeedAuth,
  onGuest,
  onDeleteReview,
}) {
  if (!selection) return null;

  const isProspect = selection.kind === "prospect";
  const place = selection.place;
  const avg = averageRating(reviews);
  const walkAvg = averageField(reviews, "walking");
  const chairAvg = averageField(reviews, "wheelchair");
  const access = accessibilityFor(place);

  return (
    <section className="place-sheet" aria-labelledby="place-sheet-title">
      <header className="place-sheet-head">
        <button className="md-text-btn sheet-close" type="button" onClick={onClose} aria-label="Close access notes">
          <span className="material-symbols-outlined">close</span>
        </button>
        <p className="sheet-kicker">{place.category}</p>
        <h2 id="place-sheet-title">{place.name}</h2>
        {place.description ? <p className="sheet-lede">{place.description}</p> : null}
        <div className="sheet-score">
          <StarRating value={avg} readOnly label="Average access rating" />
          <span>
            {reviews.length === 0
              ? "No access notes yet"
              : `${avg.toFixed(1)} · ${reviews.length} note${reviews.length === 1 ? "" : "s"}`}
          </span>
        </div>
        {reviews.length > 0 && (walkAvg || chairAvg) ? (
          <p className="sheet-access-avgs">
            Walking {walkAvg ? walkAvg.toFixed(1) : "—"} · Wheelchair {chairAvg ? chairAvg.toFixed(1) : "—"}
          </p>
        ) : null}
      </header>

      {isProspect ? (
        <div className="empty-card">
          <span className="material-symbols-outlined">add_location_alt</span>
          <h3>Not on the map yet</h3>
          <p>Save this landmark, then share walking, wheelchair, and ramp notes.</p>
          <button
            className="md-filled-btn"
            type="button"
            onClick={() => (user ? onAddLocation(place) : onNeedAuth())}
          >
            {user ? "Add this landmark" : "Log in to add this landmark"}
          </button>
        </div>
      ) : (
        <>
          <AccessFacts place={place} />
          {reviews.length === 0 ? (
            <div className="empty-card">
              <span className="material-symbols-outlined">accessible</span>
              <h3>No access notes yet</h3>
              <p>
                {access.notes
                  ? "We have a short access snapshot. Add what you found on the ground."
                  : "Be the first to rate walking, wheelchair access, and ramps."}
              </p>
            </div>
          ) : (
            <ul className="review-list">
              {reviews.map((review) => (
                <li key={review.id} className="review-card">
                  <div className="review-card-top">
                    <strong>{review.author}</strong>
                    <StarRating value={review.rating} readOnly label={`${review.author} access rating`} />
                  </div>
                  {review.walking || review.wheelchair ? (
                    <p className="review-access">
                      Walking {review.walking ?? "—"}/5 · Wheelchair {review.wheelchair ?? "—"}/5
                    </p>
                  ) : null}
                  <p>{review.text}</p>
                  {user && review.userId === user.id && !review.seeded ? (
                    <button className="md-text-btn" type="button" onClick={() => onDeleteReview(review.id)}>
                      Remove my note
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {user ? (
            <ReviewForm user={user} onSubmit={onAddReview} />
          ) : (
            <div className="empty-card">
              <span className="material-symbols-outlined">login</span>
              <h3>Log in to add notes</h3>
              <p>Notes are saved to your account, or you can continue as a guest.</p>
              <div className="empty-actions">
                <button className="md-filled-btn" type="button" onClick={onNeedAuth}>
                  Log in
                </button>
                <button className="md-tonal-btn" type="button" onClick={onGuest}>
                  Continue as guest
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
