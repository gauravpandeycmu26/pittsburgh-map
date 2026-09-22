import { memo, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  ScaleControl,
  TileLayer,
  useMap,
  useMapEvents,
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
import { accessSummary, accessibilityFor } from "../data/accessibility.js";
import { safeCssColor } from "../lib/sanitize.js";
import "leaflet/dist/leaflet.css";
import MapToolbar from "./MapToolbar.jsx";
import SmoothZoom from "./SmoothZoom.jsx";
import StarRating from "./StarRating.jsx";

const iconCache = new Map();

function pinIcon(color, active) {
  const safe = safeCssColor(color);
  const key = `${safe}-${active}`;
  if (!iconCache.has(key)) {
    iconCache.set(
      key,
      L.divIcon({
        className: "place-marker",
        html: `<span class="place-pin${active ? " is-active" : ""}" style="background:${safe}"></span>`,
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

const draftIcon = L.divIcon({
  className: "search-hit-marker",
  html: '<span class="draft-pin"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -22],
});

const PlaceMarker = memo(function PlaceMarker({ place, selected, rating, onSelect, picking }) {
  const markerRef = useRef(null);
  const color = categoryById[place.category]?.color ?? "#e9c349";
  const access = accessibilityFor(place);

  useEffect(() => {
    if (!selected || picking) return;
    markerRef.current?.openPopup();
  }, [picking, selected]);

  return (
    <Marker
      ref={markerRef}
      position={[place.lat, place.lng]}
      icon={pinIcon(color, selected)}
      eventHandlers={{ click: () => { if (!picking) onSelect(place); } }}
    >
      <Popup>
        <span className="popup-cat">{place.category}</span>
        <h3>{place.name}</h3>
        <p className="popup-access">{accessSummary(access)}</p>
        {rating?.count ? (
          <p className="popup-rating">
            <StarRating value={rating.average} readOnly label={`${place.name} access rating`} />
            {rating.average.toFixed(1)} · {rating.count} note{rating.count === 1 ? "" : "s"}
          </p>
        ) : (
          <p>No access notes yet</p>
        )}
      </Popup>
    </Marker>
  );
});

function FlyTo({ target }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    const timer = setTimeout(() => {
      map.flyTo([target.lat, target.lng], target.zoom ?? FOCUS_ZOOM, {
        duration: 1.05,
        easeLinearity: 0.2,
      });
    }, 40);
    return () => clearTimeout(timer);
  }, [map, target]);

  return null;
}

function MapCenterRef({ centerRef }) {
  const map = useMap();

  useEffect(() => {
    if (!centerRef) return undefined;
    centerRef.current = () => {
      const center = map.getCenter();
      return { lat: center.lat, lng: center.lng };
    };
    return () => {
      centerRef.current = null;
    };
  }, [centerRef, map]);

  return null;
}

function MapResize({ sheetOpen }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize({ animate: false }), 280);
    return () => clearTimeout(timer);
  }, [map, sheetOpen]);

  return null;
}

function MapClickHandler({ enabled, onPick }) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
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
  centerRef,
  picking = false,
  draftPin = null,
  onPick,
}) {
  const [basemapId, setBasemapId] = useState("streets");
  const basemap = BASEMAPS.find((layer) => layer.id === basemapId) ?? BASEMAPS[0];

  return (
    <MapContainer
      className={picking ? "is-picking" : undefined}
      center={PITTSBURGH_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={11}
      maxZoom={19}
      zoomSnap={0.25}
      zoomDelta={0.5}
      wheelPxPerZoomLevel={140}
      zoomAnimation
      fadeAnimation
      markerZoomAnimation
      maxBounds={PITTSBURGH_BOUNDS}
      maxBoundsViscosity={0.7}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer key={basemap.id} attribution={basemap.attr} url={basemap.url} subdomains="abc" maxZoom={19} />
      <ScaleControl position="bottomleft" imperial metric />
      <FlyTo target={focusTarget} />
      <MapCenterRef centerRef={centerRef} />
      <MapResize sheetOpen={sheetOpen} />
      <MapClickHandler enabled={picking} onPick={onPick} />
      <MapToolbar basemapId={basemapId} onBasemapChange={setBasemapId} />
      <SmoothZoom />

      {places.map((place) => (
        <PlaceMarker
          key={place.id}
          place={place}
          selected={place.id === selectedId}
          rating={ratings[place.id]}
          onSelect={onSelectPlace}
          picking={picking}
        />
      ))}

      {searchHit ? (
        <Marker position={[searchHit.lat, searchHit.lng]} icon={searchIcon}>
          <Popup>
            <span className="popup-cat">New landmark</span>
            <h3>{searchHit.name}</h3>
            <p>Not saved yet. Add it to share walking and wheelchair notes.</p>
          </Popup>
        </Marker>
      ) : null}

      {draftPin ? (
        <Marker position={[draftPin.lat, draftPin.lng]} icon={draftIcon}>
          <Popup>
            <span className="popup-cat">New pin</span>
            <h3>Landmark location</h3>
            <p>This is where the new landmark will be saved.</p>
          </Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
