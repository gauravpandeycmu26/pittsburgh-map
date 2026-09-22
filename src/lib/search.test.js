import { describe, expect, it } from "vitest";
import { PHOTON_BBOX, PITTSBURGH_CENTER, places } from "../data/places.js";
import {
  createPhotonSearchUrl,
  filterPlaces,
  parsePhotonHits,
  PHOTON_URL,
  resolveSearchHit,
} from "./search.js";

const catalog = [
  {
    id: "cmu",
    name: "Carnegie Mellon University",
    category: "Universities",
    aliases: ["CMU", "Carnegie Mellon"],
    description: "Campus in Oakland known for computer science.",
    lat: 40.4433,
    lng: -79.9436,
  },
  {
    id: "point",
    name: "Point State Park",
    category: "Parks",
    description: "Where the three rivers meet.",
    lat: 40.4417,
    lng: -80.0103,
  },
  {
    id: "pnc",
    name: "PNC Park",
    category: "Sports",
    aliases: ["Pirates"],
    description: "Pirates ballpark on the North Shore.",
    lat: 40.4469,
    lng: -80.0057,
  },
];

const allCategories = new Set(["Universities", "Parks", "Sports"]);

describe("filterPlaces", () => {
  it("returns every active-category place when the query is empty or blank", () => {
    expect(filterPlaces(catalog, "", allCategories)).toHaveLength(3);
    expect(filterPlaces(catalog, "   ", allCategories)).toHaveLength(3);
  });

  it("matches a place name without caring about case", () => {
    const results = filterPlaces(catalog, "pnc park", allCategories);
    expect(results.map((place) => place.id)).toEqual(["pnc"]);
  });

  it("matches aliases such as CMU", () => {
    const results = filterPlaces(catalog, "cmu", allCategories);
    expect(results.map((place) => place.id)).toEqual(["cmu"]);
  });

  it("matches category and description text", () => {
    expect(filterPlaces(catalog, "universities", allCategories).map((place) => place.id)).toEqual(["cmu"]);
    expect(filterPlaces(catalog, "three rivers", allCategories).map((place) => place.id)).toEqual(["point"]);
  });

  it("ignores leading and trailing spaces", () => {
    expect(filterPlaces(catalog, "  pirates  ", allCategories).map((place) => place.id)).toEqual(["pnc"]);
  });

  it("returns nothing when the query matches no place", () => {
    expect(filterPlaces(catalog, "kennywood", allCategories)).toEqual([]);
  });

  it("keeps category filters in place while searching", () => {
    const parksOnly = new Set(["Parks"]);
    expect(filterPlaces(catalog, "park", parksOnly).map((place) => place.id)).toEqual(["point"]);
    expect(filterPlaces(catalog, "pnc", parksOnly)).toEqual([]);
  });

  it("finds Carnegie Mellon in the live catalog via the CMU alias", () => {
    const results = filterPlaces(places, "cmu", new Set(["Universities"]));
    expect(results.some((place) => place.id === "cmu")).toBe(true);
  });
});

describe("createPhotonSearchUrl", () => {
  it("builds a Pittsburgh-bounded Photon URL", () => {
    const url = createPhotonSearchUrl("  cathedral  ");
    expect(url.origin + url.pathname).toBe(PHOTON_URL);
    expect(url.searchParams.get("q")).toBe("cathedral");
    expect(url.searchParams.get("lat")).toBe(String(PITTSBURGH_CENTER[0]));
    expect(url.searchParams.get("lon")).toBe(String(PITTSBURGH_CENTER[1]));
    expect(url.searchParams.get("limit")).toBe("5");
    expect(url.searchParams.get("bbox")).toBe(PHOTON_BBOX);
  });
});

describe("parsePhotonHits", () => {
  it("maps GeoJSON features into search hits", () => {
    const hits = parsePhotonHits({
      features: [
        {
          geometry: { coordinates: [-79.9532, 40.4443] },
          properties: {
            name: "Cathedral of Learning",
            city: "Pittsburgh",
            state: "Pennsylvania",
            osm_value: "university",
          },
        },
      ],
    });

    expect(hits).toEqual([
      {
        name: "Cathedral of Learning",
        detail: "Pittsburgh · Pennsylvania · university",
        lat: 40.4443,
        lng: -79.9532,
      },
    ]);
  });

  it("falls back to street, then Result, and skips empty detail parts", () => {
    expect(
      parsePhotonHits({
        features: [
          {
            geometry: { coordinates: [-80, 40.44] },
            properties: { street: "Forbes Ave" },
          },
          {
            geometry: { coordinates: [-80.01, 40.45] },
            properties: {},
          },
        ],
      }),
    ).toEqual([
      { name: "Forbes Ave", detail: "", lat: 40.44, lng: -80 },
      { name: "Result", detail: "", lat: 40.45, lng: -80.01 },
    ]);
  });

  it("treats missing feature lists as no hits", () => {
    expect(parsePhotonHits(undefined)).toEqual([]);
    expect(parsePhotonHits({})).toEqual([]);
  });
});

describe("resolveSearchHit", () => {
  it("selects a catalog place when the hit name matches", () => {
    const resolved = resolveSearchHit({ name: "carnegie mellon university", lat: 0, lng: 0 }, catalog);
    expect(resolved).toEqual({ kind: "place", place: catalog[0] });
  });

  it("selects a catalog place when the hit is within 90 meters", () => {
    const resolved = resolveSearchHit(
      { name: "CMU Cut", lat: 40.44335, lng: -79.9436, detail: "Oakland" },
      catalog,
    );
    expect(resolved.kind).toBe("place");
    expect(resolved.place.id).toBe("cmu");
  });

  it("resolves a live catalog search for Cathedral of Learning from Photon-shaped data", () => {
    const [hit] = parsePhotonHits({
      features: [
        {
          geometry: { coordinates: [-79.9532, 40.4443] },
          properties: { name: "Cathedral of Learning" },
        },
      ],
    });
    const resolved = resolveSearchHit(hit, places);
    expect(resolved.kind).toBe("place");
    expect(resolved.place.id).toBe("cathedral-of-learning");
  });

  it("returns a prospect when the hit is a new location", () => {
    const hit = { name: "Smallman Galley", detail: "Strip District", lat: 40.455, lng: -79.984 };
    expect(resolveSearchHit(hit, catalog)).toEqual({
      kind: "prospect",
      place: {
        name: "Smallman Galley",
        category: "Landmarks",
        description: "Strip District",
        lat: 40.455,
        lng: -79.984,
      },
    });
  });
});
