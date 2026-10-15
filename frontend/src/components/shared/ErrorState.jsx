// Professional replacement for a raw `alert-danger` block - used where a
// whole section failed to load and needs a Retry action, not just a message.
function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="dhms-error-state dhms-stagger-in">
      <div className="dhms-stat-icon mx-auto mb-3" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
        <i className="bi bi-exclamation-triangle-fill" />
      </div>
      <p className="fw-semibold mb-1">Couldn't load this</p>
      <p className="text-muted small mb-0">{message}</p>
      {onRetry && (
        <button className="btn btn-outline-secondary btn-sm mt-3" type="button" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise me-1" />
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;
