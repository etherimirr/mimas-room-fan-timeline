import Image from "next/image";

export default function DiaryView({
  featuredEntry,
  entries,
  user,
  selectedEntryId,
  onOpenEntry
}) {
  return (
    <section className="diary-list">
      {featuredEntry ? (
        <button
          className={`entry panel entry-button${selectedEntryId === featuredEntry.id ? " selected" : ""}`}
          onClick={() => onOpenEntry(featuredEntry.id)}
          type="button"
        >
          <header>
            <h2>{featuredEntry.title}</h2>
            <small>{featuredEntry.metaLabel}</small>
          </header>
          {featuredEntry.thumbnail ? (
            <div className="entry-thumbnail">
              <Image
                src={featuredEntry.thumbnail}
                alt={featuredEntry.thumbnailAlt ?? featuredEntry.title}
                fill
                sizes="(max-width: 900px) 100vw, 280px"
                className="entry-thumbnail-image"
              />
            </div>
          ) : null}
          <p>{featuredEntry.summary ?? featuredEntry.content}</p>
          <div className="meta">next live · {featuredEntry.metaLabel}</div>
        </button>
      ) : null}
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
            {entry.thumbnail ? (
              <div className="entry-thumbnail">
                <Image
                  src={entry.thumbnail}
                  alt={entry.thumbnailAlt ?? entry.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 280px"
                  className="entry-thumbnail-image"
                />
              </div>
            ) : null}
            <p>{entry.summary ?? entry.content}</p>
            <div className="meta">
              {isUnread ? "new" : "read"} · {entry.metaLabel}
            </div>
          </button>
        );
      })}
    </section>
  );
}
