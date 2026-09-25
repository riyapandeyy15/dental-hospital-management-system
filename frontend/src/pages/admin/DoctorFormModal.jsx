import { useEffect, useState } from 'react';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  specialization: '',
  qualifications: '',
  registrationNumber: '',
  experienceYears: '',
};

// Shared Add/Edit form. In edit mode the password field is hidden entirely -
// password changes are a separate, deliberate action, never a side effect
// of editing a profile.
function DoctorFormModal({ show, mode, doctor, onClose, onSubmit, apiError }) {
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;

    if (mode === 'edit' && doctor) {
      setForm({
        name: doctor.name || '',
        email: doctor.email || '',
        password: '',
        phone: doctor.phone || '',
        specialization: doctor.specialization || '',
        qualifications: (doctor.qualifications || []).join(', '),
        registrationNumber: doctor.registrationNumber || '',
        experienceYears: doctor.experienceYears ?? '',
      });
    } else {
      setForm(emptyForm);
    }
    setFieldErrors({});
  }, [show, mode, doctor]);

  if (!show) return null;

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (mode === 'add' && form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (!form.specialization.trim()) errors.specialization = 'Specialization is required.';
    if (form.experienceYears !== '' && (Number.isNaN(Number(form.experienceYears)) || Number(form.experienceYears) < 0)) {
      errors.experienceYears = 'Enter a valid number of years.';
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      specialization: form.specialization.trim(),
      qualifications: form.qualifications
        .split(',')
        .map((q) => q.trim())
        .filter(Boolean),
      registrationNumber: form.registrationNumber.trim() || undefined,
      experienceYears: form.experienceYears === '' ? undefined : Number(form.experienceYears),
    };
    if (mode === 'add') {
      payload.password = form.password;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch {
      // apiError is surfaced to the user via the `apiError` prop from the parent.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content">
            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-header">
                <h5 className="modal-title">{mode === 'add' ? 'Add Doctor' : 'Edit Doctor'}</h5>
                <button type="button" className="btn-close" onClick={onClose} disabled={isSubmitting} />
              </div>

              <div className="modal-body">
                {apiError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {apiError}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name</label>
                    <input
                      className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
                  </div>

                  {mode === 'add' && (
                    <div className="col-md-6">
                      <label className="form-label">Temporary Password</label>
                      <input
                        type="text"
                        className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="At least 8 characters"
                        disabled={isSubmitting}
                      />
                      {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
                      <div className="form-text">
                        Share this with the doctor directly - they should change it after first login.
                      </div>
                    </div>
                  )}

                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-control"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Specialization</label>
                    <input
                      className={`form-control ${fieldErrors.specialization ? 'is-invalid' : ''}`}
                      value={form.specialization}
                      onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.specialization && (
                      <div className="invalid-feedback">{fieldErrors.specialization}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Experience (years)</label>
                    <input
                      type="number"
                      min="0"
                      className={`form-control ${fieldErrors.experienceYears ? 'is-invalid' : ''}`}
                      value={form.experienceYears}
                      onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.experienceYears && (
                      <div className="invalid-feedback">{fieldErrors.experienceYears}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Registration / License Number</label>
                    <input
                      className="form-control"
                      value={form.registrationNumber}
                      onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Qualifications (comma-separated)</label>
                    <input
                      className="form-control"
                      value={form.qualifications}
                      onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                      placeholder="BDS, MDS"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Saving...
                    </>
                  ) : mode === 'add' ? (
                    'Add Doctor'
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default DoctorFormModal;
