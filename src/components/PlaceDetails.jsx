import { averageRating } from "../lib/storage.js";
import ReviewForm from "./ReviewForm.jsx";
import StarRating from "./StarRating.jsx";
import "./PlaceDetails.css";

export default function PlaceDetails({
  selection,
  reviews,
  onClose,
  onAddReview,
  onAddLocation,
}) {
  if (!selection) return null;

  const isProspect = selection.kind === "prospect";
  const place = selection.place;
  const avg = averageRating(reviews);

  return (
    <section className="place-sheet" aria-labelledby="place-sheet-title">
      <header className="place-sheet-head">
        <button className="md-text-btn sheet-close" type="button" onClick={onClose} aria-label="Close reviews">
          <span className="material-symbols-outlined">close</span>
        </button>
        <p className="sheet-kicker">{place.category}</p>
        <h2 id="place-sheet-title">{place.name}</h2>
        {place.description ? <p className="sheet-lede">{place.description}</p> : null}
        <div className="sheet-score">
          <StarRating value={avg} readOnly label="Average rating" />
          <span>
            {reviews.length === 0
              ? "No reviews yet"
              : `${avg.toFixed(1)} · ${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </header>

      {isProspect ? (
        <div className="empty-card">
          <span className="material-symbols-outlined">add_location_alt</span>
          <h3>Not on the map yet</h3>
          <p>There are no reviews because this place has not been added. Save it, then write the first one.</p>
          <button className="md-filled-btn" type="button" onClick={() => onAddLocation(place)}>
            Add this location
          </button>
        </div>
      ) : (
        <>
          {reviews.length === 0 ? (
            <div className="empty-card">
              <span className="material-symbols-outlined">rate_review</span>
              <h3>No reviews yet</h3>
              <p>Be the first to rate this place and tell people what to expect.</p>
            </div>
          ) : (
            <ul className="review-list">
              {reviews.map((review) => (
                <li key={review.id} className="review-card">
                  <div className="review-card-top">
                    <strong>{review.author}</strong>
                    <StarRating value={review.rating} readOnly label={`${review.author} rating`} />
                  </div>
                  <p>{review.text}</p>
                </li>
              ))}
            </ul>
          )}
          <ReviewForm onSubmit={onAddReview} />
        </>
      )}
    </section>
  );
}
