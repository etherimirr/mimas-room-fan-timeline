import { createDefaultUserState, createId, normalizeUserState } from "@/state/userSchema";

const STORAGE_KEY = "fan-timeline-user-v2";

export function createUserState(serverNow) {
  return createDefaultUserState(serverNow, createId());
}

export function loadUserState() {
  const storage = getBrowserStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeUserState(parsed, new Date().toISOString());
  } catch {
    return null;
  }
}

export function saveUserState(user) {
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const storage = window.localStorage;
  if (!storage) {
    return null;
  }

  if (typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
    return null;
  }

  return storage;
}
