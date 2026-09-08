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
import { BASEMAPS, categories, DEFAULT_ZOOM, PITTSBURGH_BOUNDS, PITTSBURGH_CENTER } from "../data/places.js";
import "leaflet/dist/leaflet.css";
import MapToolbar from "./MapToolbar.jsx";

function pinIcon(color, active) {
  return L.divIcon({
    className: "place-marker",
    html: `<span class="place-pin${active ? " is-active" : ""}" style="background:${color}"></span>`,
    iconSize: active ? [20, 20] : [16, 16],
    iconAnchor: active ? [10, 10] : [8, 8],
    popupAnchor: [0, -12],
  });
}

const searchIcon = L.divIcon({
  className: "search-hit-marker",
  html: '<span class="search-hit-pin"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -18],
});

function PlaceMarker({ place, selected, onSelect }) {
  const markerRef = useRef(null);
  const color =
    categories.find((category) => category.id === place.category)?.color ?? "#d4a017";

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
        <p>{place.description}</p>
      </Popup>
    </Marker>
  );
}

function FlyTo({ target }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], target.zoom ?? 16, { duration: 0.85 });
  }, [map, target]);

  return null;
}

export default function MapView({
  places,
  selectedId,
  onSelectPlace,
  focusTarget,
  searchHit,
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
      scrollWheelZoom
      doubleClickZoom
      dragging
      touchZoom
      keyboard
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        key={basemap.id}
        attribution={basemap.attr}
        url={basemap.url}
        subdomains="abc"
        maxZoom={19}
      />
      <ZoomControl position="bottomright" />
      <ScaleControl position="bottomleft" imperial metric />
      <FlyTo target={focusTarget} />
      <MapToolbar basemapId={basemapId} onBasemapChange={setBasemapId} />

      {places.map((place) => (
        <PlaceMarker
          key={place.id}
          place={place}
          selected={place.id === selectedId}
          onSelect={onSelectPlace}
        />
      ))}

      {searchHit ? (
        <Marker position={[searchHit.lat, searchHit.lng]} icon={searchIcon}>
          <Popup>
            <span className="popup-cat">Search</span>
            <h3>{searchHit.name}</h3>
            {searchHit.detail ? <p>{searchHit.detail}</p> : null}
          </Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
