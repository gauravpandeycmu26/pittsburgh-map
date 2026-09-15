export function distanceMeters(a, b) {
  const radius = 6371000;
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(haversine));
}

export function findExistingPlace(hit, placeList) {
  const named = placeList.find((place) => place.name.toLowerCase() === hit.name.toLowerCase());
  if (named) return named;
  return placeList.find((place) => distanceMeters(place, hit) < 90) ?? null;
}

let focusSerial = 0;

export function nextFocus(lat, lng, zoom) {
  focusSerial += 1;
  return { id: focusSerial, lat, lng, zoom };
}
