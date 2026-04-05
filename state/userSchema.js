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
  const safeParsed = parsed && typeof parsed === "object" ? parsed : {};
  const defaultState = createDefaultUserState(
    safeParsed.first_seen_at ?? fallbackNow,
    safeParsed.id ?? createId()
  );

  return {
    ...defaultState,
    ...safeParsed,
    visit_count: typeof safeParsed.visit_count === "number" ? safeParsed.visit_count : 0,
    loop: typeof safeParsed.loop === "number" ? safeParsed.loop : 1,
    flags: isPlainObject(safeParsed.flags) ? safeParsed.flags : {},
    read_entries: Array.isArray(safeParsed.read_entries) ? safeParsed.read_entries : [],
    unlocked_entries: Array.isArray(safeParsed.unlocked_entries)
      ? safeParsed.unlocked_entries
      : [],
    current_branch:
      typeof safeParsed.current_branch === "string" && safeParsed.current_branch
        ? safeParsed.current_branch
        : "main",
    display_name: typeof safeParsed.display_name === "string" ? safeParsed.display_name : "",
    event_log: Array.isArray(safeParsed.event_log) ? safeParsed.event_log : []
  };
}

export function createId() {
  return `fan_${Math.random().toString(36).slice(2, 10)}`;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
