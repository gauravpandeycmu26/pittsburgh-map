import { useCallback, useState } from "react";
import { FOCUS_ZOOM } from "../data/places.js";
import { nextFocus } from "../lib/geo.js";

export function useMapUi() {
  const [selection, setSelection] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addPrefill, setAddPrefill] = useState(null);
  const [picking, setPicking] = useState(false);
  const [draftPin, setDraftPin] = useState(null);
  const [authOpen, setAuthOpen] = useState(null);

  const selectPlace = useCallback((place) => {
    setSelection({ kind: "place", place });
    setFocusTarget(nextFocus(place.lat, place.lng, FOCUS_ZOOM));
    setMenuOpen(false);
  }, []);

  const selectProspect = useCallback((place) => {
    setSelection({ kind: "prospect", place });
    setFocusTarget(nextFocus(place.lat, place.lng, FOCUS_ZOOM));
    setMenuOpen(false);
  }, []);

  const openAddLocation = useCallback((prefill = null) => {
    const next = prefill
      ? {
          ...prefill,
          coordsSource: prefill.coordsSource ?? (prefill.lat != null ? "search" : "center"),
        }
      : null;
    setAddPrefill(next);
    setDraftPin(prefill?.lat != null ? { lat: prefill.lat, lng: prefill.lng } : null);
    setPicking(false);
    setAddOpen(true);
  }, []);

  const startMapPick = useCallback((draft) => {
    setAddPrefill(draft);
    setAddOpen(false);
    setSelection(null);
    setMenuOpen(false);
    setPicking(true);
  }, []);

  const finishMapPick = useCallback(({ lat, lng }) => {
    setAddPrefill((current) => ({
      ...current,
      lat,
      lng,
      coordsSource: "map",
    }));
    setDraftPin({ lat, lng });
    setFocusTarget(nextFocus(lat, lng, FOCUS_ZOOM));
    setPicking(false);
    setAddOpen(true);
  }, []);

  const closeAdd = useCallback(() => {
    setAddOpen(false);
    setAddPrefill(null);
    setPicking(false);
    setDraftPin(null);
  }, []);

  return {
    selection,
    setSelection,
    focusTarget,
    menuOpen,
    setMenuOpen,
    addOpen,
    addPrefill,
    picking,
    setPicking,
    draftPin,
    authOpen,
    setAuthOpen,
    selectPlace,
    selectProspect,
    openAddLocation,
    startMapPick,
    finishMapPick,
    closeAdd,
    cancelMapPick: () => {
      setPicking(false);
      setAddOpen(true);
    },
  };
}
