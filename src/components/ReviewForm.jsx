import { useState } from "react";
import StarRating from "./StarRating.jsx";
import "./ReviewForm.css";

export default function ReviewForm({ onSubmit, submitLabel = "Post review" }) {
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (rating < 1) {
      setError("Choose a rating from 1 to 5.");
      return;
    }
    if (text.trim().length < 8) {
      setError("Write a short review — at least a sentence.");
      return;
    }
    onSubmit({
      author: author.trim() || "Anonymous",
      rating,
      text: text.trim(),
    });
    setAuthor("");
    setRating(0);
    setText("");
    setError("");
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Write a review</h3>
      <StarRating value={rating} onChange={setRating} label="Your rating" />
      <label className="md-field">
        <span>Name</span>
        <input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Anonymous" />
      </label>
      <label className="md-field">
        <span>Review</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What should someone know before they go?"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="md-filled-btn" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
