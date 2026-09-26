import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPathForRole } from '../utils/constants.js';

function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="d-flex align-items-center justify-content-center bg-light" style={{ minHeight: '100vh' }}>
      <div className="text-center p-4">
        <div className="fs-1 text-danger mb-3">
          <i className="bi bi-shield-lock" />
        </div>
        <h1 className="h4 mb-2">Access denied</h1>
        <p className="text-muted mb-4">
          You do not have permission to access the page you requested.
        </p>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => navigate(dashboardPathForRole(user?.role), { replace: true })}
        >
          Go to my dashboard
        </button>
      </div>
    </div>
  );
}

export default Unauthorized;
