import { useEffect, useState } from "react";
import { categories } from "../data/places.js";
import { PATH_TYPES, UNKNOWN_ACCESS, walkingLabels, wheelchairLabels, yesNoLabels } from "../data/accessibility.js";
import "./AddLocationDialog.css";

const rampLabels = { ...yesNoLabels, yes: "Ramps", no: "No ramps", partial: "Some ramps" };
const elevatorLabels = { ...yesNoLabels, yes: "Elevators", no: "No elevator" };
const restroomLabels = { ...yesNoLabels, yes: "Accessible restroom", no: "None noted" };

export default function AddLocationDialog({ open, prefill, mapCenter, onClose, onSave, onPickOnMap }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Landmarks");
  const [description, setDescription] = useState("");
  const [walking, setWalking] = useState(UNKNOWN_ACCESS.walking);
  const [wheelchair, setWheelchair] = useState(UNKNOWN_ACCESS.wheelchair);
  const [ramps, setRamps] = useState(UNKNOWN_ACCESS.ramps);
  const [elevators, setElevators] = useState(UNKNOWN_ACCESS.elevators);
  const [restroom, setRestroom] = useState(UNKNOWN_ACCESS.restroom);
  const [notes, setNotes] = useState("");
  const [paths, setPaths] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const access = { ...UNKNOWN_ACCESS, ...prefill?.accessibility };
    setName(prefill?.name ?? "");
    setCategory(prefill?.category ?? "Landmarks");
    setDescription(prefill?.description ?? prefill?.detail ?? "");
    setWalking(access.walking);
    setWheelchair(access.wheelchair);
    setRamps(access.ramps);
    setElevators(access.elevators);
    setRestroom(access.restroom);
    setNotes(access.notes ?? "");
    setPaths(Array.isArray(prefill?.paths) ? prefill.paths : []);
    setError("");
  }, [open, prefill]);

  if (!open) return null;

  const coords = {
    lat: prefill?.lat ?? mapCenter?.lat ?? 40.4406,
    lng: prefill?.lng ?? mapCenter?.lng ?? -79.9959,
  };
  const coordsSource = prefill?.coordsSource ?? (prefill?.lat != null ? "search" : "center");

  function snapshot() {
    return {
      name: name.trim(),
      category,
      description: description.trim(),
      lat: coords.lat,
      lng: coords.lng,
      coordsSource,
      accessibility: { walking, wheelchair, ramps, elevators, restroom, notes: notes.trim() },
      paths,
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Add a name for this landmark.");
      return;
    }
    onSave(snapshot());
  }

  return (
    <div className="dialog-root">
      <button className="dialog-scrim" type="button" aria-label="Dismiss" onClick={onClose} />
      <form className="dialog-card" onSubmit={handleSubmit}>
        <h2>Add a landmark</h2>
        <p>Drop a pin, then note walking, wheelchair access, ramps, and anything else in the way.</p>
        <label className="md-field">
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Landmark name" />
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
          <span>What is this place?</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Hills, doors, surface…"
          />
        </label>

        <div className="access-grid">
          <label className="md-field">
            <span>Walking</span>
            <select value={walking} onChange={(event) => setWalking(event.target.value)}>
              {Object.entries(walkingLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="md-field">
            <span>Wheelchair</span>
            <select value={wheelchair} onChange={(event) => setWheelchair(event.target.value)}>
              {Object.entries(wheelchairLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="md-field">
            <span>Ramps</span>
            <select value={ramps} onChange={(event) => setRamps(event.target.value)}>
              {Object.entries(rampLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="md-field">
            <span>Elevators</span>
            <select value={elevators} onChange={(event) => setElevators(event.target.value)}>
              {Object.entries(elevatorLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="md-field">
            <span>Restroom</span>
            <select value={restroom} onChange={(event) => setRestroom(event.target.value)}>
              {Object.entries(restroomLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="path-fieldset">
          <legend>Accessible paths</legend>
          <div className="path-options">
            {Object.values(PATH_TYPES).map((path) => {
              const on = paths.includes(path.id);
              return (
                <button
                  key={path.id}
                  type="button"
                  className={`md-assist-chip${on ? " is-on" : ""}`}
                  aria-pressed={on}
                  onClick={() =>
                    setPaths((current) =>
                      current.includes(path.id)
                        ? current.filter((id) => id !== path.id)
                        : [...current, path.id],
                    )
                  }
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {path.icon}
                  </span>
                  {path.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="md-field">
          <span>Access notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Curb cuts, side doors, steep blocks…"
          />
        </label>

        <div className="dialog-pin">
          <p className="dialog-coords">
            {coordsSource === "map"
              ? `Pinned at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
              : coordsSource === "search"
                ? `Search result at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                : "Using the current map center. Choose a point to drop a pin."}
          </p>
          <button className="md-outlined-btn" type="button" onClick={() => onPickOnMap?.(snapshot())}>
            Choose on map
          </button>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="dialog-actions">
          <button className="md-text-btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="md-filled-btn" type="submit">
            Save landmark
          </button>
        </div>
      </form>
    </div>
  );
}
