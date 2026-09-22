import {
  accessSummary,
  accessibilityFor,
  PATH_TYPES,
  pathsFor,
  walkingLabels,
  wheelchairLabels,
  yesNoLabels,
} from "../data/accessibility.js";
import "./AccessFacts.css";

const rows = [
  { key: "walking", icon: "directions_walk", labels: walkingLabels },
  { key: "wheelchair", icon: "accessible", labels: wheelchairLabels },
  { key: "ramps", icon: "ramp_right", labels: { ...yesNoLabels, partial: "Some ramps", yes: "Ramps", no: "No ramps noted" } },
  { key: "elevators", icon: "elevator", labels: { ...yesNoLabels, yes: "Elevators", no: "No elevator noted" } },
  { key: "restroom", icon: "wc", labels: { ...yesNoLabels, yes: "Accessible restroom", no: "No accessible restroom noted" } },
];

export default function AccessFacts({ place, compact = false }) {
  const access = accessibilityFor(place);
  const paths = pathsFor(place);

  if (compact) {
    return <span className="access-summary">{accessSummary(access)}</span>;
  }

  return (
    <div className="access-facts">
      <h3>Access</h3>
      <ul>
        {rows.map((row) => (
          <li key={row.key}>
            <span className="material-symbols-outlined" aria-hidden="true">
              {row.icon}
            </span>
            <span>{row.labels[access[row.key]] ?? yesNoLabels.unknown}</span>
          </li>
        ))}
      </ul>
      {paths.length > 0 ? (
        <div className="path-block">
          <h4>Accessible paths</h4>
          <ul className="path-chips">
            {paths.map((id) => {
              const path = PATH_TYPES[id];
              return (
                <li key={id}>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {path.icon}
                  </span>
                  {path.label}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {access.notes ? <p>{access.notes}</p> : null}
    </div>
  );
}
