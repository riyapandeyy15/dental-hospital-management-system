// isPlaceholder defaults to true because no dashboard-statistics API exists
// yet for that metric - every placeholder card must be visibly marked so it
// is never mistaken for a real number.
function StatCard({
  label,
  value,
  icon,
  iconBg = 'var(--dhms-primary-light)',
  iconColor = 'var(--dhms-primary-dark)',
  isPlaceholder = true,
}) {
  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div className="dhms-card dhms-card--hover dhms-stat-card h-100">
        <div className="dhms-stat-icon" style={{ background: iconBg, color: iconColor }}>
          {icon && <i className={`bi ${icon}`} />}
        </div>
        <div className="flex-grow-1">
          <div className="dhms-stat-value">{value}</div>
          <div className="dhms-stat-label">{label}</div>
          {isPlaceholder && (
            <span className="dhms-badge dhms-badge-warning mt-2" style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}>
              Placeholder
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
