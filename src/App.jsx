import { useEffect, useMemo, useRef, useState } from "react";
import AccountBar from "./components/AccountBar.jsx";
import AddLocationDialog from "./components/AddLocationDialog.jsx";
import AuthDialog from "./components/AuthDialog.jsx";
import MapView from "./components/MapView.jsx";
import PlaceDetails from "./components/PlaceDetails.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { categories } from "./data/places.js";
import { useAccessStore } from "./hooks/useAccessStore.js";
import { useAuth } from "./hooks/useAuth.js";
import { useMapUi } from "./hooks/useMapUi.js";
import { toggleCategorySet } from "./lib/categories.js";
import { filterPlaces, resolveSearchHit } from "./lib/search.js";
import "./App.css";

export default function App() {
  const { user, error: authError, busy, signup, login, guest, logout, setError: setAuthError } = useAuth();
  const store = useAccessStore();
  const ui = useMapUi();
  const centerRef = useRef(null);
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState(
    () => new Set(categories.map((category) => category.id)),
  );
  const [formError, setFormError] = useState("");

  const visiblePlaces = useMemo(
    () => filterPlaces(store.places, query, activeCategories),
    [activeCategories, query, store.places],
  );

  const selectedPlaceId = ui.selection?.kind === "place" ? ui.selection.place.id : null;
  const selectedReviews = selectedPlaceId ? (store.reviewsByPlace[selectedPlaceId] ?? []) : [];

  useEffect(() => {
    if (!selectedPlaceId) return undefined;
    let alive = true;
    store.loadReviews(selectedPlaceId).catch(() => {
      if (alive) setFormError("Could not load access notes.");
    });
    return () => {
      alive = false;
    };
  }, [selectedPlaceId, store.loadReviews]);

  function toggleCategory(id) {
    setActiveCategories((current) => toggleCategorySet(current, id));
  }

  function selectPlace(place) {
    if (ui.picking) return;
    ui.selectPlace(place);
  }

  function onSearchSelect(hit) {
    if (ui.picking) return;
    const resolved = resolveSearchHit(hit, store.places);
    if (resolved.kind === "place") {
      ui.selectPlace(resolved.place);
      return;
    }
    ui.selectProspect(resolved.place);
  }

  async function handleAddReview(draft) {
    if (!selectedPlaceId) return;
    try {
      await store.addReview(selectedPlaceId, draft);
      setFormError("");
    } catch (error) {
      setFormError(error.message);
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!selectedPlaceId) return;
    try {
      await store.removeReview(selectedPlaceId, reviewId);
    } catch (error) {
      setFormError(error.message);
    }
  }

  function requireAuth(next = "login") {
    ui.setAuthOpen(next);
  }

  function handleOpenAdd(prefill = null) {
    if (!user) {
      requireAuth("signup");
      return;
    }
    const center = centerRef.current?.();
    ui.openAddLocation(prefill ?? (center ? { lat: center.lat, lng: center.lng, coordsSource: "center" } : null));
  }

  async function handleSaveLocation(draft) {
    try {
      const place = await store.addPlace(draft);
      ui.closeAdd();
      ui.selectPlace(place);
      setFormError("");
    } catch (error) {
      setFormError(error.message);
    }
  }

  return (
    <div className={`app${ui.selection ? " has-sheet" : ""}`}>
      <Sidebar
        query={query}
        onQueryChange={setQuery}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        places={visiblePlaces}
        ratings={store.ratings}
        selectedId={selectedPlaceId}
        onSelectPlace={selectPlace}
        onSearchSelect={onSearchSelect}
        open={ui.menuOpen}
        onClose={() => ui.setMenuOpen(false)}
      />

      <main className={`map-shell${ui.picking ? " is-picking" : ""}`}>
        <header className="top-bar">
          <button
            className="md-fab menu-btn"
            type="button"
            aria-label="Open places list"
            onClick={() => ui.setMenuOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="brand">
            <span className="material-symbols-outlined brand-icon">accessible</span>
            <div>
              <p>Access first</p>
              <h1>Pittsburgh Access Map</h1>
            </div>
          </div>
          <AccountBar
            user={user}
            onLogin={() => requireAuth("login")}
            onSignup={() => requireAuth("signup")}
            onGuest={async () => {
              await guest();
            }}
            onLogout={logout}
          />
        </header>

        {store.status === "error" || formError ? (
          <p className="api-banner" role="alert">
            {formError || store.error}
          </p>
        ) : null}

        {ui.picking ? (
          <div className="pick-banner" role="status">
            <span className="material-symbols-outlined" aria-hidden="true">
              add_location_alt
            </span>
            <p>Tap the map to place this landmark</p>
            <button className="md-text-btn" type="button" onClick={ui.cancelMapPick}>
              Cancel
            </button>
          </div>
        ) : null}

        <MapView
          places={visiblePlaces}
          ratings={store.ratings}
          selectedId={selectedPlaceId}
          onSelectPlace={selectPlace}
          focusTarget={ui.focusTarget}
          searchHit={ui.selection?.kind === "prospect" ? ui.selection.place : null}
          sheetOpen={Boolean(ui.selection)}
          centerRef={centerRef}
          picking={ui.picking}
          draftPin={ui.draftPin}
          onPick={ui.finishMapPick}
        />

        {ui.picking ? null : (
          <button
            className="md-fab add-fab"
            type="button"
            aria-label="Add a landmark"
            onClick={() => handleOpenAdd(null)}
          >
            <span className="material-symbols-outlined">add_location_alt</span>
          </button>
        )}
      </main>

      {ui.selection && !ui.picking ? (
        <PlaceDetails
          selection={ui.selection}
          reviews={selectedReviews}
          user={user}
          onClose={() => ui.setSelection(null)}
          onAddReview={handleAddReview}
          onAddLocation={(place) => handleOpenAdd(place)}
          onNeedAuth={() => requireAuth("login")}
          onGuest={async () => {
            await guest();
          }}
          onDeleteReview={handleDeleteReview}
        />
      ) : null}

      <AddLocationDialog
        open={ui.addOpen}
        prefill={ui.addPrefill}
        mapCenter={centerRef.current?.() ?? null}
        onClose={ui.closeAdd}
        onSave={handleSaveLocation}
        onPickOnMap={ui.startMapPick}
      />

      <AuthDialog
        open={Boolean(ui.authOpen)}
        mode={ui.authOpen === "signup" ? "signup" : "login"}
        busy={busy}
        error={authError}
        onClose={() => {
          ui.setAuthOpen(null);
          setAuthError("");
        }}
        onLogin={login}
        onSignup={signup}
        onGuest={guest}
        onModeChange={ui.setAuthOpen}
      />
    </div>
  );
}
