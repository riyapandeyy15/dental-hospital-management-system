import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/shared/Sidebar.jsx';
import DashboardHeader from '../components/shared/DashboardHeader.jsx';

// Shared shell for the Admin and Doctor dashboards: a fixed sidebar on
// desktop, an offcanvas sidebar on mobile, and a header with the logged-in
// user's name and a logout button. AdminLayout/DoctorLayout just supply
// their own title and nav items.
function DashboardLayout({ title, navItems, offcanvasId, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar items={navItems} className="d-none d-md-flex flex-column" />

      <div
        className="offcanvas offcanvas-start bg-dark"
        tabIndex="-1"
        id={offcanvasId}
        aria-labelledby={`${offcanvasId}Label`}
      >
        <div className="offcanvas-header">
          <span className="text-white fs-5" id={`${offcanvasId}Label`}>
            Dental HMS
          </span>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body p-0">
          <Sidebar items={navItems} data-bs-dismiss="offcanvas" />
        </div>
      </div>

      <div className="flex-grow-1 d-flex flex-column">
        <DashboardHeader
          title={title}
          userName={user?.name}
          onLogout={logout}
          offcanvasTargetId={offcanvasId}
        />
        <main className="p-3 p-md-4 flex-grow-1 bg-light">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
