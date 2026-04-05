import { formatElapsedHours } from "@/lib/time";

export default function StatusPanel({ user, serverNow, eventLogs }) {
  const visitorLabel = user.display_name || `麻粉${formatFanSuffix(user.id)}`;

  return (
    <div className="status-grid">
      <div className="status-card">
        <span>visitor</span>
        <strong>{visitorLabel}</strong>
      </div>
      <div className="status-card">
        <span>first visit</span>
        <strong>{new Date(user.first_seen_at).toLocaleString()}</strong>
      </div>
      <div className="status-card">
        <span>since then</span>
        <strong>{formatElapsedHours(user.first_seen_at, serverNow)}</strong>
      </div>
      <div className="status-card">
        <span>nickname</span>
        <strong>{user.display_name || "还没有留下名字"}</strong>
      </div>
      <div className="status-card">
        <span>read pages</span>
        <strong>{user.read_entries.length}</strong>
      </div>
      <div className="status-card">
        <span>visits</span>
        <strong>{user.visit_count}</strong>
      </div>
      <div className="status-card">
        <span>latest note</span>
        <strong>{eventLogs[0] ?? "谢谢你来看我"}</strong>
      </div>
    </div>
  );
}

function formatFanSuffix(id) {
  const suffix = String(id ?? "")
    .replace(/^fan_/, "")
    .slice(0, 6);

  return suffix || "000000";
}
