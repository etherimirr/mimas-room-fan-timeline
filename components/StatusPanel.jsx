import { formatElapsedHours } from "@/lib/time";

export default function StatusPanel({ user, serverNow, eventLogs }) {
  return (
    <div className="status-grid">
      <div className="status-card">
        <span>visitor</span>
        <strong>{user.id}</strong>
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
        <strong>{user.display_name || "guest"}</strong>
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
