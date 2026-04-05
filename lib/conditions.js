import { getElapsedHours, isNightTime } from "@/lib/time";

export function checkEventConditions(conditions = {}, user, now) {
  if (conditions.min_visit_count && user.visit_count < conditions.min_visit_count) {
    return false;
  }

  if (conditions.requires_flags?.length) {
    const hasFlags = conditions.requires_flags.every((flag) => Boolean(user.flags[flag]));
    if (!hasFlags) {
      return false;
    }
  }

  if (conditions.only_at_night && !isNightTime(now)) {
    return false;
  }

  return true;
}

export function isEntryUnlocked(entry, user, now) {
  if ((entry.loop_required ?? 1) > user.loop) {
    return false;
  }

  if (entry.excludes_flags?.length) {
    const hasExcludedFlag = entry.excludes_flags.some((flag) => Boolean(user.flags[flag]));
    if (hasExcludedFlag) {
      return false;
    }
  }

  if (entry.unlock_after_hours) {
    const elapsedHours = getElapsedHours(user.first_seen_at, now);
    if (elapsedHours < entry.unlock_after_hours) {
      return false;
    }
  }

  if (entry.requires_flags?.length) {
    const hasFlags = entry.requires_flags.every((flag) => Boolean(user.flags[flag]));
    if (!hasFlags) {
      return false;
    }
  }

  if (entry.only_at_night && !isNightTime(now)) {
    return false;
  }

  if (user.unlocked_entries?.includes(entry.id)) {
    return true;
  }

  return true;
}

export function resolveEntryContent(entry, now) {
  if (entry.variants?.night && isNightTime(now)) {
    return entry.variants.night;
  }

  if (entry.variants?.default) {
    return entry.variants.default;
  }

  return entry.content;
}
