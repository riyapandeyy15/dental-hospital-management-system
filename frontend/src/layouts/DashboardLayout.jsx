import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/shared/Sidebar.jsx';
import Avatar from '../components/shared/Avatar.jsx';

function roleLabel(role) {
  return role === 'ADMIN' ? 'Administrator' : 'Doctor';
}

// Shared shell for the Admin and Doctor dashboards: a fixed dark sidebar on
// desktop (brand at top, nav in the middle, account + logout at the
// bottom), an offcanvas version of the same sidebar on mobile, and a light
// header with the page title and the signed-in user. AdminLayout /
// DoctorLayout just supply their own nav items, title and subtitle.
function DashboardLayout({ title, subtitle, navItems, offcanvasId, children }) {
  const { user, logout } = useAuth();

  const brand = (
    <div className="dhms-sidebar-brand d-flex align-items-center gap-2">
      <div
        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
        style={{ width: 36, height: 36, background: 'var(--dhms-primary)' }}
      >
        <i className="bi bi-heart-pulse-fill text-white" />
      </div>
      <div>
        <div className="text-white fw-semibold" style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>
          Dental HMS
        </div>
        <div className="text-white-50" style={{ fontSize: '0.68rem' }}>
          Hospital Management
        </div>
      </div>
    </div>
  );

  const accountFooter = (
    <div className="dhms-sidebar-footer">
      <div className="d-flex align-items-center gap-2 mb-3">
        <Avatar name={user?.name} />
        <div className="text-truncate">
          <div className="text-white text-truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {user?.name}
          </div>
          <div className="text-white-50" style={{ fontSize: '0.72rem' }}>
            {roleLabel(user?.role)}
          </div>
        </div>
      </div>
      <button
        className="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
        type="button"
        onClick={logout}
      >
        <i className="bi bi-box-arrow-right" />
        Logout
      </button>
    </div>
  );

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <div className="dhms-sidebar d-none d-md-flex flex-column flex-shrink-0" style={{ width: 260 }}>
        {brand}
        <Sidebar items={navItems} className="flex-grow-1" />
        {accountFooter}
      </div>

      {/* Mobile sidebar (Bootstrap offcanvas) */}
      <div
        className="offcanvas offcanvas-start dhms-sidebar d-flex flex-column"
        tabIndex="-1"
        id={offcanvasId}
        aria-labelledby={`${offcanvasId}Label`}
        style={{ width: 260 }}
      >
        <div className="d-flex align-items-center justify-content-between px-2">
          {brand}
          <button
            type="button"
            className="btn-close btn-close-white me-2"
            data-bs-dismiss="offcanvas"
            aria-label="Close navigation menu"
          />
        </div>
        <Sidebar items={navItems} className="flex-grow-1" dismissOffcanvas />
        {accountFooter}
      </div>

      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <header className="dhms-topbar d-flex align-items-center justify-content-between px-3 px-md-4 py-3">
          <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
            <button
              className="btn btn-outline-secondary d-md-none flex-shrink-0"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target={`#${offcanvasId}`}
              aria-controls={offcanvasId}
              aria-label="Open navigation menu"
            >
              <i className="bi bi-list" />
            </button>
            <div className="text-truncate">
              <h1 className="h5 mb-0 text-truncate">{title}</h1>
              {subtitle && <p className="text-muted small mb-0 d-none d-sm-block text-truncate">{subtitle}</p>}
            </div>
          </div>

          <div className="d-none d-sm-flex align-items-center gap-2 flex-shrink-0">
            <Avatar name={user?.name} />
            <div className="text-end">
              <div className="fw-medium" style={{ fontSize: '0.875rem', lineHeight: 1.2 }}>
                {user?.name}
              </div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                {roleLabel(user?.role)}
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 p-md-4 flex-grow-1 dhms-page-transition" style={{ minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
