function DashboardHeader({ title, userName, onLogout, offcanvasTargetId }) {
  return (
    <header className="bg-white border-bottom d-flex align-items-center justify-content-between px-3 px-md-4 py-3">
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-outline-secondary d-md-none"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target={`#${offcanvasTargetId}`}
          aria-controls={offcanvasTargetId}
        >
          <i className="bi bi-list" />
        </button>
        <h1 className="h5 mb-0">{title}</h1>
      </div>

      <div className="d-flex align-items-center gap-3">
        <span className="text-muted d-none d-sm-inline">{userName}</span>
        <button className="btn btn-outline-danger btn-sm" type="button" onClick={onLogout}>
          <i className="bi bi-box-arrow-right me-1" />
          Logout
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
