import { NavLink } from 'react-router-dom';

// items: [{ label, icon, to, disabled }]. `disabled` renders a "Soon" badge
// for modules that aren't built yet, instead of a real link.
function Sidebar({ items, className = '', onNavigate }) {
  return (
    <nav className={`bg-dark text-white p-3 ${className}`} style={{ width: '240px' }}>
      <div className="fs-5 fw-semibold mb-4 px-2">Dental HMS</div>
      <ul className="nav nav-pills flex-column gap-1">
        {items.map((item) => (
          <li className="nav-item" key={item.label}>
            {item.disabled ? (
              <span
                className="nav-link text-white-50 d-flex align-items-center gap-2"
                style={{ cursor: 'not-allowed' }}
              >
                {item.icon && <i className={`bi ${item.icon}`} />}
                <span>{item.label}</span>
                <span className="badge bg-secondary ms-auto">Soon</span>
              </span>
            ) : (
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`
                }
              >
                {item.icon && <i className={`bi ${item.icon}`} />}
                <span>{item.label}</span>
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar;
