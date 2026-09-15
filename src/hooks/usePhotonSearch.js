import { useEffect, useState } from "react";
import { PHOTON_BBOX, PITTSBURGH_CENTER } from "../data/places.js";

const PHOTON_URL = "https://photon.komoot.io/api/";

export function usePhotonSearch(query) {
  const [hits, setHits] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 3) {
      setHits([]);
      setStatus("idle");
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const url = new URL(PHOTON_URL);
        url.searchParams.set("q", needle);
        url.searchParams.set("lat", String(PITTSBURGH_CENTER[0]));
        url.searchParams.set("lon", String(PITTSBURGH_CENTER[1]));
        url.searchParams.set("limit", "5");
        url.searchParams.set("bbox", PHOTON_BBOX);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("search failed");
        const data = await response.json();
        const nextHits = (data.features ?? []).map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          const props = feature.properties ?? {};
          return {
            name: props.name || props.street || "Result",
            detail: [props.city, props.state, props.osm_value].filter(Boolean).join(" · "),
            lat,
            lng,
          };
        });
        setHits(nextHits);
        setStatus("done");
      } catch (error) {
        if (error.name === "AbortError") return;
        setHits([]);
        setStatus("error");
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { hits, status };
}
