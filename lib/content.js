export function getDefaultSelectedEntryId(entries, currentId) {
  if (!entries.length) {
    return null;
  }

  if (currentId && entries.some((entry) => entry.id === currentId)) {
    return currentId;
  }

  return entries[0].id;
}
