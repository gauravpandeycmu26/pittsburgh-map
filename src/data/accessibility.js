export const UNKNOWN_ACCESS = {
  walking: "unknown",
  wheelchair: "unknown",
  ramps: "unknown",
  elevators: "unknown",
  restroom: "unknown",
  notes: "",
};

export const walkingLabels = {
  easy: "Easy walk",
  moderate: "Moderate walk",
  steep: "Steep or uneven",
  unknown: "Walk unknown",
};

export const wheelchairLabels = {
  yes: "Wheelchair accessible",
  partial: "Partial wheelchair access",
  no: "Not wheelchair accessible",
  unknown: "Wheelchair unknown",
};

export const yesNoLabels = {
  yes: "Yes",
  no: "No",
  partial: "Some / mixed",
  unknown: "Unknown",
};

export const PATH_TYPES = {
  "step-free": { id: "step-free", label: "Step-free", icon: "accessible" },
  ramp: { id: "ramp", label: "Ramp", icon: "ramp_right" },
  elevator: { id: "elevator", label: "Elevator", icon: "elevator" },
  "curb-cut": { id: "curb-cut", label: "Curb cuts", icon: "expand" },
  sidewalk: { id: "sidewalk", label: "Paved sidewalk", icon: "directions_walk" },
  "steep-sidewalk": { id: "steep-sidewalk", label: "Steep sidewalk", icon: "trending_up" },
  stairs: { id: "stairs", label: "Stairs", icon: "stairs" },
  indoor: { id: "indoor", label: "Indoor corridor", icon: "door_front" },
};

export const PATH_TYPE_IDS = Object.keys(PATH_TYPES);

export const placePaths = {
  "point-state-park": ["step-free", "sidewalk", "curb-cut"],
  "ppg-place": ["step-free", "ramp", "elevator", "indoor", "sidewalk"],
  "cathedral-of-learning": ["ramp", "elevator", "indoor", "steep-sidewalk"],
  cmu: ["ramp", "elevator", "indoor", "steep-sidewalk", "stairs"],
  "pnc-park": ["step-free", "ramp", "elevator", "curb-cut", "indoor"],
  "acrisure-stadium": ["ramp", "elevator", "indoor", "sidewalk"],
  warhol: ["step-free", "elevator", "indoor", "sidewalk"],
  "duquesne-incline": ["stairs", "steep-sidewalk"],
  "mount-washington": ["steep-sidewalk", "stairs", "sidewalk"],
  "schenley-park": ["sidewalk", "ramp", "steep-sidewalk"],
  phipps: ["step-free", "ramp", "elevator", "indoor"],
  "strip-district": ["sidewalk", "curb-cut", "ramp"],
  "market-square": ["step-free", "sidewalk", "curb-cut"],
  "clemente-bridge": ["step-free", "sidewalk", "ramp"],
  "carnegie-museums": ["ramp", "elevator", "indoor", "steep-sidewalk"],
  "pittsburgh-zoo": ["sidewalk", "ramp", "steep-sidewalk"],
  "station-square": ["step-free", "elevator", "indoor", "ramp"],
  shadyside: ["sidewalk", "curb-cut", "ramp"],
  lawrenceville: ["sidewalk", "steep-sidewalk", "curb-cut"],
  "south-side": ["sidewalk", "curb-cut", "ramp"],
  oakland: ["steep-sidewalk", "ramp", "elevator", "indoor"],
  "frick-park": ["steep-sidewalk", "stairs"],
  "heinz-history": ["step-free", "ramp", "elevator", "indoor"],
  randyland: ["sidewalk", "stairs"],
  "mattress-factory": ["ramp", "elevator", "indoor", "steep-sidewalk"],
  "childrens-museum": ["step-free", "elevator", "indoor", "curb-cut"],
  kennywood: ["sidewalk", "ramp", "steep-sidewalk", "stairs"],
};

export function pathsFor(place) {
  const raw = Array.isArray(place?.paths) ? place.paths : (placePaths[place?.id] ?? []);
  return raw.filter((id) => PATH_TYPES[id]);
}

