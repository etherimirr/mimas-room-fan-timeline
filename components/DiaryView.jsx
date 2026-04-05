export default function DiaryView({
  entries,
  user,
  selectedEntryId,
  onOpenEntry
}) {
  return (
    <section className="diary-list">
      {entries.map((entry) => {
        const isUnread = !user.read_entries.includes(entry.id);
        const isSelected = selectedEntryId === entry.id;

        return (
          <button
            className={`entry panel entry-button${isSelected ? " selected" : ""}`}
            key={entry.id}
            onClick={() => onOpenEntry(entry.id)}
            type="button"
          >
            <header>
              <h2>{entry.title}</h2>
              <small>{entry.metaLabel}</small>
            </header>
            <p>{entry.summary ?? entry.content}</p>
            <div className="meta">
              {isUnread ? "新内容" : "已读"} · 分支 {entry.branch ?? "main"} · 周目{" "}
              {entry.loop_required ?? 1}
            </div>
          </button>
        );
      })}
    </section>
  );
}
