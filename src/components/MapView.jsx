import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  ScaleControl,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  BASEMAPS,
  categoryById,
  DEFAULT_ZOOM,
  FOCUS_ZOOM,
  PITTSBURGH_BOUNDS,
  PITTSBURGH_CENTER,
} from "../data/places.js";
import "leaflet/dist/leaflet.css";
import MapToolbar from "./MapToolbar.jsx";
import StarRating from "./StarRating.jsx";

const iconCache = new Map();

function pinIcon(color, active) {
  const key = `${color}-${active}`;
  if (!iconCache.has(key)) {
    iconCache.set(
      key,
      L.divIcon({
        className: "place-marker",
        html: `<span class="place-pin${active ? " is-active" : ""}" style="background:${color}"></span>`,
        iconSize: active ? [20, 20] : [16, 16],
        iconAnchor: active ? [10, 10] : [8, 8],
        popupAnchor: [0, -12],
      }),
    );
  }
  return iconCache.get(key);
}

const searchIcon = L.divIcon({
  className: "search-hit-marker",
  html: '<span class="search-hit-pin"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -18],
});

function PlaceMarker({ place, selected, rating, onSelect }) {
  const markerRef = useRef(null);
  const color = categoryById[place.category]?.color ?? "#e9c349";

  useEffect(() => {
    if (!selected) return;
    markerRef.current?.openPopup();
  }, [selected]);

  return (
    <Marker
      ref={markerRef}
      position={[place.lat, place.lng]}
      icon={pinIcon(color, selected)}
      eventHandlers={{ click: () => onSelect(place) }}
    >
      <Popup>
        <span className="popup-cat">{place.category}</span>
        <h3>{place.name}</h3>
        {rating?.count ? (
          <p className="popup-rating">
            <StarRating value={rating.average} readOnly label={`${place.name} rating`} />
            {rating.average.toFixed(1)} · {rating.count} review{rating.count === 1 ? "" : "s"}
          </p>
        ) : (
          <p>No reviews yet</p>
        )}
      </Popup>
    </Marker>
  );
}

function FlyTo({ target }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], target.zoom ?? FOCUS_ZOOM, { duration: 0.85 });
  }, [map, target]);

  return null;
}

function MapSync({ sheetOpen, onCenterChange }) {
  const map = useMap();

  useEffect(() => {
    const sync = () => {
      const center = map.getCenter();
      onCenterChange({ lat: center.lat, lng: center.lng });
    };
    sync();
    map.on("moveend", sync);
    return () => {
      map.off("moveend", sync);
    };
  }, [map, onCenterChange]);

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 220);
    return () => clearTimeout(timer);
  }, [map, sheetOpen]);

  return null;
}

export default function MapView({
  places,
  ratings,
  selectedId,
  onSelectPlace,
  focusTarget,
  searchHit,
  sheetOpen,
  onCenterChange,
}) {
  const [basemapId, setBasemapId] = useState("streets");
  const basemap = BASEMAPS.find((layer) => layer.id === basemapId) ?? BASEMAPS[0];

  return (
    <MapContainer
      center={PITTSBURGH_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={11}
      maxZoom={19}
      maxBounds={PITTSBURGH_BOUNDS}
      maxBoundsViscosity={0.7}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer key={basemap.id} attribution={basemap.attr} url={basemap.url} subdomains="abc" maxZoom={19} />
      <ZoomControl position="bottomright" />
      <ScaleControl position="bottomleft" imperial metric />
      <FlyTo target={focusTarget} />
      <MapSync sheetOpen={sheetOpen} onCenterChange={onCenterChange} />
      <MapToolbar basemapId={basemapId} onBasemapChange={setBasemapId} />

      {places.map((place) => (
        <PlaceMarker
          key={place.id}
          place={place}
          selected={place.id === selectedId}
          rating={ratings[place.id]}
          onSelect={onSelectPlace}
        />
      ))}

      {searchHit ? (
        <Marker position={[searchHit.lat, searchHit.lng]} icon={searchIcon}>
          <Popup>
            <span className="popup-cat">New place</span>
            <h3>{searchHit.name}</h3>
            <p>No reviews yet. Add this location to write the first one.</p>
          </Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
