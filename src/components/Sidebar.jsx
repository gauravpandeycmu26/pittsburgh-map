import { useEffect, useState } from "react";
import { categories } from "../data/places.js";
import "./Sidebar.css";

const PHOTON_URL = "https://photon.komoot.io/api/";

export default function Sidebar({
  query,
  onQueryChange,
  activeCategories,
  onToggleCategory,
  places,
  selectedId,
  onSelectPlace,
  onSearchSelect,
  open,
  onClose,
}) {
  const [remoteHits, setRemoteHits] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 3) {
      setRemoteHits([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const url = new URL(PHOTON_URL);
        url.searchParams.set("q", needle);
        url.searchParams.set("lat", "40.4406");
        url.searchParams.set("lon", "-79.9959");
        url.searchParams.set("limit", "5");
        url.searchParams.set("bbox", "-80.22,40.32,-79.7,40.55");
        const response = await fetch(url);
        if (!response.ok) throw new Error("search failed");
        const data = await response.json();
        const hits = (data.features ?? []).map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          const props = feature.properties ?? {};
          const name = props.name || props.street || "Result";
          const detail = [props.city, props.state, props.osm_value]
            .filter(Boolean)
            .join(" · ");
          return { name, detail, lat, lng };
        });
        setRemoteHits(hits);
      } catch {
        setRemoteHits([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      {open ? <button className="sidebar-backdrop" type="button" onClick={onClose} /> : null}
      <aside className={`sidebar${open ? " is-open" : ""}`}>
        <div className="sidebar-head">
          <p className="kicker">Free OpenStreetMap</p>
          <h2>Explore Pittsburgh</h2>
          <p className="lede">
            Drag, scroll to zoom, and tap a pin. Search the city or jump to a landmark.
          </p>
          <label className="search">
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
                className={on ? "is-on" : ""}
                onClick={() => onToggleCategory(category.id)}
              >
                <i style={{ background: category.color }} />
                {category.label}
              </button>
            );
          })}
        </div>

        {remoteHits.length > 0 ? (
          <section className="results">
            <h3>City search {searching ? "…" : ""}</h3>
            <ul>
              {remoteHits.map((hit) => (
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
            {places.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  className={place.id === selectedId ? "is-selected" : ""}
                  onClick={() => onSelectPlace(place)}
                >
                  <strong>{place.name}</strong>
                  <span>{place.category}</span>
                  <em>{place.description}</em>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </>
  );
}