export const placeAccessibility = {
  "point-state-park": {
    walking: "easy",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "no",
    restroom: "yes",
    notes: "Paved paths to the fountain. Gentle slopes; river walls have some drop-offs.",
  },
  "ppg-place": {
    walking: "easy",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "Level plaza downtown. Building entrances are step-free.",
  },
  "cathedral-of-learning": {
    walking: "moderate",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "Oakland sidewalks slope. Inside, elevators reach the Commons Room and many Nationality Rooms.",
  },
  cmu: {
    walking: "steep",
    wheelchair: "partial",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "The Cut is a hill. Most buildings have ramps or elevators; outdoor routes can be steep.",
  },
  "pnc-park": {
    walking: "easy",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "Accessible seating, elevators, and ramps. North Shore sidewalks are mostly level.",
  },
  "acrisure-stadium": {
    walking: "moderate",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "Large ramps and elevators. The walk from downtown crosses a bridge with a mild grade.",
  },
  warhol: {
    walking: "easy",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "Elevator access to galleries. North Shore sidewalks are level.",
  },
  "duquesne-incline": {
    walking: "steep",
    wheelchair: "no",
    ramps: "no",
    elevators: "no",
    restroom: "no",
    notes: "Historic cars and stairs. The lower station has a steep approach; not a wheelchair route.",
  },
  "mount-washington": {
    walking: "steep",
    wheelchair: "partial",
    ramps: "no",
    elevators: "no",
    restroom: "unknown",
    notes: "Grandview Ave sidewalks exist but the hillside is steep. Overlooks vary by block.",
  },
  "schenley-park": {
    walking: "moderate",
    wheelchair: "partial",
    ramps: "yes",
    elevators: "no",
    restroom: "yes",
    notes: "Some paved roads and paths; many trails are packed dirt or grade.",
  },
  phipps: {
    walking: "easy",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "Step-free main entrance and accessible restrooms. Some garden rooms are tighter.",
  },
  "strip-district": {
    walking: "easy",
    wheelchair: "partial",
    ramps: "partial",
    elevators: "unknown",
    restroom: "unknown",
    notes: "Penn Ave is mostly level but crowded. Shop doorways and curb cuts vary block to block.",
  },
  "market-square": {
    walking: "easy",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "no",
    restroom: "unknown",
    notes: "Flat public square. Nearby businesses vary; many have level or ramped doors.",
  },
  "clemente-bridge": {
    walking: "easy",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "no",
    restroom: "no",
    notes: "Pedestrian deck is level enough for wheelchairs. No restrooms on the span.",
  },
  "carnegie-museums": {
    walking: "moderate",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "Accessible entrance and elevators. The Oakland approach has a noticeable slope.",
  },
  "pittsburgh-zoo": {
    walking: "moderate",
    wheelchair: "partial",
    ramps: "yes",
    elevators: "unknown",
    restroom: "yes",
    notes: "Long outdoor loops with hills. Main paths are paved; some exhibits are steeper.",
  },
  "station-square": {
    walking: "easy",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "Converted station with level indoor routes. Incline and river paths nearby are steeper.",
  },
  shadyside: {
    walking: "easy",
    wheelchair: "partial",
    ramps: "partial",
    elevators: "unknown",
    restroom: "unknown",
    notes: "Walnut Street is mostly level. Older storefronts may have a step at the door.",
  },
  lawrenceville: {
    walking: "moderate",
    wheelchair: "partial",
    ramps: "partial",
    elevators: "unknown",
    restroom: "unknown",
    notes: "Butler Street slopes. Sidewalks and curb cuts are inconsistent.",
  },
  "south-side": {
    walking: "easy",
    wheelchair: "partial",
    ramps: "partial",
    elevators: "unknown",
    restroom: "unknown",
    notes: "East Carson is fairly level. Crowds, outdoor seating, and old doors can block a clear path.",
  },
  oakland: {
    walking: "steep",
    wheelchair: "partial",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "Hospitals and campuses have elevators, but the neighborhood itself is hilly.",
  },
  "frick-park": {
    walking: "steep",
    wheelchair: "no",
    ramps: "no",
    elevators: "no",
    restroom: "partial",
    notes: "Dirt trails, roots, and ravines. Not a wheelchair destination beyond some rim parking.",
  },
  "heinz-history": {
    walking: "easy",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "Modern museum access. Strip sidewalks are mostly level.",
  },
  randyland: {
    walking: "moderate",
    wheelchair: "partial",
    ramps: "no",
    elevators: "no",
    restroom: "no",
    notes: "Outdoor house and yard. Sidewalk approach; some areas are tight or uneven.",
  },
  "mattress-factory": {
    walking: "moderate",
    wheelchair: "partial",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "Elevator in the main building. Mexican War Streets have brick and hills.",
  },
  "childrens-museum": {
    walking: "easy",
    wheelchair: "yes",
    ramps: "yes",
    elevators: "yes",
    restroom: "yes",
    notes: "Step-free entry and elevators. Allegheny Square is a level plaza.",
  },
  kennywood: {
    walking: "moderate",
    wheelchair: "partial",
    ramps: "yes",
    elevators: "unknown",
    restroom: "yes",
    notes: "Paved midways with hills. Ride access varies; many historic attractions have steps.",
  },
};

export function accessibilityFor(place) {
  if (place?.accessibility) return { ...UNKNOWN_ACCESS, ...place.accessibility };
  return placeAccessibility[place?.id] ?? UNKNOWN_ACCESS;
}

export function accessSummary(access) {
  return `${walkingLabels[access.walking]} · ${wheelchairLabels[access.wheelchair]}`;
}
