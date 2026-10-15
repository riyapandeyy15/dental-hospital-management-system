// Shimmer skeleton placeholders (.dhms-skeleton, theme.css) used while data
// is loading, instead of a single spinner - keeps the layout stable and
// gives an immediate sense of the page's real shape.

export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="row g-3">
      {Array.from({ length: count }).map((_, i) => (
        <div className="col-12 col-sm-6 col-lg-3" key={i}>
          <div className="dhms-card dhms-stat-card h-100">
            <div className="dhms-skeleton dhms-skeleton-circle" style={{ width: 48, height: 48 }} />
            <div className="flex-grow-1">
              <div className="dhms-skeleton dhms-skeleton-text" style={{ width: '50%', height: '1.5rem' }} />
              <div className="dhms-skeleton dhms-skeleton-text mb-0" style={{ width: '70%' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDoctorGrid({ count = 6 }) {
  return (
    <div className="row g-3">
      {Array.from({ length: count }).map((_, i) => (
        <div className="col-12 col-sm-6 col-lg-4" key={i}>
          <div className="dhms-card p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="dhms-skeleton dhms-skeleton-circle" style={{ width: 64, height: 64 }} />
              <div className="flex-grow-1">
                <div className="dhms-skeleton dhms-skeleton-text" style={{ width: '80%' }} />
                <div className="dhms-skeleton dhms-skeleton-text mb-0" style={{ width: '55%' }} />
              </div>
            </div>
            <div className="dhms-skeleton dhms-skeleton-text" style={{ width: '90%' }} />
            <div className="dhms-skeleton" style={{ height: 38, borderRadius: 'var(--dhms-radius-sm)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonAppointmentList({ count = 3 }) {
  return (
    <div className="d-flex flex-column gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div className="dhms-card p-4" key={i}>
          <div className="d-flex flex-wrap justify-content-between gap-3">
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="dhms-skeleton dhms-skeleton-text" style={{ width: '45%' }} />
              <div className="dhms-skeleton dhms-skeleton-text" style={{ width: '30%' }} />
              <div className="dhms-skeleton dhms-skeleton-text mb-0" style={{ width: '60%' }} />
            </div>
            <div className="dhms-skeleton" style={{ width: 90, height: 26, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ height = 200 }) {
  return <div className="dhms-card p-4"><div className="dhms-skeleton" style={{ height }} /></div>;
}

// Generic admin-table loading placeholder: a header-ish bar plus N rows of
// avatar + two text lines + a trailing badge/action pair.
export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="dhms-skeleton-table-row" key={i}>
          <div className="dhms-skeleton dhms-skeleton-circle" style={{ width: 36, height: 36 }} />
          <div style={{ flex: 1 }}>
            <div className="dhms-skeleton dhms-skeleton-text" style={{ width: '35%' }} />
            <div className="dhms-skeleton dhms-skeleton-text mb-0" style={{ width: '20%' }} />
          </div>
          {Array.from({ length: Math.max(columns - 1, 0) }).map((__, j) => (
            <div className="dhms-skeleton" key={j} style={{ width: 80, height: 14, flexShrink: 0 }} />
          ))}
          <div className="dhms-skeleton" style={{ width: 70, height: 26, borderRadius: 999, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
