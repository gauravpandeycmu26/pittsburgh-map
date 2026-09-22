export function toggleCategorySet(current, id) {
  const next = new Set(current);
  if (next.has(id)) {
    if (next.size === 1) return current;
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}
