// isPlaceholder defaults to true because no dashboard-statistics API exists
// yet - every card must be visibly marked so it's never mistaken for a real
// number.
function StatCard({ label, value, icon, isPlaceholder = true }) {
  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div className="card shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="fs-3 text-primary">{icon && <i className={`bi ${icon}`} />}</div>
          <div>
            <div className="fs-4 fw-semibold">{value}</div>
            <div className="text-muted small">{label}</div>
            {isPlaceholder && (
              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle mt-1">
                Placeholder
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatCard;
