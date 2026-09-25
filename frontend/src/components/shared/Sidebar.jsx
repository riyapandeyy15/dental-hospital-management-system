import { NavLink } from 'react-router-dom';

// items: [{ label, icon, to, disabled }]. `disabled` renders a "Soon" badge
// for modules that aren't built yet, instead of a real link.
// `dismissOffcanvas`: true when this instance renders inside the mobile
// offcanvas drawer, so tapping a link also closes the drawer.
function Sidebar({ items, className = '', dismissOffcanvas = false }) {
  return (
    <nav className={className}>
      <ul className="nav flex-column gap-1 p-3 mb-0">
        {items.map((item) => (
          <li className="nav-item" key={item.label}>
            {item.disabled ? (
              <span className="dhms-sidebar-link disabled">
                {item.icon && <i className={`bi ${item.icon}`} />}
                <span className="flex-grow-1">{item.label}</span>
                <span className="badge bg-white bg-opacity-10 text-white-50 fw-normal">Soon</span>
              </span>
            ) : (
              <NavLink
                to={item.to}
                {...(dismissOffcanvas ? { 'data-bs-dismiss': 'offcanvas' } : {})}
                className={({ isActive }) => `dhms-sidebar-link ${isActive ? 'active' : ''}`}
              >
                {item.icon && <i className={`bi ${item.icon}`} />}
                <span className="flex-grow-1">{item.label}</span>
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar;
