import { checkEventConditions, isEntryUnlocked, resolveEntryContent } from "@/lib/conditions";

export function getUnlockedEntries(entries, user, now) {
  return entries
    .filter((entry) => isEntryUnlocked(entry, user, now))
    .map((entry) => ({
      ...entry,
      content: interpolateContent(resolveEntryContent(entry, now), user),
      summary: interpolateContent(entry.summary ?? resolveEntryContent(entry, now), user),
      flagsPreview: getFlagsPreview(user, entry)
    }));
}

export function applyEventEffects(user, triggerName, events, now, payload = {}) {
  const baseUser = {
    ...user,
    last_seen_at: now,
    visit_count: triggerName === "page_view" ? user.visit_count + 1 : user.visit_count,
    event_log: [...(user.event_log ?? [])],
    unlocked_entries: [...(user.unlocked_entries ?? [])]
  };

  return events.reduce((currentUser, event) => {
    if (event.trigger !== triggerName) {
      return currentUser;
    }

    if (!checkEventConditions(event.conditions, currentUser, now)) {
      return currentUser;
    }

    return event.effects.reduce((nextUser, effect) => {
      if (effect.type === "set_flag") {
        return {
          ...nextUser,
          flags: {
            ...nextUser.flags,
            [effect.flag]: effect.value
          }
        };
      }

      if (effect.type === "remember_comment") {
        return {
          ...nextUser,
          flags: {
            ...nextUser.flags,
            last_comment_preview: payload.comment ?? ""
          }
        };
      }

      if (effect.type === "advance_loop") {
        return {
          ...nextUser,
          loop: nextUser.loop + (effect.amount ?? 1)
        };
      }

      if (effect.type === "unlock_entry") {
        return {
          ...nextUser,
          unlocked_entries: dedupe([...nextUser.unlocked_entries, effect.entry_id])
        };
      }

      if (effect.type === "switch_branch") {
        return {
          ...nextUser,
          current_branch: effect.branch
        };
      }

      if (effect.type === "log") {
        return {
          ...nextUser,
          event_log: [effect.message, ...nextUser.event_log].slice(0, 6)
        };
      }

      return nextUser;
    }, currentUser);
  }, baseUser);
}

export function getVisibleEventLogs(eventLog) {
  return eventLog.filter(Boolean).slice(0, 4);
}

export function markEntryAsRead(user, entryId) {
  if (user.read_entries.includes(entryId)) {
    return user;
  }

  return {
    ...user,
    read_entries: [...user.read_entries, entryId]
  };
}

function interpolateContent(content, user) {
  const fanName = user.display_name || "陌生粉丝";
  return content.replaceAll("{{display_name}}", fanName);
}

function getFlagsPreview(user, entry) {
  if (entry.requires_flags?.length) {
    return `已命中条件：${entry.requires_flags.join(" / ")}`;
  }

  if (user.flags.last_comment_preview) {
    return `你上次留下的话是：“${user.flags.last_comment_preview}”`;
  }

  return "";
}

function dedupe(items) {
  return [...new Set(items)];
}
