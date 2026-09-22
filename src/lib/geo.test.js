import { describe, expect, it } from "vitest";
import { distanceMeters, findExistingPlace, nextFocus } from "./geo.js";

const cmu = { name: "Carnegie Mellon University", lat: 40.4433, lng: -79.9436 };

describe("distanceMeters", () => {
  it("is about zero for the same point", () => {
    expect(distanceMeters(cmu, cmu)).toBeLessThan(1);
  });

  it("grows as points move apart", () => {
    const nearby = { lat: 40.4434, lng: -79.9436 };
    const far = { lat: 40.45, lng: -80.01 };
    expect(distanceMeters(cmu, nearby)).toBeLessThan(distanceMeters(cmu, far));
  });
});

describe("findExistingPlace", () => {
  const places = [cmu, { name: "PNC Park", lat: 40.4469, lng: -80.0057 }];

  it("matches a case-insensitive name", () => {
    expect(findExistingPlace({ name: "pnc park", lat: 0, lng: 0 }, places).name).toBe("PNC Park");
  });

  it("matches a nearby coordinate when names differ", () => {
    const hit = { name: "The Cut", lat: 40.44331, lng: -79.94361 };
    expect(findExistingPlace(hit, places).name).toBe("Carnegie Mellon University");
  });

  it("returns null when nothing is close", () => {
    expect(findExistingPlace({ name: "Elsewhere", lat: 41, lng: -80 }, places)).toBeNull();
  });
});

describe("nextFocus", () => {
  it("returns coordinates and a unique id", () => {
    const first = nextFocus(40.44, -80, 16);
    const second = nextFocus(40.44, -80, 16);
    expect(first).toMatchObject({ lat: 40.44, lng: -80, zoom: 16 });
    expect(second.id).toBeGreaterThan(first.id);
  });
});
