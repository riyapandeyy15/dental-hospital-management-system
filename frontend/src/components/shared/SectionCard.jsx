function SectionCard({ title, subtitle, actions, children, className = '', bodyClassName = 'p-4' }) {
  return (
    <div className={`dhms-card ${className}`}>
      {(title || actions) && (
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 px-4 pt-4">
          <div>
            {title && <h3 className="h6 fw-semibold mb-0">{title}</h3>}
            {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

export default SectionCard;
