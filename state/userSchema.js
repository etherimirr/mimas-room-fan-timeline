export function createDefaultUserState(serverNow, id) {
  return {
    id,
    first_seen_at: serverNow,
    last_seen_at: serverNow,
    visit_count: 0,
    loop: 1,
    flags: {},
    read_entries: [],
    unlocked_entries: [],
    current_branch: "main",
    display_name: "",
    event_log: []
  };
}

export function normalizeUserState(parsed, fallbackNow) {
  return {
    ...createDefaultUserState(parsed.first_seen_at ?? fallbackNow, parsed.id ?? createId()),
    ...parsed
  };
}

export function createId() {
  return `fan_${Math.random().toString(36).slice(2, 10)}`;
}
