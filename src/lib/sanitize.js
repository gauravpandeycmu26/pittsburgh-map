const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function safeCssColor(color, fallback = "#e9c349") {
  return typeof color === "string" && HEX_COLOR.test(color.trim()) ? color.trim() : fallback;
}

export function clampText(value, max) {
  return String(value ?? "").trim().slice(0, max);
}
