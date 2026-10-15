import { Link } from 'react-router-dom';

// actionLabel + actionTo renders a Link CTA; actionLabel + onAction renders a
// button CTA instead. Omit both for a message-only empty state (the default,
// used unchanged by every existing caller).
function EmptyState({ icon = 'bi-inbox', title = 'Nothing here yet', message, actionLabel, actionTo, onAction }) {
  return (
    <div className="text-center py-5 dhms-stagger-in">
      <div
        className="dhms-stat-icon mx-auto mb-3"
        style={{ width: 56, height: 56, fontSize: '1.5rem', background: 'var(--dhms-primary-light)', color: 'var(--dhms-primary-dark)' }}
      >
        <i className={`bi ${icon}`} />
      </div>
      <p className="fw-semibold mb-1">{title}</p>
      {message && <p className="text-muted small mb-0">{message}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary btn-sm mt-3 d-inline-flex align-items-center gap-2">
          <i className="bi bi-arrow-right-circle" />
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button type="button" className="btn btn-primary btn-sm mt-3 d-inline-flex align-items-center gap-2" onClick={onAction}>
          <i className="bi bi-arrow-clockwise" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
