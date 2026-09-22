import { useState } from "react";
import StarRating from "./StarRating.jsx";
import "./ReviewForm.css";

export default function ReviewForm({ user, onSubmit, submitLabel = "Post access notes" }) {
  const [rating, setRating] = useState(0);
  const [walking, setWalking] = useState(0);
  const [wheelchair, setWheelchair] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (rating < 1 || walking < 1 || wheelchair < 1) {
      setError("Rate overall access, walking, and wheelchair access from 1 to 5.");
      return;
    }
    if (text.trim().length < 8) {
      setError("Describe ramps, hills, doors, or other barriers.");
      return;
    }
    onSubmit({
      rating,
      walking,
      wheelchair,
      text: text.trim(),
    });
    setRating(0);
    setWalking(0);
    setWheelchair(0);
    setText("");
    setError("");
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Share access notes</h3>
      <p className="review-as">Posting as {user.guest ? "Guest" : user.displayName}</p>
      <label className="rating-row">
        <span>Overall access</span>
        <StarRating value={rating} onChange={setRating} label="Overall access" />
      </label>
      <label className="rating-row">
        <span>Walking</span>
        <StarRating value={walking} onChange={setWalking} label="Walking access" />
      </label>
      <label className="rating-row">
        <span>Wheelchair</span>
        <StarRating value={wheelchair} onChange={setWheelchair} label="Wheelchair access" />
      </label>
      <label className="md-field">
        <span>What did you run into?</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ramps, curb cuts, hills, elevators, restrooms…"
          maxLength={2000}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="md-filled-btn" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
