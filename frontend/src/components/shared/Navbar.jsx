import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="dhms-topbar navbar navbar-expand-lg py-3">
      <div className="container">
        <Link className="navbar-brand dhms-brand-wordmark fw-bold d-flex align-items-center gap-2" to="/">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
            style={{ width: 34, height: 34, background: 'var(--dhms-primary)' }}
          >
            <i className="bi bi-heart-pulse-fill text-white small" />
          </div>
          DentiFlow
        </Link>
        <div className="d-flex gap-2">
          <Link to="/login" className="btn btn-outline-primary btn-sm">
            Sign In
          </Link>
          <Link to="/register" className="dhms-btn-gradient btn btn-sm text-white">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
