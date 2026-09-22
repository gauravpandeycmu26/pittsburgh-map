import { useEffect, useState } from "react";
import {
  createPhotonSearchUrl,
  parsePhotonHits,
  REMOTE_SEARCH_DEBOUNCE_MS,
  REMOTE_SEARCH_MIN_LENGTH,
} from "../lib/search.js";

export function usePhotonSearch(query) {
  const [hits, setHits] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < REMOTE_SEARCH_MIN_LENGTH) {
      setHits([]);
      setStatus("idle");
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const response = await fetch(createPhotonSearchUrl(needle), { signal: controller.signal });
        if (!response.ok) throw new Error("search failed");
        const data = await response.json();
        setHits(parsePhotonHits(data));
        setStatus("done");
      } catch (error) {
        if (error.name === "AbortError") return;
        setHits([]);
        setStatus("error");
      }
    }, REMOTE_SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { hits, status };
}
