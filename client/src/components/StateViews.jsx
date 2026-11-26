/** Shared loading / empty / error views so every screen handles the four states the same way. */

export function Loading({ label = 'Đang tải…' }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="state">
      <p className="state-title">{title}</p>
      {message && <p className="muted">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <p className="state-title">Không tải được dữ liệu</p>
      <p>{message}</p>
      {onRetry && <button className="btn btn-secondary" onClick={onRetry}>Thử lại</button>}
    </div>
  );
}

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  return <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>{children}</div>;
}
