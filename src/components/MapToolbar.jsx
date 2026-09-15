import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { BASEMAPS, DEFAULT_ZOOM, LOCATE_ZOOM, PITTSBURGH_CENTER } from "../data/places.js";
import "./MapToolbar.css";

export default function MapToolbar({ basemapId, onBasemapChange }) {
  const map = useMap();
  const [locateError, setLocateError] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function resetView() {
    map.flyTo(PITTSBURGH_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
  }

  function locate() {
    setLocateError("");
    if (!navigator.geolocation) {
      setLocateError("Location is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        map.flyTo([position.coords.latitude, position.coords.longitude], LOCATE_ZOOM, {
          duration: 0.8,
        });
      },
      () => {
        if (!mountedRef.current) return;
        setLocateError("Could not read your location.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="map-toolbar">
      <div className="layer-switch" role="group" aria-label="Map style">
        {BASEMAPS.map((layer) => (
          <button
            key={layer.id}
            type="button"
            className={layer.id === basemapId ? "is-active" : ""}
            onClick={() => onBasemapChange(layer.id)}
          >
            {layer.label}
          </button>
        ))}
      </div>
      <div className="tool-actions">
        <button type="button" onClick={resetView}>
          Pittsburgh
        </button>
        <button type="button" onClick={locate}>
          My location
        </button>
      </div>
      {locateError ? <p className="locate-error">{locateError}</p> : null}
    </div>
  );
}
