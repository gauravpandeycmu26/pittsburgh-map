import { useEffect, useState } from "react";
import { categories } from "../data/places.js";
import "./AddLocationDialog.css";

export default function AddLocationDialog({ open, prefill, mapCenter, onClose, onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Landmarks");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(prefill?.name ?? "");
    setCategory(prefill?.category ?? "Landmarks");
    setDescription(prefill?.description ?? prefill?.detail ?? "");
    setError("");
  }, [open, prefill]);

  if (!open) return null;

  const coords = {
    lat: prefill?.lat ?? mapCenter?.lat ?? 40.4406,
    lng: prefill?.lng ?? mapCenter?.lng ?? -79.9959,
  };

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Add a name for this location.");
      return;
    }
    onSave({
      name: name.trim(),
      category,
      description: description.trim(),
      lat: coords.lat,
      lng: coords.lng,
    });
  }

  return (
    <div className="dialog-root">
      <button className="dialog-scrim" type="button" aria-label="Dismiss" onClick={onClose} />
      <form className="dialog-card" onSubmit={handleSubmit}>
        <h2>Add a location</h2>
        <p>Save a place that is not on the list yet. You can review it right after.</p>
        <label className="md-field">
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Place name" />
        </label>
        <label className="md-field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="md-field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this place?"
          />
        </label>
        <p className="dialog-coords">
          Dropped at {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </p>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="dialog-actions">
          <button className="md-text-btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="md-filled-btn" type="submit">
            Save location
          </button>
        </div>
      </form>
    </div>
  );
}
