import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import { dashboardPathForRole } from '../../utils/constants.js';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Full name is required.';
    if (!form.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (!form.phone.trim()) errors.phone = 'Phone number is required.';
    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setApiError('');

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const newUser = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      navigate(dashboardPathForRole(newUser.role), { replace: true });
    } catch (err) {
      if (err.response?.status === 409) {
        setApiError(err.response.data?.message || 'An account with these details already exists.');
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
          <i className="bi bi-person-heart display-1 opacity-25 mb-4 d-block" aria-hidden="true" />
          <h1 className="h2 fw-bold mb-3">Join DentiFlow and take control of your dental care.</h1>
          <p className="text-white-50 mb-0" style={{ maxWidth: 420 }}>
            Create an account to find dentists, book appointments and keep track of your visits -
            all in one place.
          </p>
        </div>

        <p className="text-white-50 small mb-0">&copy; {new Date().getFullYear()} DentiFlow</p>
      </div>

      <div
        className="d-flex align-items-center justify-content-center flex-grow-1 p-4"
        style={{ background: 'var(--dhms-bg)' }}
      >
        <div className="w-100" style={{ maxWidth: '440px' }}>
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
            <h2 className="h4 fw-bold mb-1">Create your account</h2>
            <p className="text-muted small mb-4">Book appointments and manage your dental care.</p>

            {apiError && (
              <div className="alert alert-danger py-2 d-flex align-items-center gap-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="name" className="form-label fw-medium">
                  Full Name
                </label>
                <input
                  id="name"
                  className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={isSubmitting}
                />
                {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="username"
                  disabled={isSubmitting}
                />
                {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="phone" className="form-label fw-medium">
                  Phone
                </label>
                <input
                  id="phone"
                  className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={isSubmitting}
                />
                {fieldErrors.phone && <div className="invalid-feedback">{fieldErrors.phone}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label fw-medium">
                  Password
                </label>
                <div className="input-group">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="new-password"
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
                <div className="form-text">At least 8 characters.</div>
              </div>

              <div className="mb-4">
                <label htmlFor="confirmPassword" className="form-label fw-medium">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                {fieldErrors.confirmPassword && <div className="invalid-feedback">{fieldErrors.confirmPassword}</div>}
              </div>

              <button
                type="submit"
                className="dhms-btn-gradient btn text-white w-100 py-2 fw-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>

          <p className="text-muted small text-center mt-4 mb-0">
            Already have an account?{' '}
            <Link to="/login" className="fw-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
