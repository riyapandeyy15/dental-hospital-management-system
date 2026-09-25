import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../utils/constants.js';

function dashboardPathForRole(role) {
  if (role === ROLES.ADMIN) return '/admin/dashboard';
  if (role === ROLES.DOCTOR) return '/doctor/dashboard';
  return '/';
}

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setApiError('');

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      const redirectTo = location.state?.from || dashboardPathForRole(loggedInUser.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        setApiError(err.response.data?.message || 'Invalid email or password.');
      } else if (err.response?.data?.message) {
        setApiError(err.response.data.message);
      } else if (err.request) {
        setApiError('Could not reach the server. Please check your connection and try again.');
      } else {
        setApiError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Brand panel - hidden on small screens, shown from lg upward */}
      <div
        className="dhms-hero-gradient d-none d-lg-flex flex-column justify-content-between text-white p-5"
        style={{ width: '44%' }}
      >
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
            style={{ width: 40, height: 40, background: 'var(--dhms-primary)' }}
          >
            <i className="bi bi-heart-pulse-fill fs-5" />
          </div>
          <span className="dhms-brand-wordmark fs-4">DentiFlow</span>
        </div>

        <div>
          <i className="bi bi-clipboard2-pulse display-1 opacity-25 mb-4 d-block" aria-hidden="true" />
          <h1 className="h2 fw-bold mb-3" style={{ lineHeight: 1.25 }}>
            Complete Dental Care.
            <br />
            Organized. In one place.
          </h1>
          <p className="text-white-50 mb-0" style={{ maxWidth: 420 }}>
            Manage doctors, appointments and patient records securely - built for hospital
            administrators and dental professionals.
          </p>
        </div>

        <p className="text-white-50 small mb-0">&copy; {new Date().getFullYear()} DentiFlow</p>
      </div>

      {/* Form panel */}
      <div
        className="position-relative d-flex align-items-center justify-content-center flex-grow-1 p-4"
        style={{ background: 'var(--dhms-bg)' }}
      >
        {/* Purely decorative background icons - aria-hidden, no interaction */}
        <div className="dhms-bg-iconography" aria-hidden="true">
          <i className="bi bi-heart-pulse" style={{ fontSize: '9rem', top: '8%', left: '8%', transform: 'rotate(-12deg)' }} />
          <i className="bi bi-shield-plus" style={{ fontSize: '6rem', top: '65%', left: '4%', transform: 'rotate(8deg)' }} />
          <i className="bi bi-clipboard2-pulse" style={{ fontSize: '7rem', top: '12%', right: '6%', transform: 'rotate(10deg)' }} />
          <i className="bi bi-activity" style={{ fontSize: '5rem', bottom: '10%', right: '10%', transform: 'rotate(-6deg)' }} />
          <i className="bi bi-bandaid" style={{ fontSize: '4.5rem', bottom: '30%', left: '18%', transform: 'rotate(20deg)' }} />
        </div>

        <div className="position-relative w-100" style={{ maxWidth: '420px', zIndex: 1 }}>
          <div className="text-center mb-4 d-lg-none">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
              style={{ width: 48, height: 48, background: 'var(--dhms-primary-light)', color: 'var(--dhms-primary-dark)' }}
            >
              <i className="bi bi-heart-pulse-fill fs-4" />
            </div>
            <h1 className="dhms-brand-wordmark h4 fw-bold mb-0">DentiFlow</h1>
          </div>

          <div className="dhms-card p-4 p-md-5" style={{ borderRadius: 'var(--dhms-radius-lg)', boxShadow: 'var(--dhms-shadow-lg)' }}>
            <h2 className="h4 fw-bold mb-1">Welcome back</h2>
            <p className="text-muted small mb-4">Sign in to access your dashboard.</p>

            {apiError && (
              <div className="alert alert-danger py-2 d-flex align-items-center gap-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-medium">
                  Email
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-envelope text-muted" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                  />
                  {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label fw-medium">
                  Password
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-lock text-muted" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                  {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
                </div>
              </div>

              <div className="d-flex justify-content-end mb-3">
                <button
                  type="button"
                  className="btn btn-link p-0 small text-decoration-none"
                  onClick={(e) => e.preventDefault()}
                  title="Password reset isn't available yet"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="dhms-btn-gradient btn text-white w-100 py-2 fw-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          <p className="text-muted small text-center mt-4 mb-0">Admin and Doctor access only.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
