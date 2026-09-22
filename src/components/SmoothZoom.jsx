import { useMap } from "react-leaflet";
import "./SmoothZoom.css";

export default function SmoothZoom() {
  const map = useMap();

  function zoomBy(delta) {
    map.setZoom(map.getZoom() + delta, { animate: true, duration: 0.45 });
  }

  return (
    <div className="leaflet-bottom leaflet-right">
      <div className="smooth-zoom leaflet-control" role="group" aria-label="Map zoom">
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(0.5)}>
          <span className="material-symbols-outlined">add</span>
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-0.5)}>
          <span className="material-symbols-outlined">remove</span>
        </button>
      </div>
    </div>
  );
}
