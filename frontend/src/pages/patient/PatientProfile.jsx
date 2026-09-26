import { useEffect, useState } from 'react';

import PatientLayout from '../../layouts/PatientLayout.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as patientPortalService from '../../api/patientPortalService.js';

const emptyForm = { name: '', phone: '', email: '', address: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '' };

function PatientProfile() {
  const toast = useToast();

  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function load() {
    setIsLoading(true);
    setLoadError('');
    patientPortalService
      .getMyProfile()
      .then((result) => {
        setPatient(result);
        setForm({
          name: result.name || '',
          phone: result.phone || '',
          email: result.email || '',
          address: result.address || '',
          emergencyName: result.emergencyContact?.name || '',
          emergencyPhone: result.emergencyContact?.phone || '',
          emergencyRelation: result.emergencyContact?.relation || '',
        });
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load your profile.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.phone.trim()) errors.phone = 'Phone is required.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    return errors;
  }

  async function handleSave(event) {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setApiError('');
    setIsSaving(true);
    try {
      const updated = await patientPortalService.updateMyProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim(),
        emergencyContact: {
          name: form.emergencyName.trim(),
          phone: form.emergencyPhone.trim(),
          relation: form.emergencyRelation.trim(),
        },
      });
      setPatient(updated);
      setIsEditing(false);
      toast.success('Profile updated successfully.');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PatientLayout title="My Profile" subtitle="View and manage your personal information.">
      {isLoading ? (
        <LoadingState message="Loading your profile..." />
      ) : loadError ? (
        <div className="alert alert-danger d-flex align-items-start gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill mt-1" />
          <div>{loadError}</div>
        </div>
      ) : (
        <>
          <div className="dhms-card p-4 mb-4">
            <div className="d-flex align-items-center gap-3">
              <Avatar name={patient.name} size="lg" />
              <div>
                <h2 className="h5 fw-semibold mb-1">{patient.name}</h2>
                <p className="text-muted mb-0">{patient.phone}</p>
              </div>
              {!isEditing && (
                <button className="btn btn-outline-primary ms-auto" type="button" onClick={() => setIsEditing(true)}>
                  <i className="bi bi-pencil me-1" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="dhms-card p-4 p-md-5">
              {apiError && (
                <div className="alert alert-danger py-2 d-flex align-items-center gap-2" role="alert">
                  <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={isSaving}
                  />
                  {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={isSaving}
                  />
                  {fieldErrors.phone && <div className="invalid-feedback">{fieldErrors.phone}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={isSaving}
                  />
                  {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Address</label>
                  <input
                    className="form-control"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <h3 className="h6 fw-semibold text-uppercase text-muted mb-3" style={{ letterSpacing: '0.04em' }}>
                Emergency Contact
              </h3>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={form.emergencyName}
                    onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Relation</label>
                  <input
                    className="form-control"
                    value={form.emergencyRelation}
                    onChange={(e) => setForm({ ...form, emergencyRelation: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-outline-secondary" disabled={isSaving} onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="row g-4">
              <div className="col-md-6">
                <div className="dhms-card p-4 h-100">
                  <h3 className="h6 fw-semibold text-uppercase text-muted mb-3" style={{ letterSpacing: '0.04em' }}>
                    Contact Information
                  </h3>
                  <dl className="mb-0">
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <dt className="text-muted fw-normal">Phone</dt>
                      <dd className="mb-0">{patient.phone}</dd>
                    </div>
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <dt className="text-muted fw-normal">Email</dt>
                      <dd className="mb-0">{patient.email || '—'}</dd>
                    </div>
                    <div className="d-flex justify-content-between py-2">
                      <dt className="text-muted fw-normal">Address</dt>
                      <dd className="mb-0 text-end">{patient.address || '—'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="col-md-6">
                <div className="dhms-card p-4 h-100">
                  <h3 className="h6 fw-semibold text-uppercase text-muted mb-3" style={{ letterSpacing: '0.04em' }}>
                    Emergency Contact
                  </h3>
                  <dl className="mb-0">
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <dt className="text-muted fw-normal">Name</dt>
                      <dd className="mb-0">{patient.emergencyContact?.name || '—'}</dd>
                    </div>
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <dt className="text-muted fw-normal">Phone</dt>
                      <dd className="mb-0">{patient.emergencyContact?.phone || '—'}</dd>
                    </div>
                    <div className="d-flex justify-content-between py-2">
                      <dt className="text-muted fw-normal">Relation</dt>
                      <dd className="mb-0">{patient.emergencyContact?.relation || '—'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PatientLayout>
  );
}

export default PatientProfile;
