import { useMemo, useState } from "react";
import MapView from "./components/MapView.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { categories, places } from "./data/places.js";
import "./App.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState(
    () => new Set(categories.map((category) => category.id)),
  );
  const [selectedId, setSelectedId] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [searchHit, setSearchHit] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const visiblePlaces = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return places.filter((place) => {
      if (!activeCategories.has(place.category)) return false;
      if (!needle) return true;
      const haystack = [place.name, place.category, place.description, ...(place.aliases ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [activeCategories, query]);

  function toggleCategory(id) {
    setActiveCategories((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        if (next.size === 1) return current;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectPlace(place) {
    setSelectedId(place.id);
    setSearchHit(null);
    setFocusTarget({
      key: `${place.id}-${Date.now()}`,
      lat: place.lat,
      lng: place.lng,
      zoom: 16,
    });
    setMenuOpen(false);
  }

  function handleSearchSelect(hit) {
    setSelectedId(null);
    setSearchHit(hit);
    setFocusTarget({
      key: `search-${hit.lat}-${hit.lng}-${Date.now()}`,
      lat: hit.lat,
      lng: hit.lng,
      zoom: 16,
    });
    setMenuOpen(false);
  }

  return (
    <div className="app">
      <Sidebar
        query={query}
        onQueryChange={setQuery}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        places={visiblePlaces}
        selectedId={selectedId}
        onSelectPlace={selectPlace}
        onSearchSelect={handleSearchSelect}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <main className="map-shell">
        <header className="top-bar">
          <button
            className="menu-btn"
            type="button"
            aria-label="Open places list"
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="brand">
            <span className="rivers" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <div>
              <p>City of Bridges</p>
              <h1>Pittsburgh Map</h1>
            </div>
          </div>
        </header>

        <MapView
          places={visiblePlaces}
          selectedId={selectedId}
          onSelectPlace={selectPlace}
          focusTarget={focusTarget}
          searchHit={searchHit}
        />
      </main>
    </div>
  );
}
