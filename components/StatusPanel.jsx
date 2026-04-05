import { formatElapsedHours } from "@/lib/time";

export default function StatusPanel({ user, serverNow, eventLogs }) {
  return (
    <div className="status-grid">
      <div className="status-card">
        <span>粉丝编号</span>
        <strong>{user.id}</strong>
      </div>
      <div className="status-card">
        <span>首次进入</span>
        <strong>{new Date(user.first_seen_at).toLocaleString()}</strong>
      </div>
      <div className="status-card">
        <span>已过去</span>
        <strong>{formatElapsedHours(user.first_seen_at, serverNow)}</strong>
      </div>
      <div className="status-card">
        <span>当前周目</span>
        <strong>Loop {user.loop}</strong>
      </div>
      <div className="status-card">
        <span>已触发 Flags</span>
        <strong>{Object.keys(user.flags).length}</strong>
      </div>
      <div className="status-card">
        <span>当前分支</span>
        <strong>{user.current_branch}</strong>
      </div>
      <div className="status-card">
        <span>最近回响</span>
        <strong>{eventLogs[0] ?? "系统还在观察你"}</strong>
      </div>
    </div>
  );
}
