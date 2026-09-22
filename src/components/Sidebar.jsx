import { categories } from "../data/places.js";
import { usePhotonSearch } from "../hooks/usePhotonSearch.js";
import AccessFacts from "./AccessFacts.jsx";
import StarRating from "./StarRating.jsx";
import "./Sidebar.css";

export default function Sidebar({
  query,
  onQueryChange,
  activeCategories,
  onToggleCategory,
  places,
  ratings,
  selectedId,
  onSelectPlace,
  onSearchSelect,
  open,
  onClose,
}) {
  const { hits, status } = usePhotonSearch(query);

  return (
    <>
      {open ? <button className="sidebar-backdrop" type="button" onClick={onClose} /> : null}
      <aside className={`sidebar${open ? " is-open" : ""}`}>
        <div className="sidebar-head">
          <p className="kicker">Access map</p>
          <h2>How usable is it?</h2>
          <p className="lede">Walking, wheelchair, ramps, and hills — plus notes from people who have been there.</p>
          <label className="md-field">
            <span className="sr-only">Search places</span>
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search parks, CMU, bridges…"
            />
          </label>
        </div>

        <div className="filters" role="group" aria-label="Place categories">
          {categories.map((category) => {
            const on = activeCategories.has(category.id);
            return (
              <button
                key={category.id}
                type="button"
                className={`md-assist-chip${on ? " is-on" : ""}`}
                onClick={() => onToggleCategory(category.id)}
              >
                <span className="dot" style={{ background: category.color }} />
                {category.label}
              </button>
            );
          })}
        </div>

        {status === "error" ? <p className="search-status">City search is unavailable right now.</p> : null}
        {status === "loading" ? <p className="search-status">Searching the city…</p> : null}

        {hits.length > 0 ? (
          <section className="results">
            <h3>City search</h3>
            <ul>
              {hits.map((hit) => (
                <li key={`${hit.lat}-${hit.lng}-${hit.name}`}>
                  <button type="button" onClick={() => onSearchSelect(hit)}>
                    <strong>{hit.name}</strong>
                    {hit.detail ? <span>{hit.detail}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="place-list">
          <h3>{places.length === 1 ? "1 place" : `${places.length} places`}</h3>
          <ul>
            {places.map((place) => {
              const score = ratings[place.id];
              return (
                <li key={place.id}>
                  <button
                    type="button"
                    className={place.id === selectedId ? "is-selected" : ""}
                    onClick={() => onSelectPlace(place)}
                  >
                    <strong>{place.name}</strong>
                    <span>{place.category}</span>
                    <AccessFacts place={place} compact />
                    {score?.count ? (
                      <span className="list-rating">
                        <StarRating value={score.average} readOnly label={`${place.name} access rating`} />
                        {score.average.toFixed(1)}
                      </span>
                    ) : (
                      <em>No access notes yet</em>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </aside>
    </>
  );
}
