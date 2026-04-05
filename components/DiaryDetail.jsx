import GlitchText from "@/components/GlitchText";

export default function DiaryDetail({ entry, user }) {
  if (!entry) {
    return (
      <article className="panel pad detail-panel">
        <p className="hint">还没有可阅读的日记。</p>
      </article>
    );
  }

  const body = entry.presentation?.glitch ? (
    <GlitchText text={entry.content} />
  ) : (
    entry.content
  );

  return (
    <article className="panel pad detail-panel">
      <div className="detail-kicker">diary page</div>
      <h2>{entry.title}</h2>
      <div className="detail-meta">
        <span>{entry.metaLabel}</span>
        <span>{user.read_entries.includes(entry.id) ? "已读" : "未读"}</span>
      </div>
      <p className="detail-copy">{body}</p>
      {entry.hiddenText ? <p className="detail-hidden">{entry.hiddenText}</p> : null}
      {entry.flagsPreview ? <p className="detail-footnote">{entry.flagsPreview}</p> : null}
    </article>
  );
}
