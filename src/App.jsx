import { useMemo, useState } from "react";
import AddLocationDialog from "./components/AddLocationDialog.jsx";
import MapView from "./components/MapView.jsx";
import PlaceDetails from "./components/PlaceDetails.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { categories, FOCUS_ZOOM, places as catalogPlaces } from "./data/places.js";
import { findExistingPlace, nextFocus } from "./lib/geo.js";
import { averageRating, createId, loadStore, reviewsFor, saveStore } from "./lib/storage.js";
import "./App.css";

const initialStore = loadStore();

export default function App() {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState(
    () => new Set(categories.map((category) => category.id)),
  );
  const [customPlaces, setCustomPlaces] = useState(initialStore.customPlaces);
  const [userReviews, setUserReviews] = useState(initialStore.userReviews);
  const [selection, setSelection] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addPrefill, setAddPrefill] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);

  const allPlaces = useMemo(() => [...catalogPlaces, ...customPlaces], [customPlaces]);

  const visiblePlaces = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allPlaces.filter((place) => {
      if (!activeCategories.has(place.category)) return false;
      if (!needle) return true;
      const haystack = [place.name, place.category, place.description, ...(place.aliases ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [activeCategories, allPlaces, query]);

  const selectedReviews = selection?.kind === "place" ? reviewsFor(selection.place.id, userReviews) : [];

  function persist(nextCustom, nextReviews) {
    saveStore({ customPlaces: nextCustom, userReviews: nextReviews });
  }

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
    setSelection({ kind: "place", place });
    setFocusTarget(nextFocus(place.lat, place.lng, FOCUS_ZOOM));
    setMenuOpen(false);
  }

  function handleSearchSelect(hit) {
    const existing = findExistingPlace(hit, allPlaces);
    if (existing) {
      selectPlace(existing);
      return;
    }
    setSelection({
      kind: "prospect",
      place: {
        name: hit.name,
        category: "Landmarks",
        description: hit.detail,
        lat: hit.lat,
        lng: hit.lng,
      },
    });
    setFocusTarget(nextFocus(hit.lat, hit.lng, FOCUS_ZOOM));
    setMenuOpen(false);
  }

  function addReview(draft) {
    if (selection?.kind !== "place") return;
    const placeId = selection.place.id;
    const review = {
      id: createId("review"),
      author: draft.author,
      rating: draft.rating,
      text: draft.text,
      createdAt: Date.now(),
    };
    const nextReviews = {
      ...userReviews,
      [placeId]: [...(userReviews[placeId] ?? []), review],
    };
    setUserReviews(nextReviews);
    persist(customPlaces, nextReviews);
  }

  function openAddLocation(prefill = null) {
    setAddPrefill(prefill);
    setAddOpen(true);
  }

  function saveLocation(draft) {
    const place = {
      id: createId("place"),
      name: draft.name,
      category: draft.category,
      description: draft.description,
      lat: draft.lat,
      lng: draft.lng,
      custom: true,
    };
    const nextCustom = [...customPlaces, place];
    setCustomPlaces(nextCustom);
    persist(nextCustom, userReviews);
    setAddOpen(false);
    setAddPrefill(null);
    selectPlace(place);
  }

  const ratings = useMemo(() => {
    const map = {};
    for (const place of allPlaces) {
      const list = reviewsFor(place.id, userReviews);
      map[place.id] = { count: list.length, average: averageRating(list) };
    }
    return map;
  }, [allPlaces, userReviews]);

  return (
    <div className={`app${selection ? " has-sheet" : ""}`}>
      <Sidebar
        query={query}
        onQueryChange={setQuery}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        places={visiblePlaces}
        ratings={ratings}
        selectedId={selection?.kind === "place" ? selection.place.id : null}
        onSelectPlace={selectPlace}
        onSearchSelect={handleSearchSelect}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <main className="map-shell">
        <header className="top-bar">
          <button
            className="md-fab menu-btn"
            type="button"
            aria-label="Open places list"
            onClick={() => setMenuOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="brand">
            <span className="material-symbols-outlined brand-icon">map</span>
            <div>
              <p>City of Bridges</p>
              <h1>Pittsburgh Map</h1>
            </div>
          </div>
        </header>

        <MapView
          places={visiblePlaces}
          ratings={ratings}
          selectedId={selection?.kind === "place" ? selection.place.id : null}
          onSelectPlace={selectPlace}
          focusTarget={focusTarget}
          searchHit={selection?.kind === "prospect" ? selection.place : null}
          sheetOpen={Boolean(selection)}
          onCenterChange={setMapCenter}
        />

        <button
          className="md-fab add-fab"
          type="button"
          aria-label="Add a location"
          onClick={() => openAddLocation(null)}
        >
          <span className="material-symbols-outlined">add_location_alt</span>
        </button>
      </main>

      {selection ? (
        <PlaceDetails
          selection={selection}
          reviews={selectedReviews}
          onClose={() => setSelection(null)}
          onAddReview={addReview}
          onAddLocation={(place) => openAddLocation(place)}
        />
      ) : null}

      <AddLocationDialog
        open={addOpen}
        prefill={addPrefill}
        mapCenter={mapCenter}
        onClose={() => setAddOpen(false)}
        onSave={saveLocation}
      />
    </div>
  );
}
