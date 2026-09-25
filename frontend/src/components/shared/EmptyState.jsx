function EmptyState({ icon = 'bi-inbox', title = 'Nothing here yet', message }) {
  return (
    <div className="text-center py-5">
      <div
        className="dhms-stat-icon mx-auto mb-3"
        style={{ width: 56, height: 56, fontSize: '1.5rem', background: 'var(--dhms-primary-light)', color: 'var(--dhms-primary-dark)' }}
      >
        <i className={`bi ${icon}`} />
      </div>
      <p className="fw-semibold mb-1">{title}</p>
      {message && <p className="text-muted small mb-0">{message}</p>}
    </div>
  );
}

export default EmptyState;
